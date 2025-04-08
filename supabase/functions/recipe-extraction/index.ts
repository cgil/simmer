import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.55.1/mod.ts";
import { zodResponseFormat } from "https://deno.land/x/openai@v4.55.1/helpers/zod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
    generateId,
    IngredientWithId,
    InstructionSection,
    RecipeSchema,
    validateIngredientMentions,
} from "../_shared/recipe-schemas.ts";

// Update the RawRecipe interface to include id property
interface RawIngredient {
    name: string;
    quantity: number | null;
    unit: string | null;
    notes: string | null;
}

interface RawInstructionSection {
    section_title: string;
    steps: {
        text: string;
        timing: { min: number; max: number; units: string } | null;
    }[];
}

interface RawRecipe {
    title: string;
    ingredients: RawIngredient[];
    instructions: RawInstructionSection[];
    id?: string; // Make id optional since we add it later
}

interface ExtractedContent {
    text: string;
    images: string[];
}

// Helper function to normalize image URLs for better deduplication
function normalizeImageUrl(url: string): string {
    try {
        // Parse the URL
        const parsedUrl = new URL(url);

        // Get the pathname (file path)
        let pathname = parsedUrl.pathname;

        // Remove sizing parameters from the path (common in CDN URLs)
        // Example: /image-800x600.jpg -> /image.jpg
        pathname = pathname.replace(/-\d+x\d+(\.[a-zA-Z0-9]+)$/, "$1");

        // Remove quality indicators
        pathname = pathname.replace(/-quality\d+(\.[a-zA-Z0-9]+)$/, "$1");

        // For WordPress images, remove size indicators
        // Example: /image-large.jpg -> /image.jpg
        pathname = pathname.replace(
            /-(large|medium|small|thumbnail)(\.[a-zA-Z0-9]+)$/,
            "$2",
        );

        // Return just the path for comparison (ignore query params and fragments)
        return pathname;
    } catch {
        // If URL parsing fails, return the original URL
        return url;
    }
}

function extractMainContent(html: string, pageUrl: string): ExtractedContent {
    // Extract image URLs before removing HTML
    const imageUrls: string[] = [];
    const parsedUrl = new URL(pageUrl);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

    // Extract regular image src attributes with improved regex
    // This handles various image attributes: src, data-src, data-original, data-lazy-src
    const imgRegex =
        /<img[^>]+(src|data-src|data-original|data-lazy-src)=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
        const url = match[2];
        if (url && !url.startsWith("data:")) { // Skip data URLs
            const fullUrl = resolveUrl(url, baseUrl, parsedUrl.pathname);

            // Check if this is likely a recipe image
            if (isValidImageUrl(fullUrl)) {
                imageUrls.push(fullUrl);
            }
        }
    }

    // Also extract images from srcset attributes
    const srcsetRegex = /<img[^>]+srcset=["']([^"']+)["'][^>]*>/gi;
    while ((match = srcsetRegex.exec(html)) !== null) {
        const srcsetValue = match[1];
        if (srcsetValue) {
            // Extract the URLs from the srcset value (format: "url width, url width, ...")
            const srcsetUrls = srcsetValue.split(",")
                .map((part) => part.trim().split(/\s+/)[0]) // Get the URL part before the width
                .filter((url) => url && !url.startsWith("data:"));

            // Process each URL
            srcsetUrls.forEach((url) => {
                const fullUrl = resolveUrl(url, baseUrl, parsedUrl.pathname);
                if (isValidImageUrl(fullUrl)) {
                    imageUrls.push(fullUrl);
                }
            });
        }
    }

    // Extract from data-srcset attributes (common in lazy-loaded images)
    const dataSrcsetRegex = /<img[^>]+data-srcset=["']([^"']+)["'][^>]*>/gi;
    while ((match = dataSrcsetRegex.exec(html)) !== null) {
        const srcsetValue = match[1];
        if (srcsetValue) {
            const srcsetUrls = srcsetValue.split(",")
                .map((part) => part.trim().split(/\s+/)[0])
                .filter((url) => url && !url.startsWith("data:"));

            srcsetUrls.forEach((url) => {
                const fullUrl = resolveUrl(url, baseUrl, parsedUrl.pathname);
                if (isValidImageUrl(fullUrl)) {
                    imageUrls.push(fullUrl);
                }
            });
        }
    }

    // Also look for JSON-LD structured data which often contains the best recipe images
    const jsonLdRegex =
        /<script type="application\/ld\+json">([^<]+)<\/script>/g;
    let jsonLdMatch;
    while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
        try {
            const jsonLdContent = jsonLdMatch[1].trim();
            const jsonData = JSON.parse(jsonLdContent);

            // Check for recipe schema
            if (
                jsonData &&
                (jsonData["@type"] === "Recipe" ||
                    (Array.isArray(jsonData["@type"]) &&
                        jsonData["@type"].includes("Recipe")))
            ) {
                if (jsonData.image) {
                    // Handle both string and array image formats
                    const images = Array.isArray(jsonData.image)
                        ? jsonData.image
                        : [jsonData.image];
                    images.forEach((img: { url?: string } | string) => {
                        const imgUrl = typeof img === "string" ? img : img.url;
                        if (imgUrl && typeof imgUrl === "string") {
                            const fullUrl = resolveUrl(
                                imgUrl,
                                baseUrl,
                                parsedUrl.pathname,
                            );
                            if (isValidImageUrl(fullUrl)) {
                                // Prioritize schema images by adding them to the front
                                imageUrls.unshift(fullUrl);
                            }
                        }
                    });
                }
            }
        } catch {
            // Ignore JSON parsing errors
        }
    }

    // Remove script and style tags and their content
    html = html.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        "",
    );
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

    // Remove all HTML tags except some basic formatting
    html = html.replace(/<[^>]+>/g, " ");

    // Remove extra whitespace
    html = html.replace(/\s+/g, " ").trim();

    // Decode HTML entities
    html = html.replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");

    // Advanced deduplication using normalized URLs
    const seenNormalizedUrls = new Set<string>();
    const uniqueImages: string[] = [];

    // Process in reverse so JSON-LD images (which are unshifted to the front) are prioritized
    // This preserves the priority of structured data images
    for (const imageUrl of imageUrls) {
        const normalizedUrl = normalizeImageUrl(imageUrl);

        // Check for similar images based on normalized path
        if (!seenNormalizedUrls.has(normalizedUrl)) {
            seenNormalizedUrls.add(normalizedUrl);
            uniqueImages.push(imageUrl); // Keep the original URL for display
        }
    }

    // Prefer higher quality images (typically larger file sizes) when possible
    const sortedImages = uniqueImages.slice(0, 10).sort((a, b) => {
        // Extract size indicators if present in filename (e.g., -800x600)
        const sizeA = a.match(/-(\d+)x(\d+)/);
        const sizeB = b.match(/-(\d+)x(\d+)/);

        if (sizeA && sizeB) {
            // Compare by total pixels if both have size indicators
            const pixelsA = parseInt(sizeA[1]) * parseInt(sizeA[2]);
            const pixelsB = parseInt(sizeB[1]) * parseInt(sizeB[2]);
            // Prefer larger images (more pixels)
            return pixelsB - pixelsA;
        }

        // If no size indicators, prefer images that don't have size-related query params
        // (often the original/full-size images)
        const hasResizeParamsA = a.includes("resize=") ||
            a.includes("width=") || a.includes("size=");
        const hasResizeParamsB = b.includes("resize=") ||
            b.includes("width=") || b.includes("size=");

        if (hasResizeParamsA !== hasResizeParamsB) {
            return hasResizeParamsA ? 1 : -1; // Prefer URLs without resize parameters
        }

        return 0; // No clear preference
    });

    return {
        text: html,
        images: sortedImages.slice(0, 6), // Limit to 6 images after deduplication and sorting
    };
}

// Helper function to resolve relative URLs
function resolveUrl(url: string, baseUrl: string, pathname: string): string {
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url; // Already absolute
    }

    if (url.startsWith("//")) {
        // Protocol-relative URL
        return `https:${url}`;
    }

    if (url.startsWith("/")) {
        // Root-relative URL
        return `${baseUrl}${url}`;
    }

    // Path-relative URL
    const pathParts = pathname.split("/");
    pathParts.pop(); // Remove the filename part
    const directory = pathParts.join("/");
    return `${baseUrl}${directory}/${url}`;
}

// Helper function to check if URL is a valid image
function isValidImageUrl(url: string): boolean {
    // Check if it has a valid image extension
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const urlLower = url.toLowerCase();

    // If URL has a query string or no extension, try to determine from path or query params
    const hasValidExtension = validExtensions.some((ext) =>
        urlLower.endsWith(ext) ||
        urlLower.includes(`${ext}?`) ||
        urlLower.includes(`${ext}&`) ||
        urlLower.match(new RegExp(`${ext.replace(".", "\\.")}[#?&]`))
    );

    // Check for common CDN patterns that may not have extensions
    const hasValidCdnPattern = urlLower.includes("/images/") ||
        urlLower.includes("/photos/") ||
        urlLower.includes("/uploads/") ||
        urlLower.includes("/wp-content/uploads/") ||
        urlLower.includes("/cdn/") ||
        urlLower.match(/\/(img|image)\/.*[?&]/) ||
        urlLower.includes("cloudfront.net") ||
        urlLower.includes("cloudinary.com");

    // Skip common tracking pixels, icons, and tiny images
    const isTrackingPixel = urlLower.includes("tracking") ||
        urlLower.includes("pixel") ||
        urlLower.includes("1x1") ||
        urlLower.includes("favicon") ||
        urlLower.includes("icon") ||
        urlLower.includes("badge") ||
        urlLower.includes("logo-small") ||
        urlLower.includes("small-logo") ||
        urlLower.includes("button") ||
        urlLower.includes("avatar") ||
        urlLower.includes("analytics");

    // Skip social media icons
    const isSocialIcon = urlLower.includes("facebook") ||
        urlLower.includes("twitter") ||
        urlLower.includes("instagram") ||
        urlLower.includes("pinterest") ||
        urlLower.includes("social") ||
        urlLower.includes("share");

    return (hasValidExtension || hasValidCdnPattern) && !isTrackingPixel &&
        !isSocialIcon;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                ...corsHeaders,
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    try {
        const { url } = await req.json();

        if (!url) {
            throw new Error("URL is required");
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
            "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check cache first
        const { data: cachedData, error: cacheError } = await supabase.rpc(
            "get_or_set_recipe_cache",
            {
                p_url: url,
                p_data: null,
            },
        );

        if (cacheError) {
            console.error("Cache error:", cacheError);
        } else if (cachedData) {
            // Return cached data if available
            return new Response(JSON.stringify(cachedData), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                    "X-Cache": "HIT",
                },
            });
        }

        // If no cache hit, proceed with extraction
        const openai = new OpenAI({
            apiKey: Deno.env.get("OPENAI_API_KEY") || "",
        });

        try {
            // Fetch webpage content
            const response = await fetch(url);
            const html = await response.text();

            // Extract main content and images
            const { text: mainContent, images } = extractMainContent(html, url);

            // Extract recipe using OpenAI with Zod schema
            const completion = await openai.chat.completions.create({
                model: "o3-mini",
                response_format: zodResponseFormat(
                    RecipeSchema,
                    "recipe_extraction",
                ),
                messages: [
                    {
                        role: "system",
                        content:
                            `You are a recipe extraction expert. Extract recipe information from the following text into a structured JSON format.
                            Follow these rules strictly:
                            - Maintain exact measurements and units
                            - You must always extract the correct unit type for each ingredient
                            - Split instructions into logical sections
                            - Identify timing information in steps
                            - Generate relevant tags (min 4, max 10)
                            - Extract serving size
                            - The title should be concise and descriptive. It should be a few words that captures the main idea of the recipe.
                            - The description should be a concise and descriptive sentence that describes the recipe.
                            - If information is missing, use null (not undefined) rather than guessing.
                            - Always return the necessary fields in the schema, set as null if there's no information.
                            - Ingredient names should be clear and concise, as they will be used to generate unique IDs.
                            - Section titles should be clear and concise, as they will be used to generate unique IDs.
                            - Avoid using special characters in ingredient names, section titles, and the recipe title.
                            - Look for and identify timing information for each step. Do not make up any timing information.
                            - Keep ingredient names specific but consistent (e.g., use "chicken breast" not just "chicken")

                            CRITICAL INSTRUCTION FOR INGREDIENT MENTIONS:
                            - In instruction steps, you MUST format ingredient mentions using this exact format: @[ingredient_name](ingredient_id)
                            - The ingredient_id should be a kebab-case version of the ingredient name (lowercase with hyphens instead of spaces)
                            - For example: "Add @[olive oil](olive-oil) and @[garlic](garlic) to the pan"
                            - You must ensure every ingredient mentioned in the instructions has this formatting
                            - For compound ingredients like "lemon juice" or "olive oil", use the full name in both the display and ID parts
                            - Example: "@[lemon juice](lemon-juice)" NOT "@[lemon](lemon) juice"
                            - Make sure there are no typos or errors in the ingredient names or IDs
                            - The name in the mention MUST match exactly the name in the ingredients list
                            - Every single ingredient mentioned in any instruction step must have this formatting

                            Resting Time Rules:
                            - Look for and identify any resting, proofing, marinating, chilling, cooling, or other active waiting times in the recipe
                            - Include these in the time_estimate.rest field (in minutes)
                            - Examples of resting times to identify:
                                * "Let dough rise for 1 hour" -> rest: 60
                                * "Marinate chicken overnight (8-12 hours)" -> rest: 480 (use minimum time)
                                * "Chill in refrigerator for 30 minutes" -> rest: 30
                                * "Allow to cool completely (about 45 minutes)" -> rest: 45
                                * "Rest meat for 10 minutes before slicing" -> rest: 10
                                * "Proof the dough until doubled in size (1-2 hours)" -> rest: 60
                            - For overnight or long marination, use the minimum suggested time or 8 hours (480 minutes) if no time range given
                            - If multiple resting periods exist, add them together for the total rest time
                            - Always convert resting times to minutes

                            - Ingredient units must be in the following style and always plural where possible, here are a few examples:
                                - "cups"
                                - "tablespoons"
                                - "teaspoons"
                                - "pounds"
                                - "ounces"
                                - "grams"
                                - "kilograms"
                                - "milliliters"
                                - "liters"
                                - "cloves"
                                - "pinch"
                                - "slices"
                                - "pieces"
                                - "drizzle"
                                - "whole"
                                - "bunches"
                                - "large" (as in large eggs)
                                - "stalks" (as in celery stalks)
                            - If the unit type is not listed above, use your best judgement to determine the correct unit type.
                            - The timing unit should always be in "minutes"
                            - When timing info is available, the timing min and max should always be in minutes
                            - You must Ensure steps always include the necessary and correct timing information, including resting times. Ex. "Bake in the preheated oven until edges are golden, 8 to 10 minutes."
                            - Use the following image URLs in your response: ${
                                JSON.stringify(images)
                            }
                            - For the images list, pick a maximum of 10 images relevant to the recipe, and avoid duplicates, including duplicates at different size, opt for the best quality images.
                            - Tags should be relevant to the recipe and should be thoughtful and provide value to a user searching for a recipe, such as as the following examples but think of tags specific to the recipe:
                                - "Healthy"
                                - "Low Calorie"
                                - "Main Dish"
                                - "Italian"
                                - "Quick and Easy"
                                - "One Pot"
                                - "Soup"
                                - "Thanksgiving"
                            - Tags should span at least 2 distinct categories such as meal type, dietary label, cuisine, difficulty, occasion, etc.
                            - Notes should be about the recipe, the preparation, how to serve, or store what's left. Have notes be concise, friendly, helpful, and thoughtful. Only add them if they provide additional information and value to the recipe.
                            - Notes should avoid restating instructions. Instead, highlight pro tips, substitutions, or storage advice.
                            - Section titles should be concise and descriptive. They should be a few words that captures the main idea of the section such as:
                                - "Marinating the Chicken"
                                - "Making the Sauce"
                            `,
                    },
                    {
                        role: "user",
                        content: mainContent,
                    },
                ],
                // temperature: 0.2, // Does not work with o3-mini
            });

            const result = completion.choices[0].message?.content;
            if (!result) {
                throw new Error("No content in response");
            }

            // Parse and validate the response
            const parsedResult = JSON.parse(result) as RawRecipe;

            // Generate IDs for the recipe and ingredients
            parsedResult.id = generateId(parsedResult.title);

            // Generate IDs for ingredients ensuring they follow the kebab-case format
            parsedResult.ingredients = parsedResult.ingredients.map(
                (ingredient: RawIngredient) => ({
                    ...ingredient,
                    id: ingredient.name.toLowerCase().replace(/\s+/g, "-"),
                }),
            );

            // Generate IDs for instruction sections
            parsedResult.instructions = parsedResult.instructions.map(
                (section: RawInstructionSection) => ({
                    ...section,
                    id: generateId(section.section_title),
                }),
            );

            // Add ingredient IDs to instruction steps with mentions
            const instructionsWithIds = parsedResult.instructions.map(
                (section: RawInstructionSection) => ({
                    ...section,
                    id: generateId(section.section_title),
                }),
            ) as InstructionSection[];

            // Validate that all ingredient mentions have proper format and references
            parsedResult.instructions = validateIngredientMentions(
                instructionsWithIds,
                parsedResult.ingredients as IngredientWithId[],
            );

            const validatedRecipe = RecipeSchema.parse(parsedResult);

            // Store in cache
            await supabase.rpc("get_or_set_recipe_cache", {
                p_url: url,
                p_data: validatedRecipe,
            });

            return new Response(
                JSON.stringify(validatedRecipe),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                        "X-Cache": "MISS",
                    },
                },
            );
        } catch (error: unknown) {
            console.error("Error details:", error);
            const errorMessage = error instanceof Error
                ? error.message
                : "Recipe extraction failed for an unknown reason";
            throw new Error(`Recipe extraction failed: ${errorMessage}`);
        }
    } catch (error: unknown) {
        console.error("Error:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error occurred";

        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    }
});
