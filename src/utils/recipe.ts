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

/**
 * Calculates the final numeric quantity after snapping/rounding
 * according to cooking-friendly logic.
 */
export const getCookFriendlyQuantity = (
    quantity: number | null,
): number | null => {
    if (quantity === null || quantity === undefined) return null;

    const integerPart = Math.floor(quantity);
    const fractionalPart = quantity - integerPart;
    const threshold = 0.02; // How close to snap

    let finalQuantity: number;

    // Check for snapping to quarters/halves/wholes
    if (Math.abs(fractionalPart - 0.25) <= threshold) {
        finalQuantity = integerPart + 0.25;
    } else if (Math.abs(fractionalPart - 0.5) <= threshold) {
        finalQuantity = integerPart + 0.5;
    } else if (Math.abs(fractionalPart - 0.75) <= threshold) {
        finalQuantity = integerPart + 0.75;
    } else if (Math.abs(fractionalPart - 1) <= threshold) {
        // Snap near the next whole number (e.g., 0.98 -> 1)
        finalQuantity = integerPart + 1;
    } else if (fractionalPart <= threshold) {
        // Snap near zero (e.g., 0.02 -> 0)
        finalQuantity = integerPart;
    } else {
        // Default: round to 1 decimal place numerically
        finalQuantity = Math.round(quantity * 10) / 10;
    }
    return finalQuantity;
};

/**
 * Formats a quantity (number) into a cooking-friendly string representation.
 * Uses getCookFriendlyQuantity internally for the rounding logic.
 */
export const formatQuantity = (quantity: number | null): string => {
    const finalQuantity = getCookFriendlyQuantity(quantity);

    if (finalQuantity === null || finalQuantity === undefined) return "";

    // Format the final number string
    if (finalQuantity % 1 === 0) {
        // Whole number
        return finalQuantity.toString();
    } else if (Math.abs((finalQuantity * 100) % 100 - 50) < 0.1) {
        // Ends in .5 (check with tolerance for floating point)
        return finalQuantity.toFixed(1);
    } else if (
        Math.abs((finalQuantity * 100) % 100 - 25) < 0.1 ||
        Math.abs((finalQuantity * 100) % 100 - 75) < 0.1
    ) {
        // Ends in .25 or .75 (check with tolerance)
        return finalQuantity.toFixed(2);
    } else {
        // Other decimals (rounded to 1 place by getCookFriendlyQuantity)
        // Use toFixed(1) to ensure consistency like 0.3
        return finalQuantity.toFixed(1);
    }
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
