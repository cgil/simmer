declare module "color-contrast-checker" {
    export default class ColorContrastChecker {
        /**
         * Returns the contrast ratio between two colors
         * @param color1 First color in hexadecimal format (e.g., "#FF5500")
         * @param color2 Second color in hexadecimal format (e.g., "#FFFFFF")
         * @returns The contrast ratio as a number
         */
        getContrastRatio(color1: string, color2: string): number;

        /**
         * Checks if the contrast between two colors passes WCAG 2.0 AA standard
         * @param color1 First color in hexadecimal format (e.g., "#FF5500")
         * @param color2 Second color in hexadecimal format (e.g., "#FFFFFF")
         * @param fontSize Font size in pixels
         * @returns Boolean indicating if the contrast meets AA standards
         */
        isLevelAA(color1: string, color2: string, fontSize?: number): boolean;

        /**
         * Checks if the contrast between two colors passes WCAG 2.0 AAA standard
         * @param color1 First color in hexadecimal format (e.g., "#FF5500")
         * @param color2 Second color in hexadecimal format (e.g., "#FFFFFF")
         * @param fontSize Font size in pixels
         * @returns Boolean indicating if the contrast meets AAA standards
         */
        isLevelAAA(color1: string, color2: string, fontSize?: number): boolean;
    }
}
