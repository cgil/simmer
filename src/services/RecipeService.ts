import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/recipe";
import type { Database } from "../types/database";
import { convertRecipeInstructionReferences } from "../utils/ingredientMentions";
import { ensureUuid, isValidUuid } from "../utils/uuid";

// Helper function for generating UUIDs in the browser
function generateUUID(): string {
    // Use browser's built-in crypto.randomUUID() if available
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    // Fallback implementation using crypto.getRandomValues
    // This is compatible with all modern browsers
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
        const n = Number(c);
        return (n ^
            window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> n / 4)
            .toString(16);
    });
}

/**
 * Generate a deterministic UUID v5 with recipe-specific seed
 * This ensures ingredients have consistent IDs within a recipe but unique IDs across recipes
 * @param baseString - The base string to generate UUID from (e.g. ingredient name)
 * @param recipeSeed - A unique seed for this recipe instance
 * @returns A deterministic UUID that's unique for this recipe import
 */
function generateDeterministicUUID(
    baseString: string,
    recipeSeed: string,
): string {
    // Create a combined string that includes both the ingredient name and the recipe seed
    const combinedString = `${baseString}::${recipeSeed}`;

    // Use the existing ensureUuid function which should create a deterministic UUID
    // But now it will create different UUIDs for the same ingredient in different recipe imports
    return ensureUuid(combinedString);
}

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
     * @param forceNew - Force treating this recipe as new (for URL imports)
     * @returns The saved recipe with updated ID if it was a new recipe
     */
    static async saveRecipe(
        recipe: Recipe,
        userId: string,
        forceNew: boolean = false,
    ): Promise<Recipe> {
        // Check for valid recipe and user
        if (!recipe || !userId) {
            throw new Error("Recipe and userId are required");
        }

        // Check if this is a new recipe or if the ID is valid
        // When forceNew is true (URL imports), always treat as new recipe
        let isNewRecipe = forceNew || !recipe.id || recipe.id === "new";
        let recipeId = recipe.id || "";

        // For new recipes or imports, always generate a new UUID
        // This ensures that importing the same recipe URL multiple times creates distinct recipes
        if (isNewRecipe) {
            // Always generate a completely new UUID for new/imported recipes
            recipeId = generateUUID();
            console.log(`Generated new UUID for recipe: ${recipeId}`);
        } else if (!isValidUuid(recipeId)) {
            // For existing recipes with non-UUID IDs, convert consistently
            console.warn(
                `Converting non-UUID recipe ID '${recipeId}' to a proper UUID format`,
            );
            recipeId = ensureUuid(recipeId);
        }

        // Update the recipe object with the validated/new UUID
        recipe = {
            ...recipe,
            id: recipeId,
        };

        // Generate a recipe-specific seed that's unique to this specific recipe import
        // Use a timestamp to ensure uniqueness even if the same recipe is imported multiple times
        const recipeSeed = isNewRecipe
            ? `${recipeId}::${Date.now()}`
            : recipeId;

        console.log(`Using recipe seed: ${recipeSeed} for ingredient IDs`);

        // For new recipes or imports, generate truly unique IDs for all ingredients
        // This prevents primary key violations when the same recipe is imported multiple times
        const validatedIngredients = recipe.ingredients.map((ingredient) => {
            if (isNewRecipe) {
                // For new recipes, use deterministic UUIDs based on ingredient name + recipe seed
                // This ensures consistent references within the recipe but unique IDs across recipes
                return {
                    ...ingredient,
                    id: generateDeterministicUUID(ingredient.name, recipeSeed),
                };
            } else if (!isValidUuid(ingredient.id)) {
                // For existing recipes, ensure valid UUIDs
                console.warn(
                    `Invalid UUID format for ingredient: ${ingredient.name} with ID: ${ingredient.id}`,
                );
                return {
                    ...ingredient,
                    id: ensureUuid(ingredient.id),
                };
            }
            return ingredient;
        });

        // Create a mapping of any changed IDs
        const idMapping = new Map();
        recipe.ingredients.forEach((origIngredient, index) => {
            if (origIngredient.id !== validatedIngredients[index].id) {
                idMapping.set(
                    origIngredient.id,
                    validatedIngredients[index].id,
                );
            }
        });

        // Update recipe with validated ingredients
        recipe = {
            ...recipe,
            ingredients: validatedIngredients,
        };

        // Always update instruction references to match the new ingredient IDs
        if (recipe.instructions?.length > 0 && recipe.ingredients?.length > 0) {
            // If we had to change any IDs, update references to use the new IDs
            if (idMapping.size > 0) {
                recipe.instructions = recipe.instructions.map((section) => ({
                    ...section,
                    steps: section.steps.map((step) => ({
                        ...step,
                        text: step.text.replace(
                            /@\[([^\]]+)\]\(([^)]+)\)/g,
                            (match, display, id) => {
                                const newId = idMapping.get(id);
                                return newId
                                    ? `@[${display}](${newId})`
                                    : match;
                            },
                        ),
                    })),
                }));
            }

            // For new recipes, we need to ensure all instruction sections have unique IDs too
            if (isNewRecipe) {
                recipe.instructions = recipe.instructions.map((
                    section,
                    index,
                ) => ({
                    ...section,
                    // Generate a deterministic ID based on section title and recipe seed
                    // This ensures unique IDs across recipes but consistent within a recipe
                    id: generateDeterministicUUID(
                        `section-${index}-${
                            section.section_title || "Instructions"
                        }`,
                        recipeSeed,
                    ),
                }));
            }

            // Convert any remaining slug references to UUIDs
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
            let savedRecipeId;

            // STEP 1: Insert or update the base recipe
            if (isNewRecipe) {
                console.log(`Creating new recipe: "${recipe.title}"`);

                // Create a new recipe - explicitly setting user_id for ownership
                const { data: newRecipe, error: createError } = await supabase
                    .from("recipes")
                    .insert({
                        title: recipe.title || "Untitled Recipe",
                        description: recipe.description || "",
                        user_id: userId, // Set explicit ownership
                        prep_time: recipe.time_estimate?.prep || 0,
                        cook_time: recipe.time_estimate?.cook || 0,
                        total_time: recipe.time_estimate?.total ||
                            (recipe.time_estimate?.prep || 0) +
                                (recipe.time_estimate?.cook || 0),
                        servings: recipe.servings || 2,
                        tags: recipe.tags || [],
                        notes: recipe.notes || [],
                        is_public: true, // Set is_public to true by default
                    })
                    .select("id")
                    .single();

                if (createError) {
                    console.error("Error creating recipe:", createError);
                    throw createError;
                }

                if (!newRecipe?.id) {
                    throw new Error("Failed to create recipe - no ID returned");
                }

                savedRecipeId = newRecipe.id;
                console.log(
                    `Successfully created recipe with ID: ${savedRecipeId}`,
                );
            } else {
                console.log(
                    `Updating existing recipe: "${recipe.title}" with ID: ${recipeId}`,
                );

                // Verify ownership before updating - with improved error handling
                try {
                    const { data: existingRecipe, error: getError } =
                        await supabase
                            .from("recipes")
                            .select("id, user_id")
                            .eq("id", recipeId)
                            .maybeSingle(); // Use maybeSingle instead of single to prevent errors on zero rows

                    if (getError) {
                        console.error(
                            "Error retrieving recipe for ownership verification:",
                            getError,
                        );
                        throw getError;
                    }

                    // Handle the case where the recipe doesn't exist or user doesn't have access
                    if (!existingRecipe) {
                        console.log(
                            `Recipe with ID ${recipeId} not found or not accessible - attempting to create a new one`,
                        );

                        // Create a new recipe instead of trying to update a non-existent one
                        const { data: newRecipe, error: createError } =
                            await supabase
                                .from("recipes")
                                .insert({
                                    id: recipeId, // Use the provided ID
                                    title: recipe.title || "Untitled Recipe",
                                    description: recipe.description || "",
                                    user_id: userId, // Set explicit ownership
                                    prep_time: recipe.time_estimate?.prep || 0,
                                    cook_time: recipe.time_estimate?.cook || 0,
                                    total_time: recipe.time_estimate?.total ||
                                        (recipe.time_estimate?.prep || 0) +
                                            (recipe.time_estimate?.cook || 0),
                                    servings: recipe.servings || 2,
                                    tags: recipe.tags || [],
                                    notes: recipe.notes || [],
                                    is_public: true, // Set is_public to true by default
                                })
                                .select("id")
                                .single();

                        if (createError) {
                            console.error(
                                "Error creating recipe:",
                                createError,
                            );
                            throw createError;
                        }

                        savedRecipeId = newRecipe?.id || recipeId;
                        console.log(
                            `Created new recipe with ID: ${savedRecipeId}`,
                        );

                        // Skip to step 2 - no need to clear existing data as we just created a new recipe
                        isNewRecipe = true;
                    } else if (existingRecipe.user_id !== userId) {
                        throw new Error(
                            `You don't have permission to update this recipe. Recipe belongs to user ${existingRecipe.user_id}, but you are ${userId}`,
                        );
                    } else {
                        // Update the recipe now that we've verified ownership
                        const { error: updateError } = await supabase
                            .from("recipes")
                            .update({
                                title: recipe.title || "Untitled Recipe",
                                description: recipe.description || "",
                                prep_time: recipe.time_estimate?.prep || 0,
                                cook_time: recipe.time_estimate?.cook || 0,
                                total_time: recipe.time_estimate?.total ||
                                    (recipe.time_estimate?.prep || 0) +
                                        (recipe.time_estimate?.cook || 0),
                                servings: recipe.servings || 2,
                                tags: recipe.tags || [],
                                notes: recipe.notes || [],
                            })
                            .eq("id", recipeId)
                            .eq("user_id", userId); // Double-check ownership in the update query

                        if (updateError) {
                            console.error(
                                "Error updating recipe:",
                                updateError,
                            );
                            throw updateError;
                        }

                        savedRecipeId = recipeId;
                        console.log(
                            `Successfully updated recipe with ID: ${savedRecipeId}`,
                        );
                    }
                } catch (error) {
                    // If there was an error during the ownership check, but it's due to the recipe not existing
                    // (which would be a 406 Not Acceptable error from Supabase REST API),
                    // we'll try to create the recipe instead
                    if (
                        error && typeof error === "object" && "code" in error &&
                        error.code === "PGRST116"
                    ) {
                        console.log(
                            `Recipe with ID ${recipeId} not found - creating a new one`,
                        );

                        // Create a new recipe with the specified ID
                        const { data: newRecipe, error: createError } =
                            await supabase
                                .from("recipes")
                                .insert({
                                    id: recipeId, // Use the provided ID
                                    title: recipe.title || "Untitled Recipe",
                                    description: recipe.description || "",
                                    user_id: userId, // Set explicit ownership
                                    prep_time: recipe.time_estimate?.prep || 0,
                                    cook_time: recipe.time_estimate?.cook || 0,
                                    total_time: recipe.time_estimate?.total ||
                                        (recipe.time_estimate?.prep || 0) +
                                            (recipe.time_estimate?.cook || 0),
                                    servings: recipe.servings || 2,
                                    tags: recipe.tags || [],
                                    notes: recipe.notes || [],
                                    is_public: true, // Set is_public to true by default
                                })
                                .select("id")
                                .single();

                        if (createError) {
                            console.error(
                                "Error creating recipe:",
                                createError,
                            );
                            throw createError;
                        }

                        savedRecipeId = newRecipe?.id || recipeId;
                        console.log(
                            `Created new recipe with ID: ${savedRecipeId}`,
                        );

                        // Skip to step 2 - no need to clear existing data as we just created a new recipe
                        isNewRecipe = true;
                    } else {
                        // Re-throw any other errors
                        throw error;
                    }
                }
            }

            // STEP 2: Clear out existing related data if updating
            if (!isNewRecipe) {
                console.log(
                    `Clearing existing related data for recipe ${savedRecipeId}`,
                );

                // Delete in correct order: steps -> sections -> ingredients -> images

                // First clear instruction sections (cascades to steps via foreign key)
                const { error: clearSectionsError } = await supabase
                    .from("recipe_instruction_sections")
                    .delete()
                    .eq("recipe_id", savedRecipeId);

                if (clearSectionsError) {
                    console.error(
                        "Error clearing instruction sections:",
                        clearSectionsError,
                    );
                    throw clearSectionsError;
                }

                // Clear ingredients
                const { error: clearIngredientsError } = await supabase
                    .from("recipe_ingredients")
                    .delete()
                    .eq("recipe_id", savedRecipeId);

                if (clearIngredientsError) {
                    console.error(
                        "Error clearing ingredients:",
                        clearIngredientsError,
                    );
                    throw clearIngredientsError;
                }

                // Clear images
                const { error: clearImagesError } = await supabase
                    .from("recipe_images")
                    .delete()
                    .eq("recipe_id", savedRecipeId);

                if (clearImagesError) {
                    console.error("Error clearing images:", clearImagesError);
                    throw clearImagesError;
                }

                console.log("Successfully cleared existing recipe data");
            }

            // STEP 3: Insert related data

            // 3.1: Insert ingredients
            if (recipe.ingredients?.length > 0) {
                console.log(
                    `Inserting ${recipe.ingredients.length} ingredients for recipe ${savedRecipeId}`,
                );

                const ingredientRecords = recipe.ingredients.map((
                    ingredient,
                    index,
                ) => ({
                    id: isValidUuid(ingredient.id)
                        ? ingredient.id
                        : ensureUuid(ingredient.id),
                    recipe_id: savedRecipeId,
                    name: ingredient.name,
                    quantity: ingredient.quantity,
                    unit: ingredient.unit,
                    notes: ingredient.notes || "",
                    position: index,
                }));

                const { error: ingredientsError } = await supabase
                    .from("recipe_ingredients")
                    .insert(ingredientRecords);

                if (ingredientsError) {
                    console.error(
                        "Error inserting ingredients:",
                        ingredientsError,
                    );
                    console.error("First ingredient:", ingredientRecords[0]);
                    throw ingredientsError;
                }

                console.log(
                    `Successfully inserted ${recipe.ingredients.length} ingredients`,
                );
            }

            // 3.2: Insert images
            if (recipe.images?.length > 0) {
                console.log(
                    `Inserting ${recipe.images.length} images for recipe ${savedRecipeId}`,
                );

                const imageRecords = recipe.images.map((url, index) => ({
                    recipe_id: savedRecipeId,
                    url,
                    position: index,
                }));

                const { error: imagesError } = await supabase
                    .from("recipe_images")
                    .insert(imageRecords);

                if (imagesError) {
                    console.error("Error inserting images:", imagesError);
                    console.error("First image record:", imageRecords[0]);
                    throw imagesError;
                }

                console.log(
                    `Successfully inserted ${recipe.images.length} images`,
                );
            }

            // 3.3: Insert instruction sections and their steps
            if (recipe.instructions?.length > 0) {
                console.log(
                    `Inserting ${recipe.instructions.length} instruction sections`,
                );

                for (
                    let sectionIndex = 0;
                    sectionIndex < recipe.instructions.length;
                    sectionIndex++
                ) {
                    const section = recipe.instructions[sectionIndex];

                    // First insert the section
                    const { data: newSection, error: sectionError } =
                        await supabase
                            .from("recipe_instruction_sections")
                            .insert({
                                recipe_id: savedRecipeId,
                                section_title: section.section_title ||
                                    "Instructions",
                                position: sectionIndex,
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

                    if (!newSection?.id) {
                        throw new Error(
                            "Failed to insert instruction section - no ID returned",
                        );
                    }

                    // Skip steps if none exist
                    if (!section.steps || section.steps.length === 0) {
                        continue;
                    }

                    // Then insert steps for this section
                    const stepRecords = section.steps.map((
                        step,
                        stepIndex,
                    ) => ({
                        section_id: newSection.id,
                        text: step.text || "",
                        position: stepIndex,
                        timing_min: step.timing?.min || null,
                        timing_max: step.timing?.max || null,
                        timing_units: step.timing?.units || null,
                    }));

                    const { error: stepsError } = await supabase
                        .from("recipe_instruction_steps")
                        .insert(stepRecords);

                    if (stepsError) {
                        console.error(
                            "Error inserting instruction steps:",
                            stepsError,
                        );
                        throw stepsError;
                    }
                }

                console.log(
                    "Successfully inserted all instruction sections and steps",
                );
            }

            // Return the updated recipe with saved ID
            return {
                ...recipe,
                id: savedRecipeId,
            };
        } catch (error) {
            console.error("Error in saveRecipe:", error);
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
     * If userId is provided, get recipe owned by that user
     * If userId is not provided, only return the recipe if it's public
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

            // Add user filter or public filter based on whether userId is provided
            if (userId) {
                // If userId is provided, get recipe owned by that user OR public recipes
                query = query.or(`user_id.eq.${userId},is_public.eq.true`);
            } else {
                // If no userId, only return public recipes
                query = query.eq("is_public", true);
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
        try {
            // First, explicitly clean up collection relationships
            // This is redundant with the CASCADE DELETE in the DB schema, but ensures
            // we handle any edge cases or database inconsistencies
            const { error: collectionError } = await supabase
                .from("recipe_collections")
                .delete()
                .eq("recipe_id", recipeId);

            if (collectionError) {
                console.warn(
                    "Warning: Could not explicitly clean up recipe collections:",
                    collectionError,
                );
                // Continue with deletion even if collection cleanup fails explicitly
                // The CASCADE DELETE should still handle it
            }

            // Then delete the recipe itself
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
        } catch (error) {
            console.error("Error in deleteRecipe:", error);
            throw error;
        }
    }

    /**
     * Search recipes by text and/or tags
     */
    static async searchRecipes(
        userId: string,
        searchText?: string,
        tags?: string[],
    ): Promise<Recipe[]> {
        // Base query to get recipes for the user
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

        // Add tag filtering if provided
        if (tags && tags.length > 0) {
            // Use array containment operator
            query = query.contains("tags", tags);
        }

        const { data: recipes, error } = await query;

        if (error) {
            console.error("Error fetching recipes:", error);
            throw error;
        }

        // If no search text, just return all recipes
        if (!searchText || !searchText.trim()) {
            return recipes
                ? recipes.map((recipe) =>
                    this.mapDbRecipeToRecipe(recipe as RecipeWithRelations)
                ).sort((a, b) => a.title.localeCompare(b.title))
                : [];
        }

        // Process search with priorities if we have search text
        const normalizedSearchText = searchText.toLowerCase().trim();

        // If we have recipes, filter and sort them by relevance
        if (recipes && recipes.length > 0) {
            const typedRecipes = recipes as RecipeWithRelations[];

            // Create scoring object to track matches and their relevance
            const scoredRecipes = typedRecipes.map((recipe) => {
                let score = 0;
                let titleMatch = false;
                let tagMatch = false;
                let ingredientMatch = false;

                // Title match (highest priority)
                if (recipe.title.toLowerCase().includes(normalizedSearchText)) {
                    score += 100; // Higher score for title matches
                    titleMatch = true;
                }

                // Tag match (medium priority)
                if (recipe.tags && Array.isArray(recipe.tags)) {
                    const hasTagMatch = recipe.tags.some((tag) =>
                        typeof tag === "string" &&
                        tag.toLowerCase().includes(normalizedSearchText)
                    );

                    if (hasTagMatch) {
                        score += 50; // Medium score for tag matches
                        tagMatch = true;
                    }
                }

                // Ingredient match (lowest priority)
                if (
                    recipe.recipe_ingredients &&
                    recipe.recipe_ingredients.length > 0
                ) {
                    const hasIngredientMatch = recipe.recipe_ingredients.some(
                        (ingredient) =>
                            ingredient.name.toLowerCase().includes(
                                normalizedSearchText,
                            ),
                    );

                    if (hasIngredientMatch) {
                        score += 25; // Lower score for ingredient matches
                        ingredientMatch = true;
                    }
                }

                return {
                    recipe,
                    score,
                    matches: { titleMatch, tagMatch, ingredientMatch },
                };
            });

            // Filter out recipes with no matches
            const matchedRecipes = scoredRecipes.filter(
                (item) => item.score > 0,
            );

            // Sort by score (descending) and then by title (ascending)
            matchedRecipes.sort((a, b) => {
                if (a.score !== b.score) {
                    return b.score - a.score; // Higher scores first
                }
                // If scores are equal, sort alphabetically by title
                return a.recipe.title.localeCompare(b.recipe.title);
            });

            // Return only the recipe objects, properly mapped
            return matchedRecipes.map((item) =>
                this.mapDbRecipeToRecipe(item.recipe)
            );
        }

        return [];
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
            notes: dbRecipe.notes || [], // Use database notes
            tags: dbRecipe.tags || [], // Use database tags
            time_estimate: timeEstimate,
            user_id: dbRecipe.user_id || undefined, // Include user_id for ownership verification
            is_public: dbRecipe.is_public || false, // Include is_public flag
        };
    }

    /**
     * Update the public status of a recipe
     *
     * @param recipeId - The ID of the recipe to update
     * @param isPublic - The new public status
     * @param userId - The ID of the user who owns the recipe
     * @returns A boolean indicating whether the update was successful
     */
    static async updateRecipePublicStatus(
        recipeId: string,
        isPublic: boolean,
        userId: string,
    ): Promise<boolean> {
        if (!recipeId || !userId) {
            throw new Error("Recipe ID and user ID are required");
        }

        try {
            // Verify ownership before updating
            const { data: existingRecipe, error: getError } = await supabase
                .from("recipes")
                .select("id, user_id")
                .eq("id", recipeId)
                .maybeSingle();

            if (getError) {
                console.error(
                    "Error retrieving recipe for ownership verification:",
                    getError,
                );
                throw getError;
            }

            // Check if recipe exists and user has permission
            if (!existingRecipe) {
                throw new Error(`Recipe with ID ${recipeId} not found`);
            } else if (existingRecipe.user_id !== userId) {
                throw new Error(
                    `You don't have permission to update this recipe. Recipe belongs to user ${existingRecipe.user_id}, but you are ${userId}`,
                );
            }

            // Update the recipe's public status
            const { error: updateError } = await supabase
                .from("recipes")
                .update({ is_public: isPublic })
                .eq("id", recipeId)
                .eq("user_id", userId); // Double-check ownership in the update query

            if (updateError) {
                console.error(
                    "Error updating recipe public status:",
                    updateError,
                );
                throw updateError;
            }

            return true;
        } catch (error) {
            console.error("Error in updateRecipePublicStatus:", error);
            throw error;
        }
    }
}
