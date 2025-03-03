import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/recipe";
import type { Database } from "../types/database";
import { convertRecipeInstructionReferences } from "../utils/ingredientMentions";

type RecipeWithRelations = Database["public"]["Tables"]["recipes"]["Row"] & {
    // Only keep the correct property names that match what comes from the database
    recipe_ingredients:
        Database["public"]["Tables"]["recipe_ingredients"]["Row"][];
    recipe_images: Database["public"]["Tables"]["recipe_images"]["Row"][];
    recipe_instruction_sections:
        (Database["public"]["Tables"]["recipe_instruction_sections"]["Row"] & {
            recipe_instruction_steps:
                Database["public"]["Tables"]["recipe_instruction_steps"][
                    "Row"
                ][];
        })[];
};

/**
 * Service to handle all recipe operations
 */
export class RecipeService {
    /**
     * Save a recipe to the database
     *
     * This method ensures that all ingredient references in recipe instructions
     * are properly formatted with UUID identifiers.
     *
     * - When a user adds an ingredient reference using the @ mention syntax,
     *   the IngredientReferenceInput component creates references with proper UUIDs.
     * - For any legacy or imported content, this method converts any slug-based
     *   references to UUID-based references before saving.
     * - This prevents issues with ingredient visibility in recipe instructions
     *   and eliminates the need for post-save fixing.
     *
     * @param recipe - The recipe to save
     * @param userId - The ID of the user who owns the recipe
     * @returns The saved recipe with updated ID if it was a new recipe
     */
    static async saveRecipe(recipe: Recipe, userId: string): Promise<Recipe> {
        // Check for valid recipe and user
        if (!recipe || !userId) {
            throw new Error("Recipe and userId are required");
        }

        // Check if this is a new recipe or if the ID is valid
        const isNewRecipe = !recipe.id || recipe.id === "new";
        let recipeId = recipe.id || "";

        // Always convert any ingredient references to UUID format
        if (recipe.instructions?.length > 0 && recipe.ingredients?.length > 0) {
            // Convert ingredient references in instructions
            const updatedInstructions = convertRecipeInstructionReferences(
                recipe.instructions,
                recipe.ingredients,
            );

            // Replace instructions with the converted version
            recipe = {
                ...recipe,
                instructions: updatedInstructions,
            };
        }

        try {
            // 1. Save the main recipe record
            const recipeData = {
                title: recipe.title,
                description: recipe.description || null,
                servings: recipe.servings,
                prep_time: recipe.time_estimate?.prep || null,
                cook_time: recipe.time_estimate?.cook || null,
                total_time: recipe.time_estimate?.total || null,
                user_id: userId,
            };

            if (isNewRecipe || !recipeId) {
                // Create new recipe with a proper UUID
                const { data: newRecipe, error: insertError } = await supabase
                    .from("recipes")
                    .insert(recipeData)
                    .select("id")
                    .single();

                if (insertError) {
                    throw insertError;
                }
                recipeId = newRecipe.id;
            } else {
                // Update existing recipe with valid UUID
                const { error: updateError } = await supabase
                    .from("recipes")
                    .update(recipeData)
                    .eq("id", recipeId)
                    .eq("user_id", userId);

                if (updateError) {
                    throw updateError;
                }
            }

            // 2. Handle recipe images
            if (recipe.images && recipe.images.length > 0) {
                // Delete existing images if updating
                if (!isNewRecipe) {
                    const { error: deleteError } = await supabase
                        .from("recipe_images")
                        .delete()
                        .eq("recipe_id", recipeId);

                    if (deleteError) {
                        throw deleteError;
                    }
                }

                // Insert new images
                const imageRecords = recipe.images.map((imageUrl, index) => ({
                    recipe_id: recipeId,
                    url: imageUrl,
                    position: index,
                }));

                const { error: imageError } = await supabase
                    .from("recipe_images")
                    .insert(imageRecords);

                if (imageError) {
                    throw imageError;
                }
            }

            // 3. Handle recipe ingredients
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                // Delete existing ingredients if updating
                if (!isNewRecipe) {
                    const { error: deleteError } = await supabase
                        .from("recipe_ingredients")
                        .delete()
                        .eq("recipe_id", recipeId);

                    if (deleteError) {
                        throw deleteError;
                    }
                }

                // Insert new ingredients
                const ingredientRecords = recipe.ingredients.map((
                    ingredient,
                    index,
                ) => ({
                    recipe_id: recipeId,
                    name: ingredient.name,
                    quantity: ingredient.quantity || null,
                    unit: ingredient.unit || null,
                    notes: ingredient.notes || null,
                    position: index,
                }));

                const { error: ingredientError } = await supabase
                    .from("recipe_ingredients")
                    .insert(ingredientRecords);

                if (ingredientError) {
                    throw ingredientError;
                }
            }

            // 4. Handle recipe instruction sections and steps
            if (recipe.instructions && recipe.instructions.length > 0) {
                // Delete existing instruction sections if updating
                if (!isNewRecipe) {
                    const { error: deleteError } = await supabase
                        .from("recipe_instruction_sections")
                        .delete()
                        .eq("recipe_id", recipeId);

                    if (deleteError) {
                        throw deleteError;
                    }
                }

                // Insert instruction sections and their steps
                for (
                    let sectionIndex = 0;
                    sectionIndex < recipe.instructions.length;
                    sectionIndex++
                ) {
                    const section = recipe.instructions[sectionIndex];

                    // Insert section
                    const { data: insertedSection, error: sectionError } =
                        await supabase
                            .from("recipe_instruction_sections")
                            .insert({
                                recipe_id: recipeId,
                                section_title: section.section_title || null,
                                position: sectionIndex,
                            })
                            .select("id")
                            .single();

                    if (sectionError) {
                        throw sectionError;
                    }

                    // Skip steps if there are none
                    if (!section.steps || section.steps.length === 0) {
                        continue;
                    }

                    // Insert steps for this section
                    const stepRecords = section.steps.map((
                        step,
                        stepIndex,
                    ) => ({
                        recipe_instruction_section_id: insertedSection.id,
                        text: step.text || "",
                        position: stepIndex,
                        timing_min: step.timing?.min || null,
                        timing_max: step.timing?.max || null,
                        timing_units: step.timing?.units || null,
                    }));

                    const { error: stepError } = await supabase
                        .from("recipe_instruction_steps")
                        .insert(stepRecords);

                    if (stepError) {
                        throw stepError;
                    }
                }
            }

            // Return the saved recipe with the new ID
            return {
                ...recipe,
                id: recipeId,
            };
        } catch (error) {
            console.error("Error saving recipe:", error);
            throw error;
        }
    }

    /**
     * Get all recipes for a user
     */
    static async getRecipes(userId: string): Promise<Recipe[]> {
        const { data: recipes, error } = await supabase
            .from("recipes")
            .select(`
                *,
                recipe_images (id, url, position),
                recipe_ingredients (id, name, quantity, unit, notes, position),
                recipe_instruction_sections (
                    id, section_title, position,
                    recipe_instruction_steps (id, text, timing_min, timing_max, timing_units, position)
                )
            `)
            .eq("user_id", userId)
            .order("title");

        if (error) {
            console.error("Error fetching recipes:", error);
            throw error;
        }

        return recipes
            ? recipes.map((recipe) =>
                this.mapDbRecipeToRecipe(recipe as RecipeWithRelations)
            )
            : [];
    }

    /**
     * Get a recipe by ID
     */
    static async getRecipeById(
        recipeId: string,
        userId?: string,
    ): Promise<Recipe | null> {
        try {
            // Start building the query
            let query = supabase
                .from("recipes")
                .select(
                    `
                    *,
                    recipe_ingredients(*),
                    recipe_images(*),
                    recipe_instruction_sections(
                        *,
                        recipe_instruction_steps(*)
                    )
                `,
                )
                .eq("id", recipeId);

            // Add user filter if provided
            if (userId) {
                query = query.eq("user_id", userId);
            }

            // Complete query with ordering and execution
            const { data: dbRecipe, error } = await query
                .order("position", { foreignTable: "recipe_ingredients" })
                .order("position", {
                    foreignTable: "recipe_instruction_sections",
                })
                .order("position", {
                    foreignTable:
                        "recipe_instruction_sections.recipe_instruction_steps",
                })
                .maybeSingle();

            if (error) {
                throw error;
            }

            // Recipe not found
            if (!dbRecipe) {
                return null;
            }

            // Map the database recipe to our application model
            const recipe = this.mapDbRecipeToRecipe(dbRecipe);

            return recipe;
        } catch (error) {
            console.error("Error retrieving recipe:", error);
            return null;
        }
    }

    /**
     * Delete a recipe
     */
    static async deleteRecipe(
        recipeId: string,
        userId: string,
    ): Promise<boolean> {
        const { error } = await supabase
            .from("recipes")
            .delete()
            .eq("id", recipeId)
            .eq("user_id", userId);

        if (error) {
            console.error("Error deleting recipe:", error);
            throw error;
        }

        return true;
    }

    /**
     * Search recipes by text and/or tags
     */
    static async searchRecipes(
        userId: string,
        searchText?: string,
        tags?: string[],
    ): Promise<Recipe[]> {
        let query = supabase
            .from("recipes")
            .select(`
                *,
                recipe_images (id, url, position),
                recipe_ingredients (id, name, quantity, unit, notes, position),
                recipe_instruction_sections (
                    id, section_title, position,
                    recipe_instruction_steps (id, text, timing_min, timing_max, timing_units, position)
                )
            `)
            .eq("user_id", userId);

        // Add text search if provided
        if (searchText && searchText.trim()) {
            query = query.textSearch("title", searchText, {
                config: "english",
                type: "websearch",
            });
        }

        // Add tag filtering if provided
        if (tags && tags.length > 0) {
            // Use array containment operator
            // This returns recipes where the recipes.tags array contains ANY of the provided tags
            query = query.contains("tags", tags);
        }

        const { data: recipes, error } = await query.order("title");

        if (error) {
            console.error("Error searching recipes:", error);
            throw error;
        }

        return recipes
            ? recipes.map((recipe) =>
                this.mapDbRecipeToRecipe(recipe as RecipeWithRelations)
            )
            : [];
    }

    /**
     * Convert a database recipe record to the Recipe type used in the app
     */
    static mapDbRecipeToRecipe(dbRecipe: RecipeWithRelations): Recipe {
        // Map recipe images to simpler format
        const images = dbRecipe.recipe_images
            ? dbRecipe.recipe_images.map((img) => img.url)
            : [];

        // Map ingredients
        const ingredients = dbRecipe.recipe_ingredients
            ? dbRecipe.recipe_ingredients.map((ing) => ({
                id: ing.id,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                notes: ing.notes,
            }))
            : [];

        // Map instruction sections and steps
        const instructions = dbRecipe.recipe_instruction_sections
            ? dbRecipe.recipe_instruction_sections.map((section) => {
                const steps = section.recipe_instruction_steps
                    ? section.recipe_instruction_steps.map((step) => ({
                        text: step.text,
                        timing: step.timing_min
                            ? {
                                min: step.timing_min,
                                max: step.timing_max || step.timing_min,
                                units: step.timing_units || "minutes",
                            }
                            : null,
                    }))
                    : [];

                return {
                    section_title: section.section_title || "Instructions",
                    steps,
                };
            })
            : [];

        // Create time estimate
        const timeEstimate = {
            prep: dbRecipe.prep_time || 0,
            cook: dbRecipe.cook_time || 0,
            rest: 0, // Not stored directly in DB
            total: dbRecipe.total_time || 0,
        };

        // Construct and return the recipe
        return {
            id: dbRecipe.id,
            title: dbRecipe.title,
            description: dbRecipe.description || "",
            servings: dbRecipe.servings || 2,
            images,
            ingredients,
            instructions,
            notes: [], // Notes are handled differently now
            tags: [], // Tags are handled differently now
            time_estimate: timeEstimate,
        };
    }
}
