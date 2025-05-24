import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.98.0";
import { zodResponseFormat } from "https://deno.land/x/openai@v4.55.1/helpers/zod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.24.1/mod.ts";
import {
    SubstituteIngredient,
    SubstituteOptionSchema,
} from "../_shared/recipe-schemas.ts";

// Define the input schema
const SubstitutionRequestSchema = z.object({
    ingredientId: z.string(),
    ingredientName: z.string(),
    ingredientQuantity: z.number().nullable().optional(),
    ingredientUnit: z.string().nullable().optional(),
    originalServings: z.number(),
    currentServings: z.number(),
    recipeTitle: z.string().optional(),
    recipeDescription: z.string().optional(),
});

// Response schema is now an object that contains the array of substitute options
const SubstitutionResponseSchema = z.object({
    substitutions: z.array(SubstituteOptionSchema),
});

// Cache key generator
function generateCacheKey(params: {
    ingredientId: string;
    ingredientQuantity?: number | null;
    ingredientUnit?: string | null;
    originalServings: number;
    recipeTitle?: string;
}): string {
    const {
        ingredientId,
        ingredientQuantity,
        ingredientUnit,
        originalServings,
        recipeTitle,
    } = params;

    // Include recipe title in the cache key if available
    const titleHash = recipeTitle ? `:${generateHash(recipeTitle)}` : "";

    return `ingredient-substitution:${ingredientId}:${originalServings}:${
        ingredientQuantity || "null"
    }:${ingredientUnit || "null"}${titleHash}`;
}

// Simple hash function for titles
function generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

// Environment-aware logger
const isProduction = Deno.env.get("ENVIRONMENT") === "production";
const logger = {
    log: (...args: unknown[]) => {
        if (!isProduction) {
            console.log(...args);
        }
    },
    error: (...args: unknown[]) => {
        console.error(...args);
    },
};

// Define interface for cache data
interface SubstituteOption {
    ingredients: SubstituteIngredient[];
    instructions?: string | null;
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
        // Parse and validate request
        const requestData = await req.json();
        const validatedRequest = SubstitutionRequestSchema.parse(requestData);
        const {
            ingredientId,
            ingredientName,
            ingredientQuantity,
            ingredientUnit,
            originalServings,
            currentServings,
            recipeTitle,
            recipeDescription,
        } = validatedRequest;

        // Initialize Supabase client for caching
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
            "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check cache first
        const cacheKey = generateCacheKey({
            ingredientId,
            ingredientQuantity,
            ingredientUnit,
            originalServings,
            recipeTitle,
        });

        const { data: cachedData, error: cacheError } = await supabase
            .from("recipe_substitution_cache")
            .select("data")
            .eq("key", cacheKey)
            .maybeSingle();

        if (!cacheError && cachedData?.data) {
            // Scale quantities based on current serving size
            const scalingFactor = currentServings / originalServings;
            const scaledSubstitutes = cachedData.data.map((
                substituteOption: SubstituteOption,
            ) => ({
                ...substituteOption,
                ingredients: substituteOption.ingredients.map((
                    ingredient: SubstituteIngredient,
                ) => ({
                    ...ingredient,
                    quantity: ingredient.quantity !== null
                        ? Number(
                            (ingredient.quantity * scalingFactor).toFixed(2),
                        )
                        : null,
                })),
            }));

            return new Response(JSON.stringify(scaledSubstitutes), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                    "X-Cache": "HIT",
                },
            });
        }

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: Deno.env.get("OPENAI_API_KEY") || "",
        });

        // Generate substitution options using OpenAI
        const completion = await openai.chat.completions.create({
            model: "o4-mini",
            reasoning_effort: "low",
            response_format: zodResponseFormat(
                SubstitutionResponseSchema,
                "ingredient_substitution",
            ),
            messages: [
                {
                    role: "system",
                    content:
                        `You are a culinary expert specializing in ingredient substitutions for recipes. Your task is to provide accurate, real-world substitutions for cooking ingredients.

                        Follow these rules strictly:
                        - Provide up to 3 high-quality substitution options for the requested ingredient. If fewer than 3 good options exist, return fewer.
                        - If no suitable substitutions exist, return an empty array. Do not make up fake substitutions.
                        - Each substitution option can contain multiple ingredients (for complex substitutions).
                        - Only provide substitutions that would realistically work in the recipe context.
                        - Substitution options must maintain similar flavor profiles, textures, or chemical properties where possible.
                        - Include brief instructions ONLY when the substitution requires special handling or preparation.
                        - Keep instructions very short and concise, and only include them if absolutely necessary.
                        - Do not include obvious instructions like "Use instead of the original ingredient".
                        - Do not make up fake substitutions.
                        - Ensure quantities and units are accurate and appropriate for cooking measurements.
                        - For all unit types, use the plural form where appropriate (e.g., "cups", "tablespoons", "teaspoons").
                        - For quantities, include at most 2 decimal places, and if it's a whole number don't include decimal points (e.g., 1, 1.5, 1.75).
                        - Each substitute ingredient must have an id (kebab-case version of the name).
                        - Sort substitution options in order of how closely they match the original ingredient (best match first).

                        - Ingredient units must be in the following style and always plural where possible, here are a few examples:
                            - "cups"
                            - "tablespoons"
                            - "teaspoons"
                            - "ounces"
                            - "pounds"
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
                        - If the unit type is not listed above, use your best judgement to determine the correct unit type.

                        Focus on providing practical, widely-available substitutions that home cooks would likely have access to.
                        Return your response as a JSON object with a 'substitutions' property containing an array of substitute options.`,
                },
                {
                    role: "user",
                    content: `I need substitution options for this ingredient:

                    Ingredient name: ${ingredientName}
                    ${
                        ingredientQuantity !== null &&
                            ingredientQuantity !== undefined
                            ? `Quantity: ${ingredientQuantity}`
                            : "Quantity: (unspecified)"
                    }
                    ${
                        ingredientUnit
                            ? `Unit: ${ingredientUnit}`
                            : "Unit: (unspecified)"
                    }
                    Original recipe serving size: ${originalServings}

                    ${recipeTitle ? `Recipe title: ${recipeTitle}` : ""}
                    ${
                        recipeDescription
                            ? `Recipe description: ${recipeDescription}`
                            : ""
                    }

                    Please provide up to 3 quality substitution options following the specified format. The quantities should be calculated for a serving size of ${originalServings}, and given the quantity of the original ingredient.`,
                },
            ],
        });

        const result = completion.choices[0].message?.content;
        if (!result) {
            throw new Error("No content in response");
        }

        // Parse and validate the AI response
        const parsedResult = JSON.parse(result);
        const validatedResponse = SubstitutionResponseSchema.parse(
            parsedResult,
        );
        const validatedSubstitutes = validatedResponse.substitutions;

        // Scale quantities based on current serving size
        const scalingFactor = currentServings / originalServings;
        const scaledSubstitutes = validatedSubstitutes.map((
            substituteOption,
        ) => ({
            ...substituteOption,
            ingredients: substituteOption.ingredients.map((ingredient) => ({
                ...ingredient,
                quantity: ingredient.quantity !== null
                    ? Number((ingredient.quantity * scalingFactor).toFixed(2))
                    : null,
            })),
        }));

        // Store original (unscaled) result in cache
        try {
            await supabase
                .from("recipe_substitution_cache")
                .upsert({
                    key: cacheKey,
                    data: validatedSubstitutes,
                    created_at: new Date().toISOString(),
                });
        } catch (cacheError) {
            // Log but don't fail if caching fails
            logger.error("Cache error:", cacheError);
        }

        return new Response(JSON.stringify(scaledSubstitutes), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "X-Cache": "MISS",
            },
        });
    } catch (error: unknown) {
        logger.error("Error:", error);
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
