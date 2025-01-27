import { Recipe } from '../types';

export const scaleQuantity = (
    originalQuantity: number | null,
    originalServings: number,
    newServings: number
): number | null => {
    if (originalQuantity === null) return null;
    return (originalQuantity * newServings) / originalServings;
};

export const formatQuantity = (quantity: number | null): string => {
    if (quantity === null) return '';

    // Handle whole numbers
    if (Number.isInteger(quantity)) return quantity.toString();

    // Round to 2 decimal places
    const rounded = Math.round(quantity * 100) / 100;

    // Common fractions mapping
    const fractions: { [key: string]: string } = {
        '0.25': '¼',
        '0.5': '½',
        '0.75': '¾',
        '0.33': '⅓',
        '0.67': '⅔',
    };

    // Check if we have a common fraction
    const roundedStr = rounded.toString();
    return fractions[roundedStr] || roundedStr;
};

export const parseIngredientReferences = (
    step: string,
    recipe: Recipe,
    currentServings: number
): string => {
    return step.replace(/\[INGREDIENT=([^\]]+)\]/g, (match, ingredientId) => {
        const ingredient = recipe.ingredients.find(
            (item) => item.id === ingredientId
        );

        if (!ingredient) return match;

        const scaledQuantity = ingredient.quantity
            ? scaleQuantity(
                  ingredient.quantity,
                  recipe.servings,
                  currentServings
              )
            : null;

        const quantityStr = scaledQuantity
            ? `${formatQuantity(scaledQuantity)} ${ingredient.unit || ''} `
            : '';

        // Return the ingredient with its quantity but keep it wrapped in a tag
        return `[INGREDIENT=${quantityStr}${ingredient.name}]`;
    });
};
