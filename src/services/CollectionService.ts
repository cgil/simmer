import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/recipe";
import type { Collection, CollectionItem } from "../types/collection";
import { ALL_RECIPES_ID } from "../types/collection";
import { RecipeService } from "./RecipeService";

/**
 * Service to handle all collection and recipe-collection operations
 */
export class CollectionService {
    /**
     * Get all collections for a user
     * @param userId - The ID of the user
     * @returns A list of collections with recipe counts
     */
    static async getCollections(userId: string): Promise<Collection[]> {
        try {
            // First get all collections
            const { data: collections, error } = await supabase
                .from("collections")
                .select("*")
                .eq("user_id", userId)
                .order("name");

            if (error) {
                console.error("Error fetching collections:", error);
                throw error;
            }

            if (!collections || collections.length === 0) {
                return [];
            }

            // Then get recipe counts for each collection using count aggregation
            const collectionIds = collections.map((c) => c.id);

            // Use raw SQL for counting to avoid type issues
            const { data: counts, error: countError } = await supabase
                .rpc("get_collection_counts", {
                    collection_ids: collectionIds,
                });

            if (countError) {
                console.error("Error fetching collection counts:", countError);
                throw countError;
            }

            // Map counts to collections
            const countsMap = new Map<string, number>();
            if (counts) {
                counts.forEach(
                    (item: { collection_id: string; count: number }) => {
                        countsMap.set(item.collection_id, item.count);
                    },
                );
            }

            // Return collections with counts
            return collections.map((collection) => ({
                ...collection,
                recipe_count: countsMap.get(collection.id) || 0,
            }));
        } catch (error) {
            console.error("Error in getCollections:", error);
            throw error;
        }
    }

    /**
     * Get collection items for UI display, including the "All Recipes" special case
     * @param userId - The ID of the user
     * @returns A list of collection items for the UI
     */
    static async getCollectionItems(userId: string): Promise<CollectionItem[]> {
        try {
            // Get all collections with counts
            const collections = await this.getCollections(userId);

            // Get total recipe count for "All Recipes"
            const { count: totalCount, error: countError } = await supabase
                .from("recipes")
                .select("id", { count: "exact", head: true })
                .eq("user_id", userId);

            if (countError) {
                console.error("Error fetching total recipe count:", countError);
                throw countError;
            }

            // Create collection items array with "All Recipes" at the beginning
            const allRecipesItem: CollectionItem = {
                id: ALL_RECIPES_ID,
                name: "All Recipes",
                count: totalCount || 0,
                emoji: "📚",
            };

            // Map collections to collection items
            const collectionItems = collections.map((collection) => ({
                id: collection.id,
                name: collection.name,
                count: collection.recipe_count || 0,
                emoji: collection.emoji || undefined,
            }));

            // Return with "All Recipes" first, then alphabetically sorted collections
            return [allRecipesItem, ...collectionItems];
        } catch (error) {
            console.error("Error in getCollectionItems:", error);
            throw error;
        }
    }

    /**
     * Create a new collection
     * @param userId - The ID of the user creating the collection
     * @param name - The name of the collection
     * @param emoji - Optional emoji for the collection
     * @returns The created collection
     */
    static async createCollection(
        userId: string,
        name: string,
        emoji?: string,
    ): Promise<Collection> {
        if (!name.trim()) {
            throw new Error("Collection name is required");
        }

        const { data, error } = await supabase
            .from("collections")
            .insert({
                user_id: userId,
                name: name.trim(),
                emoji: emoji || null,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating collection:", error);
            throw error;
        }

        return {
            ...data,
            recipe_count: 0,
        };
    }

    /**
     * Update a collection's name or emoji
     * @param collectionId - The ID of the collection to update
     * @param updates - Object containing the fields to update
     * @returns The updated collection
     */
    static async updateCollection(
        collectionId: string,
        updates: { name?: string; emoji?: string },
    ): Promise<Collection> {
        // Check for valid updates
        if (updates.name && !updates.name.trim()) {
            throw new Error("Collection name cannot be empty");
        }

        const updateData: { name?: string; emoji?: string | null } = {};

        if (updates.name) {
            updateData.name = updates.name.trim();
        }

        // Allow explicitly setting emoji to null to remove it
        if (updates.emoji !== undefined) {
            updateData.emoji = updates.emoji || null;
        }

        const { data, error } = await supabase
            .from("collections")
            .update(updateData)
            .eq("id", collectionId)
            .select()
            .single();

        if (error) {
            console.error("Error updating collection:", error);
            throw error;
        }

        // Get the recipe count
        const { count, error: countError } = await supabase
            .from("recipe_collections")
            .select("*", { count: "exact" })
            .eq("collection_id", collectionId);

        if (countError) {
            console.error("Error getting collection recipe count:", countError);
            throw countError;
        }

        return {
            ...data,
            recipe_count: count || 0,
        };
    }

    /**
     * Delete a collection and all its recipe associations
     * @param collectionId - The ID of the collection to delete
     * @returns True if successful
     */
    static async deleteCollection(collectionId: string): Promise<boolean> {
        const { error } = await supabase
            .from("collections")
            .delete()
            .eq("id", collectionId);

        if (error) {
            console.error("Error deleting collection:", error);
            throw error;
        }

        return true;
    }

    /**
     * Add a recipe to a collection
     * @param recipeId - The ID of the recipe to add
     * @param collectionId - The ID of the collection to add the recipe to
     * @returns True if successful
     */
    static async addRecipeToCollection(
        recipeId: string,
        collectionId: string,
    ): Promise<boolean> {
        try {
            // First, find the maximum position value in the collection
            const { data: positionData, error: positionError } = await supabase
                .from("recipe_collections")
                .select("position")
                .eq("collection_id", collectionId)
                .order("position", { ascending: false })
                .limit(1);

            if (positionError) {
                console.error("Error getting max position:", positionError);
                throw positionError;
            }

            // Calculate new position - either 1000 higher than the current max, or 1000 if no recipes exist
            const maxPosition = positionData && positionData.length > 0
                ? positionData[0].position
                : 0;
            const newPosition = maxPosition + 1000;

            // Insert with the calculated position
            const { error } = await supabase
                .from("recipe_collections")
                .insert({
                    recipe_id: recipeId,
                    collection_id: collectionId,
                    position: newPosition,
                });

            if (error) {
                // If error is duplicate, just return true
                if (error.code === "23505") { // Unique violation
                    console.log("Recipe already in collection");
                    return true;
                }
                console.error("Error adding recipe to collection:", error);
                throw error;
            }

            return true;
        } catch (error) {
            console.error("Error in addRecipeToCollection:", error);
            throw error;
        }
    }

    /**
     * Remove a recipe from a collection
     * @param recipeId - The ID of the recipe to remove
     * @param collectionId - The ID of the collection to remove the recipe from
     * @returns True if successful
     */
    static async removeRecipeFromCollection(
        recipeId: string,
        collectionId: string,
    ): Promise<boolean> {
        const { error } = await supabase
            .from("recipe_collections")
            .delete()
            .eq("recipe_id", recipeId)
            .eq("collection_id", collectionId);

        if (error) {
            console.error("Error removing recipe from collection:", error);
            throw error;
        }

        return true;
    }

    /**
     * Get recipes by collection
     * @param userId - The ID of the user
     * @param collectionId - The ID of the collection to get recipes from
     * @returns A list of recipes in the collection
     */
    static async getRecipesByCollection(
        userId: string,
        collectionId: string,
    ): Promise<Recipe[]> {
        try {
            // First, get recipe IDs with their positions in the collection
            const { data: recipeData, error: recipeDataError } = await supabase
                .from("recipe_collections")
                .select("recipe_id, position")
                .eq("collection_id", collectionId)
                .order("position"); // Order by position

            if (recipeDataError) {
                console.error("Error fetching recipe data:", recipeDataError);
                throw recipeDataError;
            }

            if (!recipeData || recipeData.length === 0) {
                return [];
            }

            // Extract recipe IDs
            const ids = recipeData.map((r) => r.recipe_id);
            // Create a map of recipe ID to position for later sorting
            const positionMap = Object.fromEntries(
                recipeData.map((r) => [r.recipe_id, r.position]),
            );

            // Get the full recipe data for these IDs
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
                .in("id", ids);

            if (error) {
                console.error("Error fetching recipes by collection:", error);
                throw error;
            }

            if (!recipes) {
                return [];
            }

            // Map recipes to our application model and sort by the position in the collection
            const mappedRecipes = recipes.map((recipe) =>
                RecipeService.mapDbRecipeToRecipe(recipe)
            );

            // Sort by the position values we retrieved earlier
            return mappedRecipes.sort((a, b) => {
                const posA = a.id && positionMap[a.id] ? positionMap[a.id] : 0;
                const posB = b.id && positionMap[b.id] ? positionMap[b.id] : 0;
                return posA - posB;
            });
        } catch (error) {
            console.error("Error in getRecipesByCollection:", error);
            throw error;
        }
    }

    /**
     * Get collections for a recipe
     * @param recipeId - The ID of the recipe
     * @returns A list of collections the recipe belongs to
     */
    static async getCollectionsForRecipe(
        recipeId: string,
    ): Promise<Collection[]> {
        try {
            const { data, error } = await supabase
                .from("recipe_collections")
                .select(`
                    collection_id,
                    collections:collection_id (*)
                `)
                .eq("recipe_id", recipeId);

            if (error) {
                console.error("Error fetching collections for recipe:", error);
                throw error;
            }

            if (!data || data.length === 0) {
                return [];
            }

            // Transform the data to return correctly typed Collection array
            const collections: Collection[] = [];

            for (const item of data) {
                if (item.collections) {
                    const collection = item
                        .collections as unknown as Collection;
                    collections.push({
                        ...collection,
                        recipe_count: 0, // We don't need the count here
                    });
                }
            }

            return collections;
        } catch (error) {
            console.error("Error in getCollectionsForRecipe:", error);
            throw error;
        }
    }

    /**
     * Update the position of a recipe within a collection
     * This supports drag-and-drop reordering of recipes
     * @param recipeId - The ID of the recipe to reposition
     * @param collectionId - The ID of the collection
     * @param newPosition - The new position value
     * @returns True if successful
     */
    static async updateRecipePositionInCollection(
        recipeId: string,
        collectionId: string,
        newPosition: number,
    ): Promise<boolean> {
        try {
            // First, get the current recipe_collections record
            const { data: existingRecord, error: fetchError } = await supabase
                .from("recipe_collections")
                .select("id, position")
                .eq("recipe_id", recipeId)
                .eq("collection_id", collectionId)
                .single();

            if (fetchError) {
                console.error(
                    "Error fetching recipe collection record:",
                    fetchError,
                );
                throw fetchError;
            }

            if (!existingRecord) {
                throw new Error("Recipe not found in this collection");
            }

            // Update the position
            const { error: updateError } = await supabase
                .from("recipe_collections")
                .update({ position: newPosition })
                .eq("id", existingRecord.id);

            if (updateError) {
                console.error("Error updating recipe position:", updateError);
                throw updateError;
            }

            return true;
        } catch (error) {
            console.error("Error in updateRecipePositionInCollection:", error);
            throw error;
        }
    }

    /**
     * Get the positions of recipes in a collection
     * Useful for determining available positions for reordering
     * @param collectionId - The ID of the collection
     * @returns Array of recipe positions
     */
    static async getRecipePositionsInCollection(
        collectionId: string,
    ): Promise<{ recipeId: string; position: number }[]> {
        try {
            const { data, error } = await supabase
                .from("recipe_collections")
                .select("recipe_id, position")
                .eq("collection_id", collectionId)
                .order("position");

            if (error) {
                console.error("Error fetching recipe positions:", error);
                throw error;
            }

            return data?.map((item) => ({
                recipeId: item.recipe_id,
                position: item.position,
            })) || [];
        } catch (error) {
            console.error("Error in getRecipePositionsInCollection:", error);
            throw error;
        }
    }
}
