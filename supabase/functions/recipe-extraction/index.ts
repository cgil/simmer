import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.55.1/mod.ts";
import { z } from "https://deno.land/x/zod@v3.24.1/mod.ts";
import { zodResponseFormat } from 'https://deno.land/x/openai@v4.55.1/helpers/zod.ts';
import { corsHeaders } from "../_shared/cors.ts";

// Define Zod schemas
const TimingSchema = z.object({
    min: z.number(),
    max: z.number(),
    units: z.literal('minutes')
}).nullable();

const StepSchema = z.object({
    text: z.string(),
    timing: TimingSchema
});

const InstructionSectionSchema = z.object({
    section_title: z.string(),
    steps: z.array(StepSchema)
});

const IngredientSchema = z.object({
    name: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    notes: z.string().nullable()
});

const TimeEstimateSchema = z.object({
    prep: z.number(),
    cook: z.number(),
    total: z.number()
});

const RecipeSchema = z.object({
    title: z.string(),
    description: z.string(),
    servings: z.number(),
    images: z.array(z.string()),
    ingredients: z.array(IngredientSchema),
    instructions: z.array(InstructionSectionSchema),
    notes: z.array(z.string()),
    tags: z.array(z.string()),
    time_estimate: TimeEstimateSchema
});

interface ExtractedContent {
    text: string;
    images: string[];
}

function extractMainContent(html: string): ExtractedContent {
    // Extract image URLs before removing HTML
    const imageUrls: string[] = [];
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
        const url = match[1];
        if (url && !url.startsWith('data:')) { // Skip data URLs
            imageUrls.push(url);
        }
    }

    // Remove script and style tags and their content
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove all HTML tags except some basic formatting
    html = html.replace(/<[^>]+>/g, ' ');

    // Remove extra whitespace
    html = html.replace(/\s+/g, ' ').trim();

    // Decode HTML entities
    html = html.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'");

    return {
        text: html,
        images: imageUrls.slice(0, 6)  // Limit to 6 images
    };
}

const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                ...corsHeaders,
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    try {
        const openai = new OpenAI({
            apiKey: Deno.env.get("OPENAI_API_KEY") || "",
        });

        const { url } = await req.json();

        if (!url) {
            throw new Error("URL is required");
        }

        try {
            // Fetch webpage content
            const response = await fetch(url);
            const html = await response.text();

            // Extract main content and images
            const { text: mainContent, images } = extractMainContent(html);

            // Extract recipe using OpenAI with Zod schema
            const completion = await openai.chat.completions.create({
                model: isDevelopment ? "gpt-4o" : "gpt-4o",
                response_format: zodResponseFormat(RecipeSchema, "recipe_extraction"),
                messages: [
                    {
                        role: 'system',
                        content: `You are a recipe extraction expert. Extract recipe information from the following text into a structured JSON format.
                        Follow these rules strictly:
                        - Maintain exact measurements and units
                        - Split instructions into logical sections
                        - Identify timing information in steps
                        - Generate relevant tags (max 7)
                        - Extract serving size
                        - The title should be concise and descriptive. It should be a few words that captures the main idea of the recipe.
                        - The description should be a concise and descriptive sentence that describes the recipe.
                        - If information is missing, use null (not undefined) rather than guessing.
                        - Always return the necessary fields in the schema, set as null if there's no information.
                        - Ingredient units must be in the following style and always plural where possible:
                            - "cups"
                            - "tablespoons"
                            - "teaspoons"
                            - "ounces"
                            - "pounds"
                            - "quarts"
                        - The timing unit should always be in "minutes"
                        - When timing info is available, the timing min and max should always be in minutes
                        - Use the following image URLs in your response: ${JSON.stringify(images)}
                        - For the images list, pick a maximum of 5 images relevant to the recipe, and avoid duplicates, including duplicates at different sizes.
                        - Tags should be relevant to the recipe and should be thoughtful, such as as the following but think of tags specific to the recipe:
                            - "Healthy"
                            - "Low Calorie"
                            - "Main Dish"
                            - "Italian"
                        - Notes should be about the recipe or the preparation, have them be concise, friendly, helpful, and thoughtful. Only add them if they provide additional information and value to the recipe.
                        - Section titles should be concise and descriptive. They should be a few words that captures the main idea of the section such as:
                            - "Marinating the Chicken"
                            - "Making the Sauce"
                        `
                    },
                    {
                        role: 'user',
                        content: mainContent,
                    },
                ],
                temperature: 0.2,
            });

            const result = completion.choices[0].message?.content;
            if (!result) {
                throw new Error("No content in response");
            }

            // Parse and validate the response
            const parsedResult = JSON.parse(result);
            const validatedRecipe = RecipeSchema.parse(parsedResult);

            return new Response(
                JSON.stringify(validatedRecipe),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        } catch (error) {
            console.error("Error details:", error);
            throw new Error(`Recipe extraction failed: ${error.message}`);
        }
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error occurred",
            }),
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
