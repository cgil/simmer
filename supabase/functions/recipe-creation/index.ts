import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.103.0";
import { zodResponseFormat } from "https://deno.land/x/openai@v4.55.1/helpers/zod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { decode as base64Decode } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import {
    generateId,
    IngredientWithId,
    InstructionSection,
    RecipeSchema,
    validateIngredientMentions,
} from "../_shared/recipe-schemas.ts";
import { generateStyledRecipeImage } from "../_shared/image-generation.ts";
import { uploadDataToGCS } from "../_shared/gcs-upload.ts";

// Simple environment-aware logger
const isProduction = Deno.env.get("ENVIRONMENT") === "production";
const logger = {
    log: (...args: unknown[]) => {
        if (!isProduction) {
            console.log("[Info]", ...args);
        }
    },
    warn: (...args: unknown[]) => {
        if (!isProduction) {
            console.warn("[Warn]", ...args);
        }
    },
    error: (...args: unknown[]) => {
        // Always log errors
        console.error("[Error]", ...args);
    },
};

// Minimal logging for request start if needed in future
serve(async (req) => {
    // --- Logging Start ---
    try {
        const headerObject: Record<string, string> = {};
        req.headers.forEach((value, key) => {
            // Sanitize sensitive headers like Authorization for logging
            if (key.toLowerCase() === "authorization") {
                headerObject[key] = value
                    ? `Bearer [present, length=${value.length - 7}]`
                    : "[missing]";
            } else if (key.toLowerCase() === "apikey") {
                headerObject[key] = value
                    ? `[present, length=${value.length}]`
                    : "[missing]";
            } else {
                headerObject[key] = value;
            }
        });
        // Removed header logging
    } catch (e) {
        logger.error("Error logging request headers:", e);
    }
    // --- Logging End ---

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
        // Authenticate user first
        const authorization = req.headers.get("Authorization");
        if (!authorization) {
            logger.error(
                "Authorization header is missing from the incoming request.",
            );
            throw new Error("Missing authorization header");
        }
        const token = authorization.replace("Bearer ", "");

        // *** Initialize Supabase client WITHOUT global headers for auth ***
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

        if (!supabaseUrl || !supabaseAnonKey) {
            logger.error("Missing Supabase URL or Anon Key");
            throw new Error("Internal Server Error: Missing Supabase config");
        }

        // Initialize client with URL and Key ONLY
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // *** Use the token directly with getUser ***
        const { data: { user }, error: authError } = await supabase.auth
            .getUser(token); // Pass the token here

        if (authError || !user) {
            logger.error("Auth error (getUser):", authError);
            // Provide more specific error logging if available
            if (authError) {
                console.error(
                    "getUser Specific Error:",
                    authError.message,
                    authError.status,
                    authError.code,
                );
            }
            throw new Error("Unauthorized - Failed to validate token"); // More specific error
        }
        // Log success
        logger.log(`Successfully authenticated user: ${user.id}`);

        const { recipeIdea, originalPrompt } = await req.json();

        if (!recipeIdea || !recipeIdea.title || !recipeIdea.description) {
            throw new Error(
                "Recipe idea with title and description is required",
            );
        }

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: Deno.env.get("OPENAI_API_KEY") || "",
        });

        // Check cache first - optional but recommended
        const cacheKey = `recipe-creation:${
            recipeIdea.id || generateId(recipeIdea.title)
        }`;
        const { data: cachedData, error: cacheError } = await supabase
            .from("recipe_creation_cache")
            .select("data")
            .eq("key", cacheKey)
            .maybeSingle();

        if (!cacheError && cachedData?.data) {
            return new Response(JSON.stringify(cachedData.data), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                    "X-Cache": "HIT",
                },
            });
        }
        if (cacheError) {
            logger.error("Cache check error:", cacheError);
            // Proceed without cache, but log the error
        }

        // Define interfaces for the data structure before validation if needed
        interface RawIngredient {
            name: string;
            quantity?: number | null;
            unit?: string | null;
            notes?: string | null;
        }
        interface RawSection {
            section_title: string;
            steps: { text: string }[]; // Assuming steps have at least a text property
        }

        // --- Asynchronous Task Definitions ---

        // Task 1: Generate Recipe Details
        const generateRecipeDetails = async () => {
            try {
                const completion = await openai.chat.completions.create({
                    model: "o4-mini",
                    reasoning_effort: "medium",
                    response_format: zodResponseFormat(
                        RecipeSchema,
                        "recipe_creation",
                    ),
                    messages: [
                        {
                            role: "system",
                            content:
                                `You are a culinary expert specializing in recipe development for home cooks. Create a complete, detailed recipe based on the title and description provided, and the user's original prompt for a recipe idea.

        Follow these rules strictly:
        - Create exactly ONE recipe matching the title and description, and incorporating the user's original prompt for a recipe idea when it makes sense.
        - While staying true to the desired recipe, opt for the healthier version of the recipe when it makes sense.
        - The recipe should be realistic, practical, and suitable for home cooking.
        - The title should be concise and descriptive. It should be a few words that captures the main idea of the recipe. A title was already provided, but you can modify it slightly if needed to accurately reflect the recipe.
        - The description should be a concise and descriptive sentence that describes the recipe. A description was already provided, but you can modify it slightly if needed to accurately describe the recipe.
        - If information is must be omitted, use null (not undefined) rather than guessing.
        - Always return the necessary fields in the schema, set as null if there's no information.
        - Ingredient names should be clear and concise, as they will be used to generate unique IDs.
        - Section titles should be clear and concise, as they will be used to generate unique IDs.
        - Avoid using special characters in ingredient names, section titles, and the recipe title.
        - Keep ingredient names specific but consistent (e.g., use "chicken breast" not just "chicken")

        - Set default servings to 4 unless specified by the user's prompt or if the recipe naturally serves a different number
        - Create detailed, step-by-step instructions organized in logical sections for making the recipe
        - Create timing information in steps
        - Differentiate between prep, cook, and rest times. The timing must accurately reflect the recipe. Only include timing information if it's directly related to the recipe.
        - When important and necessary, include kitchen tools and equipment needed for the recipe within steps. Such as "Heat a cast iron skillet over medium heat" or "Whisk the eggs and milk in a bowl".
        - For heating instructions such as "Bake in the oven" or "Cook on the stove", include the temperature. Ex. "Bake at 350 degrees fahrenheit" or "Cook on medium heat".
        - Generate relevant tags (min 4, max 10)
        - Maintain exact measurements and units
        - You must always use the correct unit type for each ingredient
        - Provide ral and accurate time estimates for prep, cooking, and resting times
        - Return an empty array for images, don't make up any images

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
        - When ingredients are rendered in a step they will automatically show the quantity and unit type (if known), so do not include the quantity and unit type in the mention.
            - For example: "Add @[olive oil](olive-oil), where the quantity is 1 and the unit type is "tablespoons" will automatically show as "1 tablespoon of olive oil" in the step.
            - We wish to avoid showing something like "Add 2 tablespoons 2 tablespoons Maggi all-purpose seasoning" in the step.
            - For this reason, ingredients and units should be correctly captured in the ingredients list and not hard-coded into the steps.
        - If an ingredient must be listed more than once because it's used in multiple steps with different quantities, make sure to reference the correct ingredient with the correct quantity and unit type in each step.
        - Be careful to avoid subtle cases such as unit type "whole", quantity "1", and ingredient name "whole chicken", which will render as "1 whole whole chicken" in the step when referenced.
        - Limit quantities in ingredients to a maximum of 2 decimal places, such as 0.33, if it's a whole number don't include a decimal point. Such as 1, 1.5, 1.75.
        - Avoid unnecessarily repeating ingredients in the ingredients list where not necessary.

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

            Ingredient Rules:
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

            - Tags should be relevant to the recipe and should be thoughtful and provide value to a user searching for a recipe, such as as the following examples but think of tags specific to the recipe:
                - "Healthy"
                - "Low Calorie"
                - "Main Dish"
                - "Italian"
                - "One Pot"
                - "Soup"
                - "Thanksgiving"
            - Tags should span at least 2 distinct categories such as meal type, dietary label, cuisine, difficulty, occasion, etc.
            - Notes should be about the recipe, the preparation, how to serve, or store what's left. Have notes be concise, friendly, helpful, and thoughtful. Only add them if they provide additional information and value to the recipe.
            - Notes should avoid restating instructions. Instead, highlight pro tips, substitutions, or storage advice.
            - Section titles should be concise, unique, and descriptive. They should be a few words that captures the main idea of the section such as:
                - "Marinating the Chicken"
                - "Making the Sauce"
                - "Assembling the Quesadillas"
                - "Serving the Sushi"

            The recipe must be accurate, real, based on recommendations from culinary experts and other recipes.
            Think about how prep, ingredients, heat, cooking times, and other factors will affect the recipe and final product. Ensure the final set of instructions will actually yield the desired result.
            `,
                        },
                        {
                            role: "user",
                            content:
                                `Create a complete and accurate recipe based on this title, description, and original prompt:

                                Title: ${recipeIdea.title}
                                Description: ${recipeIdea.description}
                                Original Prompt: ${
                                    originalPrompt || "No user prompt provided"
                                }`, // Use originalPrompt here
                        },
                    ],
                });

                const result = completion.choices[0].message?.content;
                if (!result) {
                    throw new Error("No recipe content generated");
                }
                return JSON.parse(result);
            } catch (error) {
                logger.error("Error in generateRecipeDetails:", error);
                throw error;
            }
        };

        // Task 2: Generate and Upload Image
        const generateAndUploadImage = async () => {
            try {
                const imageDataUri = await generateStyledRecipeImage(
                    recipeIdea.title,
                    originalPrompt || recipeIdea.description,
                );

                // Check for a valid *JPEG* data URI (matching image-generation function)
                if (
                    !imageDataUri ||
                    !imageDataUri.startsWith("data:image/jpeg;base64,")
                ) {
                    logger.warn( // Still useful to warn if image gen fails
                        "No valid image data URI generated (expected JPEG).",
                    );
                    return null; // Indicate no image was generated/uploaded
                }

                // Decode base64 data
                const base64Data = imageDataUri.replace(
                    /^data:image\/jpeg;base64,/,
                    "",
                );
                const imageBytes = base64Decode(base64Data);
                const contentType = "image/jpeg"; // Set correct content type for upload

                // Generate GCS path
                const gcsBucketName = Deno.env.get("GCS_BUCKET_NAME");
                if (!gcsBucketName) {
                    logger.error("GCS_BUCKET_NAME not set for image upload.");
                    throw new Error(
                        "Server configuration error for image upload.",
                    );
                }
                const fileName = `${crypto.randomUUID()}.jpeg`;
                const destinationPath = `uploads/${user.id}/${fileName}`;

                // Upload directly to GCS
                const permanentUrl = await uploadDataToGCS(
                    imageBytes,
                    destinationPath,
                    contentType,
                );
                return permanentUrl;
            } catch (error) {
                logger.error("Error in generateAndUploadImage:", error);
                return null; // Return null on error to not block recipe creation
            }
        };

        // --- Execute Tasks Concurrently ---
        const [detailsResult, imageResult] = await Promise.allSettled([
            generateRecipeDetails(),
            generateAndUploadImage(),
        ]);

        // --- Process Results ---

        // Handle Recipe Details
        if (detailsResult.status === "rejected") {
            logger.error(
                "Recipe details generation failed:",
                detailsResult.reason,
            );
            throw new Error("Failed to generate recipe details");
        }
        const recipeData = detailsResult.value;

        // Generate IDs and validate
        recipeData.id = generateId(recipeData.title);
        recipeData.ingredients = (recipeData.ingredients || []).map(
            (ingredient: RawIngredient) => ({
                ...ingredient,
                id: generateId(ingredient.name),
                quantity: ingredient.quantity ?? null,
                unit: ingredient.unit ?? null,
                notes: ingredient.notes ?? null,
            }),
        ) as IngredientWithId[];
        recipeData.instructions = (recipeData.instructions || []).map(
            (section: RawSection) => ({
                ...section,
                id: generateId(section.section_title),
                steps: (section.steps || []).map((step) => ({ ...step })),
            }),
        ) as InstructionSection[];

        recipeData.instructions = validateIngredientMentions(
            recipeData.instructions,
            recipeData.ingredients,
        );

        const validatedRecipe = RecipeSchema.parse(recipeData);

        // Handle Image Result
        let permanentImageUrl: string | null = null;
        if (imageResult.status === "fulfilled") {
            permanentImageUrl = imageResult.value;
        } else {
            logger.error(
                "Image generation/upload task rejected:",
                imageResult.reason,
            );
        }

        if (permanentImageUrl) {
            validatedRecipe.images = [permanentImageUrl];
        } else {
            validatedRecipe.images = []; // Ensure images is an empty array if no image was generated/uploaded
        }

        // Store in cache
        try {
            await supabase
                .from("recipe_creation_cache")
                .upsert({
                    key: cacheKey,
                    data: validatedRecipe,
                    created_at: new Date().toISOString(),
                });
        } catch (cacheWriteError) {
            logger.error("Cache write error:", cacheWriteError);
        }

        return new Response(JSON.stringify(validatedRecipe), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        });
    } catch (error: unknown) {
        logger.error("Request failed:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error occurred";
        const status = errorMessage === "Unauthorized" ? 401 : 400; // Or 500 for server errors

        return new Response(JSON.stringify({ error: errorMessage }), {
            status: status,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        });
    }
});
