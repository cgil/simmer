import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.96.0";
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
            model: "o4-mini",
            reasoning_effort: "high",
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
                            originalPrompt ||
                            "No user prompt provided"
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
