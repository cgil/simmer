import { supabase } from "../lib/supabase";
import type {
    Ingredient,
    InstructionSection,
    Recipe,
    TimeEstimate,
} from "../types/recipe";
import type { Database } from "../types/database";

type RecipeWithRelations = Database["public"]["Tables"]["recipes"]["Row"] & {
    ingredients: Database["public"]["Tables"]["recipe_ingredients"]["Row"][];
    instruction_sections:
        (Database["public"]["Tables"]["recipe_instruction_sections"]["Row"] & {
            steps: Database["public"]["Tables"]["recipe_instruction_steps"][
                "Row"
            ][];
        })[];
    images: Database["public"]["Tables"]["recipe_images"]["Row"][];
};

/**
 * Service to handle all recipe operations
 */
export class RecipeService {
    /**
     * Save a recipe to the database
     * If the recipe has an ID, it will be updated, otherwise a new recipe will be created
     */
    static async saveRecipe(recipe: Recipe, userId: string): Promise<Recipe> {
        // Determine if this is a new recipe or if the ID is not a valid UUID
        // If it's not a valid UUID, we'll generate a new one
        const isValidUuid = recipe.id &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                .test(recipe.id);
        const isNewRecipe = !recipe.id;

        console.log("Recipe save operation:", {
            isNewRecipe,
            isValidUuid,
            recipeId: recipe.id,
            userId,
            hasImages: recipe.images?.length > 0,
            numImages: recipe.images?.length,
            hasIngredients: recipe.ingredients?.length > 0,
            numIngredients: recipe.ingredients?.length,
            hasInstructions: recipe.instructions?.length > 0,
            numInstructions: recipe.instructions?.length,
        });

        try {
            // 1. Save the main recipe record
            const recipeData = {
                title: recipe.title,
                description: recipe.description || null,
                servings: recipe.servings,
                tags: recipe.tags || [],
                notes: recipe.notes || [],
                prep_time: recipe.time_estimate?.prep || 0,
                cook_time: recipe.time_estimate?.cook || 0,
                rest_time: recipe.time_estimate?.rest || 0,
                // Don't need to set total_time as it's calculated by a trigger
                user_id: userId,
            };

            console.log("Saving recipe main data:", recipeData);

            let recipeId: string;

            if (isNewRecipe || !isValidUuid) {
                // Create new recipe with a proper UUID
                const { data: newRecipe, error: insertError } = await supabase
                    .from("recipes")
                    .insert(recipeData)
                    .select("id")
                    .single();

                if (insertError) {
                    console.error("Error inserting recipe:", insertError);
                    throw insertError;
                }
                recipeId = newRecipe.id;
                console.log("Created new recipe with ID:", recipeId);
            } else {
                // Update existing recipe with valid UUID
                recipeId = recipe.id!;
                const { error: updateError } = await supabase
                    .from("recipes")
                    .update(recipeData)
                    .eq("id", recipeId)
                    .eq("user_id", userId);

                if (updateError) {
                    console.error("Error updating recipe:", updateError);
                    throw updateError;
                }
                console.log("Updated existing recipe with ID:", recipeId);
            }

            // 2. Handle recipe images
            if (recipe.images && recipe.images.length > 0) {
                // Delete existing images if updating
                if (!isNewRecipe) {
                    console.log(
                        "Deleting existing images for recipe:",
                        recipeId,
                    );
                    const { error: deleteImagesError } = await supabase
                        .from("recipe_images")
                        .delete()
                        .eq("recipe_id", recipeId);

                    if (deleteImagesError) {
                        console.error(
                            "Error deleting existing images:",
                            deleteImagesError,
                        );
                    }
                }

                // Insert new images
                const imageRecords = recipe.images.map((url, index) => ({
                    recipe_id: recipeId,
                    url,
                    position: index,
                }));

                console.log("Inserting image records:", imageRecords);
                const { error: imageError, data: newImages } = await supabase
                    .from("recipe_images")
                    .insert(imageRecords)
                    .select("*");

                if (imageError) {
                    console.error("Error inserting images:", imageError);
                    throw imageError;
                }
                console.log(
                    "Successfully inserted images:",
                    newImages?.length || 0,
                );
            } else {
                console.log("No images to save for recipe:", recipeId);
            }

            // 3. Handle ingredients
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                // Delete existing ingredients if updating
                if (!isNewRecipe) {
                    console.log(
                        "Deleting existing ingredients for recipe:",
                        recipeId,
                    );
                    const { error: deleteIngredientsError } = await supabase
                        .from("recipe_ingredients")
                        .delete()
                        .eq("recipe_id", recipeId);

                    if (deleteIngredientsError) {
                        console.error(
                            "Error deleting existing ingredients:",
                            deleteIngredientsError,
                        );
                    }
                }

                // Insert new ingredients
                const ingredientRecords = recipe.ingredients.map((
                    ingredient,
                    index,
                ) => ({
                    recipe_id: recipeId,
                    name: ingredient.name,
                    quantity: ingredient.quantity,
                    unit: ingredient.unit,
                    notes: ingredient.notes,
                    position: index,
                }));

                console.log("Inserting ingredient records:", ingredientRecords);
                const { error: ingredientError, data: newIngredients } =
                    await supabase
                        .from("recipe_ingredients")
                        .insert(ingredientRecords)
                        .select("*");

                if (ingredientError) {
                    console.error(
                        "Error inserting ingredients:",
                        ingredientError,
                    );
                    throw ingredientError;
                }
                console.log(
                    "Successfully inserted ingredients:",
                    newIngredients?.length || 0,
                );
            } else {
                console.log("No ingredients to save for recipe:", recipeId);
            }

            // 4. Handle instruction sections and steps
            if (recipe.instructions && recipe.instructions.length > 0) {
                // Delete existing sections if updating
                if (!isNewRecipe) {
                    // This will cascade delete to steps
                    console.log(
                        "Deleting existing instruction sections for recipe:",
                        recipeId,
                    );
                    const { error: deleteSectionsError } = await supabase
                        .from("recipe_instruction_sections")
                        .delete()
                        .eq("recipe_id", recipeId);

                    if (deleteSectionsError) {
                        console.error(
                            "Error deleting existing instruction sections:",
                            deleteSectionsError,
                        );
                    }
                }

                console.log(
                    "Processing instruction sections:",
                    recipe.instructions.length,
                );

                // Insert new sections and steps
                for (let i = 0; i < recipe.instructions.length; i++) {
                    const section = recipe.instructions[i];

                    // Insert section
                    console.log(
                        `Inserting section ${i}: ${section.section_title}`,
                    );
                    const { data: newSection, error: sectionError } =
                        await supabase
                            .from("recipe_instruction_sections")
                            .insert({
                                recipe_id: recipeId,
                                section_title: section.section_title,
                                position: i,
                            })
                            .select("id")
                            .single();

                    if (sectionError) {
                        console.error(
                            "Error inserting instruction section:",
                            sectionError,
                        );
                        throw sectionError;
                    }

                    // Insert steps for this section
                    if (section.steps && section.steps.length > 0) {
                        const stepRecords = section.steps.map((
                            step,
                            stepIndex,
                        ) => ({
                            section_id: newSection.id,
                            text: step.text,
                            timing_min: step.timing?.min || null,
                            timing_max: step.timing?.max || null,
                            timing_units: step.timing?.units || null,
                            position: stepIndex,
                        }));

                        console.log(
                            `Inserting ${stepRecords.length} steps for section ${i}`,
                        );
                        const { error: stepError, data: newSteps } =
                            await supabase
                                .from("recipe_instruction_steps")
                                .insert(stepRecords)
                                .select("*");

                        if (stepError) {
                            console.log(
                                "Error inserting instruction steps:",
                                stepError,
                            );

                            throw stepError;
                        }
                        console.log(
                            `Successfully inserted ${
                                newSteps?.length || 0
                            } steps for section ${i}`,
                        );
                    } else {
                        console.log(`No steps to insert for section ${i}`);
                    }
                }
            } else {
                console.log("No instructions to save for recipe:", recipeId);
            }

            // Return the saved recipe
            console.log("Recipe saved successfully:", recipeId);
            return {
                ...recipe,
                id: recipeId,
            };
        } catch (err) {
            console.error("Error saving recipe:", err);
            throw err;
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
        userId: string,
    ): Promise<Recipe | null> {
        const { data: recipe, error } = await supabase
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
            .eq("id", recipeId)
            .eq("user_id", userId)
            .single();

        if (error) {
            if (error.code === "PGRST116") { // Record not found
                return null;
            }
            console.error("Error fetching recipe:", error);
            throw error;
        }

        return recipe
            ? this.mapDbRecipeToRecipe(recipe as RecipeWithRelations)
            : null;
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
    private static mapDbRecipeToRecipe(dbRecipe: RecipeWithRelations): Recipe {
        // Sort relations by position
        const images = [...(dbRecipe.images || [])].sort((a, b) =>
            a.position - b.position
        );
        const ingredients = [...(dbRecipe.ingredients || [])].sort((a, b) =>
            a.position - b.position
        );
        const sections = [...(dbRecipe.instruction_sections || [])].sort((
            a,
            b,
        ) => a.position - b.position);

        // Map ingredients
        const mappedIngredients: Ingredient[] = ingredients.map((ing) => ({
            id: ing.id,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
        }));

        // Map instruction sections and steps
        const mappedInstructions: InstructionSection[] = sections.map(
            (section) => {
                const steps = [...(section.steps || [])].sort((a, b) =>
                    a.position - b.position
                );

                return {
                    section_title: section.section_title,
                    steps: steps.map((step) => ({
                        text: step.text,
                        timing: step.timing_min || step.timing_max
                            ? {
                                min: step.timing_min || 0,
                                max: step.timing_max || 0,
                                units: step.timing_units || "minutes",
                            }
                            : null,
                    })),
                };
            },
        );

        // Create time estimate
        const timeEstimate: TimeEstimate = {
            prep: dbRecipe.prep_time || 0,
            cook: dbRecipe.cook_time || 0,
            rest: dbRecipe.rest_time || 0,
            total: dbRecipe.total_time || 0,
        };

        // Build the final recipe object
        return {
            id: dbRecipe.id,
            title: dbRecipe.title,
            description: dbRecipe.description || "",
            servings: dbRecipe.servings,
            ingredients: mappedIngredients,
            instructions: mappedInstructions,
            notes: dbRecipe.notes || [],
            tags: dbRecipe.tags || [],
            images: images.map((img) => img.url),
            time_estimate: timeEstimate,
        };
    }
}
