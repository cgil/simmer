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

        // Initialize Supabase client for caching
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
            "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

        // Generate complete recipe using OpenAI with Zod schema
        const completion = await openai.chat.completions.create({
            model: "o3-mini",
            response_format: zodResponseFormat(
                RecipeSchema,
                "recipe_creation",
            ),
            messages: [
                {
                    role: "system",
                    content:
                        `You are a culinary expert specializing in recipe development. Create a complete, detailed recipe based on the title and description provided.

          Follow these rules strictly:
          - Create exactly ONE recipe matching the title and description
          - The recipe should be realistic, practical, and suitable for home cooking
          - Include all required information (title, description, servings, ingredients, instructions, notes, tags, time estimates)
          - Set default servings to 4 unless the recipe naturally serves a different number
          - Create detailed, step-by-step instructions organized in logical sections
          - Include 8-12 well-chosen ingredients with accurate quantities and units
          - Include 2-3 helpful recipe notes or tips
          - Generate 4-8 relevant tags
          - Provide realistic time estimates for prep, cooking, and resting
          - The total time should be the sum of prep, cook, and rest times
          - Use plural forms for units where appropriate (cups, tablespoons, teaspoons, etc.)
          - Return an empty array for images

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

          Be creative, thorough, and create a recipe that someone would be excited to cook and eat.`,
                },
                {
                    role: "user",
                    content:
                        `Create a complete recipe based on this title, description, and original prompt:

                        Title: ${recipeIdea.title}
                        Description: ${recipeIdea.description}
                        Original Prompt: ${
                            originalPrompt || "No additional context provided"
                        }`,
                },
            ],
        });

        const result = completion.choices[0].message?.content;
        if (!result) {
            throw new Error("No content in response");
        }

        // Parse and validate the response
        const parsedResult = JSON.parse(result);

        // Generate IDs for the recipe and instruction sections
        parsedResult.id = generateId(parsedResult.title);

        // Ensure IDs are properly formatted for instruction sections
        parsedResult.instructions = parsedResult.instructions.map(
            (section: InstructionSection) => ({
                ...section,
                id: generateId(section.section_title),
            }),
        );

        // Generate IDs for ingredients ensuring they follow the kebab-case format
        parsedResult.ingredients = parsedResult.ingredients.map(
            (ingredient: IngredientWithId) => ({
                ...ingredient,
                id: generateId(ingredient.name),
            }),
        );

        // Validate ingredient mentions in instruction steps
        parsedResult.instructions = validateIngredientMentions(
            parsedResult.instructions,
            parsedResult.ingredients,
        );

        // Final validation with Zod schema
        const validatedRecipe = RecipeSchema.parse(parsedResult);

        // Store in cache
        try {
            await supabase
                .from("recipe_creation_cache")
                .upsert({
                    key: cacheKey,
                    data: validatedRecipe,
                    created_at: new Date().toISOString(),
                });
        } catch (cacheError) {
            // Log but don't fail if caching fails
            console.error("Cache error:", cacheError);
        }

        return new Response(JSON.stringify(validatedRecipe), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "X-Cache": "MISS",
            },
        });
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
