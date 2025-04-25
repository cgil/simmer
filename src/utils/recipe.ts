import { Recipe } from "../types";
import { formatIngredientDisplayText } from "./ingredientDisplay";

export const scaleQuantity = (
    originalQuantity: number | null,
    originalServings: number,
    newServings: number,
): number | null => {
    if (originalQuantity === null) return null;
    return (originalQuantity * newServings) / originalServings;
};

export const formatQuantity = (quantity: number | null): string => {
    if (quantity === null) return "";

    // Round to at most 1 decimal place
    const rounded = Math.round(quantity * 10) / 10;

    // Convert to string, removing trailing zeros (e.g., 1.0 -> 1)
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
};

export const parseIngredientReferences = (
    step: string,
    recipe: Recipe,
    currentServings: number,
): string => {
    // Handle the new @-mention format
    return step.replace(
        /@\[([^\]]+)\]\(([^)]+)\)/g,
        (match, _display, ingredientId) => {
            const ingredient = recipe.ingredients.find(
                (item) => item.id === ingredientId,
            );

            if (!ingredient) return match;

            // Calculate scaled quantity
            const scaledQuantity = ingredient.quantity
                ? scaleQuantity(
                    ingredient.quantity,
                    recipe.servings || 1, // Ensure we have a valid servings value (default to 1)
                    currentServings,
                )
                : null;

            // Use the formatIngredientDisplayText utility for consistent display
            const displayText = formatIngredientDisplayText(
                ingredient,
                scaledQuantity,
            );

            // Maintain the same @-mention format with updated display text
            return `@[${displayText}](${ingredientId})`;
        },
    );
};
