import { Ingredient } from "../types/recipe";
import { formatQuantity } from "./recipe";

/**
 * Formats an ingredient display text including quantity and units when available
 */
export const formatIngredientDisplayText = (
    ingredient: Ingredient,
    scaledQuantity?: number | null,
): string => {
    const quantity = scaledQuantity !== undefined
        ? scaledQuantity
        : ingredient.quantity;

    if (quantity !== null && quantity !== undefined) {
        return `${formatQuantity(quantity)}${
            ingredient.unit && ingredient.unit.trim()
                ? " " + ingredient.unit
                : ""
        } ${ingredient.name}`;
    }

    return ingredient.name;
};
