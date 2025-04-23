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
    // Add properties related to sharing
    shared_with_me?: boolean;
    access_level?: "viewer" | "editor" | "owner";
    is_shared?: boolean;
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

        // For existing recipes, check if user has edit permission
        if (!isNewRecipe) {
            const hasPermission = await this.checkEditPermission(recipeId);

            if (!hasPermission) {
                console.log(
                    "User does not have edit permission for this recipe",
                );
                throw new Error(
                    `You don't have permission to update this recipe.`,
                );
            }
            console.log(`User has edit permission for recipe ${recipeId}`);
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
        const validatedIngredients = recipe.ingredients.map(
            (ingredient, index) => {
                if (isNewRecipe) {
                    // For new/imported recipes, use deterministic UUIDs based on name, index, and recipe seed
                    // This ensures uniqueness within the import even with duplicate names
                    const uniqueInput = `${ingredient.name}::${index}`;
                    return {
                        ...ingredient,
                        id: generateDeterministicUUID(uniqueInput, recipeSeed),
                    };
                } else if (!isValidUuid(ingredient.id)) {
                    // For existing recipes with invalid IDs, ensure a valid (deterministic) UUID
                    console.warn(
                        `Invalid UUID format for ingredient: ${ingredient.name} with ID: ${ingredient.id}`,
                    );
                    return {
                        ...ingredient,
                        id: ensureUuid(ingredient.id),
                    };
                }
                // If it's an existing recipe with a valid ID, return as is
                return ingredient;
            },
        );

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
            const existingRecipe = !!recipeId;

            // Variable to track the saved recipe ID
            let savedRecipeId: string | undefined = undefined;

            if (existingRecipe) {
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
                    } else {
                        // Permission already checked at the beginning of the function
                        // No need to check again
                        savedRecipeId = recipeId;
                    }

                    // Update the recipe now that we've verified ownership or edit permission
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
                        .eq("id", recipeId);
                    // No user_id check needed - permission was verified earlier

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
     * Get all recipes for a user, including recipes they own and recipes shared with them.
     */
    static async getRecipes(userId: string): Promise<Recipe[]> {
        try {
            // 1. Get IDs of recipes owned by the user
            const { data: ownedRecipeIdsData, error: ownedError } =
                await supabase
                    .from("recipes")
                    .select("id")
                    .eq("user_id", userId);

            if (ownedError) {
                console.error("Error fetching owned recipe IDs:", ownedError);
                throw ownedError;
            }
            const ownedRecipeIds = ownedRecipeIdsData?.map((r) => r.id) || [];

            // 2. Get IDs of recipes shared with the user
            const { data: sharedRecipeIdsData, error: sharedError } =
                await supabase
                    .from("shared_recipes")
                    .select("recipe_id, access_level")
                    .eq("shared_with_user_id", userId);

            if (sharedError) {
                console.error("Error fetching shared recipe IDs:", sharedError);
                throw sharedError;
            }
            const sharedRecipeIds = sharedRecipeIdsData?.map((s) =>
                s.recipe_id
            ) || [];

            // Create a map of recipe IDs to their access levels
            const accessLevelMap = new Map<string, "viewer" | "editor">();
            sharedRecipeIdsData?.forEach((s) => {
                if (s.recipe_id && s.access_level) {
                    // Normalize access levels from "view"/"edit" to "viewer"/"editor"
                    let normalizedAccessLevel: "viewer" | "editor" = "viewer";
                    if (
                        s.access_level === "edit" || s.access_level === "editor"
                    ) {
                        normalizedAccessLevel = "editor";
                    } else if (
                        s.access_level === "view" || s.access_level === "viewer"
                    ) {
                        normalizedAccessLevel = "viewer";
                    }

                    accessLevelMap.set(s.recipe_id, normalizedAccessLevel);
                }
            });

            // 3. Combine IDs and remove duplicates
            const allRecipeIds = [
                ...new Set([...ownedRecipeIds, ...sharedRecipeIds]),
            ];

            if (allRecipeIds.length === 0) {
                return []; // No recipes owned or shared
            }

            // 4. Fetch full details for all accessible recipes
            const { data: recipes, error: fetchError } = await supabase
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
                .in("id", allRecipeIds)
                .order("position", { foreignTable: "recipe_ingredients" })
                .order("position", {
                    foreignTable: "recipe_instruction_sections",
                })
                .order("position", {
                    foreignTable:
                        "recipe_instruction_sections.recipe_instruction_steps",
                })
                .order("title"); // Order the final combined list by title

            if (fetchError) {
                console.error("Error fetching recipe details:", fetchError);
                throw fetchError;
            }

            // 5. Process recipes to add sharing information
            const processedRecipes = recipes?.map((recipe) => {
                const isOwned = ownedRecipeIds.includes(recipe.id);
                const isShared = sharedRecipeIds.includes(recipe.id);

                // Add sharing-related properties
                return {
                    ...recipe,
                    // Add is_shared flag if this recipe is shared with others
                    is_shared: recipe.is_shared || false,
                    // Add shared_with_me flag if the user is not the owner
                    shared_with_me: !isOwned && isShared,
                    // Add access_level based on the map or 'owner' if user owns it
                    access_level: isOwned
                        ? "owner" as const
                        : accessLevelMap.get(recipe.id) || "viewer" as const,
                };
            });

            return processedRecipes
                ? processedRecipes.map((recipe) =>
                    this.mapDbRecipeToRecipe(recipe as RecipeWithRelations)
                )
                : [];
        } catch (error) {
            console.error("Error in getRecipes:", error);
            throw error; // Re-throw the error after logging
        }
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

            // If userId is NOT provided (anonymous access), filter for public recipes only.
            // If userId IS provided, RLS policies will handle access automatically
            // (checking ownership, shares, and public status).
            if (!userId) {
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
                // Handle specific RLS violation error (though maybeSingle handles not found)
                if (error.code === "42501") { // permission denied
                    console.warn(
                        `RLS denied access to recipe ${recipeId} for user ${
                            userId || "anonymous"
                        }`,
                    );
                    return null;
                }
                throw error;
            }

            // Recipe not found or access denied by RLS
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
    ): Promise<boolean> {
        try {
            // Check if user has edit permission instead of just checking ownership
            const hasPermission = await this.checkEditPermission(recipeId);

            if (!hasPermission) {
                console.log(
                    "User does not have edit permission for this recipe",
                );
                throw new Error(
                    `You don't have permission to delete this recipe.`,
                );
            }

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

            // Then delete the recipe itself - no need to check user_id anymore
            // as we've already verified permissions
            const { error } = await supabase
                .from("recipes")
                .delete()
                .eq("id", recipeId);

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

        // Determine if this recipe is shared with the current user
        const shared_with_me = dbRecipe.shared_with_me === true;

        // Set access level based on what's in the database
        // The database RLS policies ensure we only see records we have access to
        // and the access_level field is correctly populated for shared recipes
        let access_level: "viewer" | "editor" | "owner" | undefined;

        if (dbRecipe.access_level) {
            // Normalize access level values by treating it as a string first
            const accessLevelStr = dbRecipe.access_level as string;

            if (accessLevelStr === "edit" || accessLevelStr === "editor") {
                access_level = "editor";
            } else if (
                accessLevelStr === "view" || accessLevelStr === "viewer"
            ) {
                access_level = "viewer";
            } else if (accessLevelStr === "owner") {
                access_level = "owner";
            }
        } else if (shared_with_me) {
            // For shared recipes without explicit access level, default to viewer
            access_level = "viewer";
        }
        // If no access_level is specified and recipe isn't explicitly shared with the user,
        // we can assume they're the owner (RLS policies ensure users only see recipes they own or are shared with them)

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
            is_shared: dbRecipe.is_shared || false, // Include is_shared flag
            shared_with_me, // Add shared_with_me flag
            access_level, // Add access_level information
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
            // Check if user has edit permission instead of just checking ownership
            const hasPermission = await this.checkEditPermission(recipeId);

            if (!hasPermission) {
                console.log(
                    "User does not have edit permission for this recipe",
                );
                throw new Error(
                    `You don't have permission to update this recipe.`,
                );
            }

            // Verify the recipe exists
            const { data: existingRecipe, error: getError } = await supabase
                .from("recipes")
                .select("id")
                .eq("id", recipeId)
                .maybeSingle();

            if (getError) {
                console.error(
                    "Error retrieving recipe:",
                    getError,
                );
                throw getError;
            }

            // Check if recipe exists
            if (!existingRecipe) {
                throw new Error(`Recipe with ID ${recipeId} not found`);
            }

            // Update the recipe's public status
            const { error: updateError } = await supabase
                .from("recipes")
                .update({ is_public: isPublic })
                .eq("id", recipeId);

            if (updateError) {
                console.error(
                    "Error updating recipe public status:",
                    updateError,
                );
                throw updateError;
            }

            console.log(
                `Successfully updated recipe ${recipeId} to isPublic=${isPublic}`,
            );
            return true;
        } catch (error) {
            console.error("Error in updateRecipePublicStatus:", error);
            throw error;
        }
    }

    /**
     * Check if the current authenticated user has edit permission for a recipe
     * @param recipeId - The ID of the recipe to check
     * @returns A boolean indicating whether the user can edit the recipe
     */
    static async checkEditPermission(recipeId: string): Promise<boolean> {
        try {
            // Call the RPC function to check edit permission
            const { data, error } = await supabase.rpc(
                "check_recipe_edit_permission",
                { recipe_id_to_check: recipeId },
            );

            if (error) {
                console.error("Error checking edit permission:", error);
                return false;
            }

            return !!data; // Convert to boolean
        } catch (error) {
            console.error("Error in checkEditPermission:", error);
            return false;
        }
    }
}
