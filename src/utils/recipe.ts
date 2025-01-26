export const scaleQuantity = (
    originalQuantity: number | null,
    originalServings: number,
    newServings: number
): number | null => {
    if (originalQuantity === null) return null;
    return Number(
        ((originalQuantity * newServings) / originalServings).toFixed(2)
    );
};

export const formatQuantity = (quantity: number | null): string => {
    if (quantity === null) return '';

    // Handle whole numbers
    if (Number.isInteger(quantity)) return quantity.toString();

    // Handle common fractions
    const fractions: Record<number, string> = {
        0.25: '¼',
        0.33: '⅓',
        0.5: '½',
        0.67: '⅔',
        0.75: '¾',
    };

    // Round to 2 decimal places for comparison
    const rounded = Math.round(quantity * 100) / 100;

    // Check if it matches any common fraction
    for (const [decimal, fraction] of Object.entries(fractions)) {
        if (Math.abs(rounded - Number(decimal)) < 0.01) {
            return fraction;
        }
    }

    // For other decimals, show up to 2 decimal places
    return rounded.toString();
};
