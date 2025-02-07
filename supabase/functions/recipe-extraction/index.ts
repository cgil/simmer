import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.24.1/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
};

// Define Zod schemas
const TimingSchema = z.object({
    min: z.number().nullable(),
    max: z.number().nullable(),
    units: z.literal('minutes').nullable()
});

const StepSchema = z.object({
    text: z.string(),
    timing: TimingSchema.nullable()
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

interface RequestBody {
    url: string;
}

function extractMainContent(html: string): string {
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

    return html;
}

const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";

serve(async (req) => {
    try {
        // Handle CORS
        if (req.method === "OPTIONS") {
            return new Response("ok", { headers: corsHeaders });
        }

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

            // Extract main content
            const mainContent = extractMainContent(html);

            // Extract recipe using OpenAI
            const completion = await openai.chat.completions.create({
                model: isDevelopment ? "gpt-3.5-turbo-1106" : "gpt-4",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: 'system',
                        content: `You are a recipe extraction expert. Extract recipe information from the following text into a structured JSON format.
                        Follow these rules strictly:
                        - Maintain exact measurements and units
                        - Split instructions into logical sections
                        - Identify timing information in steps
                        - Generate relevant tags
                        - Extract serving size
                        - The title should be concise and descriptive. It should be a few words that captures the main idea of the recipe.
                        - The description should be a concise and descriptive sentence that describes the recipe.
                        - If information is missing, use null rather than guessing.
                        - Ingredient units must be in the following style and always plural where possible:
                            - "cups"
                            - "tablespoons"
                            - "teaspoons"
                            - "ounces"
                            - "pounds"
                            - "quarts"
                        - The timing unit should always be in "minutes"
                        - The timing min and max should always be in minutes
                        - Extract images used in the url. Images should be returned as an array of URLs
                        - Tags should be relevant to the recipe and should be thoughtful such as:
                            - "Healthy"
                            - "Low Calorie"
                            - "Main Dish"
                            - "Italian"
                        - Have no more than the top 7 tags
                        - Notes should be a list of notes about the recipe or the preparation, have them be concise, friendly, helpful, and thoughtful. Only add them if they provide additional information and value to the recipe.
                        - Section titles should be concise and descriptive. They should be a single sentence that captures the main idea of the section such as:
                            - "Marinating the Chicken"
                            - "Making the Sauce"


                        Required JSON Schema:
                        {
                            "title": string,
                            "description": string,
                            "servings": number,
                            "images": string[],
                            "ingredients": [
                            {
                                "name": string,
                                "quantity": number | null,
                                "unit": string | null,
                                "notes": string | null
                            }
                            ],
                            "instructions": [
                            {
                                "section_title": string,
                                "steps": [
                                {
                                    "text": string,
                                    "timing": {
                                    "min": number,
                                    "max": number,
                                    "units": "minutes"
                                    } | null
                                }
                                ]
                            }
                            ],
                            "notes": string[],
                            "tags": string[],
                            "time_estimate": {
                            "prep": number,
                            "cook": number,
                            "total": number
                            }
                        }`
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
