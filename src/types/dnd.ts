export const ItemTypes = {
    RECIPE_CARD: "recipe_card",
};

export interface RecipeDragItem {
    type: typeof ItemTypes.RECIPE_CARD;
    recipeId: string;
    sourceCollectionId: string; // The ID of the collection the recipe is being dragged FROM ('all' for All Recipes)
    currentPosition?: number; // Current position of the recipe (for reordering within a collection)
    isReordering?: boolean; // Flag to indicate this is a reordering operation within the same collection
}
