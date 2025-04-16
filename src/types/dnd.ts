export const ItemTypes = {
    RECIPE_CARD: "recipe_card",
};

export interface RecipeDragItem {
    type: typeof ItemTypes.RECIPE_CARD;
    recipeId: string;
    sourceCollectionId: string | null; // The ID of the collection the recipe is being dragged FROM (null if 'All Recipes')
}
