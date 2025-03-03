import { Recipe } from "../types";
import { formatIngredientDisplayText } from "../pages/recipe/components/IngredientReferenceMention";

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

    // Handle whole numbers
    if (Number.isInteger(quantity)) return quantity.toString();

    // Round to 2 decimal places
    const rounded = Math.round(quantity * 100) / 100;

    // Common fractions mapping
    const fractions: { [key: string]: string } = {
        "0.25": "¼",
        "0.5": "½",
        "0.75": "¾",
        "0.33": "⅓",
        "0.67": "⅔",
    };

    // Check if we have a common fraction
    const roundedStr = rounded.toString();
    return fractions[roundedStr] || roundedStr;
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
