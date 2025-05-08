import ColorContrastChecker from "color-contrast-checker";

/**
 * Calculates the optimal text color (white or black) for best contrast against a background color
 * @param backgroundColor Background color in hex format (e.g., "#FF5500")
 * @returns The optimal text color as hex - either "#FFFFFF" or "#000000"
 */
export const getOptimalTextColor = (backgroundColor: string): string => {
    // Default to white text if no background color is provided
    if (!backgroundColor) return "#FFFFFF";

    // Normalize the background color (ensure it's in hex format and has # prefix)
    const normalizedColor = backgroundColor.startsWith("#")
        ? backgroundColor
        : `#${backgroundColor}`;

    // Create color contrast checker instance
    const contrastChecker = new ColorContrastChecker();

    // Check contrast ratios for white and black text against the background
    const whiteContrast = contrastChecker.getContrastRatio(
        normalizedColor,
        "#FFFFFF",
    );
    const blackContrast = contrastChecker.getContrastRatio(
        normalizedColor,
        "#000000",
    );

    // Bias toward white text - only use black if it provides at least 25% better contrast
    // This ensures we maintain a consistent design preference for white text
    // while still switching to black when it's significantly more readable
    return blackContrast > whiteContrast * 1.25 ? "#000000" : "#FFFFFF";
};

/**
 * Checks if a color is considered "light" based on its RGB values
 * @param backgroundColor Background color in hex format (e.g., "#FF5500")
 * @returns Boolean indicating if the color is light (true) or dark (false)
 */
export const isLightColor = (backgroundColor: string): boolean => {
    // Default to false (dark) if no color provided
    if (!backgroundColor) return false;

    // Remove hash prefix if present
    const hex = backgroundColor.replace("#", "");

    // Parse hex color to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate perceived brightness using the formula: (R * 0.299 + G * 0.587 + B * 0.114)
    // https://www.w3.org/TR/AERT/#color-contrast
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;

    // Brightness > 155 is considered light
    return brightness > 155;
};
