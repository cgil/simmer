import { Ingredient } from "../types/recipe";

// We can't import the component directly here to avoid a circular dependency
// This will be rendered later at the component level
export interface IngredientMention {
    id: string;
    display: string;
    ingredient?: Ingredient;
}

// Define the step timing interface
interface StepTiming {
    min: number;
    max: number;
    units: string;
}

// Define the instruction step interface
interface InstructionStep {
    text: string;
    timing: StepTiming | null;
}

// Define the instruction section interface
interface InstructionSection {
    section_title: string;
    steps: InstructionStep[];
}

/**
 * Parse text with ingredient mentions in the format @[display](id)
 * and split into segments of text and mention data
 */
export const parseIngredientMentions = (
    text: string,
    ingredients: Ingredient[],
): (string | IngredientMention)[] => {
    if (!text) return [];

    // Match the pattern @[display](id)
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    const segments: (string | IngredientMention)[] = [];
    let match: RegExpExecArray | null;

    // Find all matches in the text
    while ((match = regex.exec(text)) !== null) {
        // Add the text before the mention
        if (match.index > lastIndex) {
            segments.push(text.substring(lastIndex, match.index));
        }

        const [fullMatch, display, id] = match;
        // Find the referenced ingredient
        const ingredient = ingredients.find((ing) => ing.id === id);

        // Add the ingredient mention data
        segments.push({
            id,
            display,
            ingredient,
        });

        lastIndex = match.index + fullMatch.length;
    }

    // Add any remaining text after the last mention
    if (lastIndex < text.length) {
        segments.push(text.substring(lastIndex));
    }

    return segments;
};

/**
 * Convert legacy ingredient mentions in the format [INGREDIENT=id] to the new format @[display](id)
 */
export const convertLegacyIngredientMentions = (
    text: string,
    ingredients: Ingredient[],
): string => {
    if (!text) return "";

    // Replace [INGREDIENT=id] with @[display](id)
    return text.replace(/\[INGREDIENT=([^\]]+)\]/g, (match, ingredientId) => {
        const ingredient = ingredients.find((ing) => ing.id === ingredientId);
        if (!ingredient) return match; // Keep the original if ingredient not found

        return `@[${ingredient.name}](${ingredientId})`;
    });
};

/**
 * After loading a recipe, convert all legacy ingredient mentions to the new format
 */
export const convertRecipeIngredientMentions = (
    instructions: InstructionSection[],
    ingredients: Ingredient[],
): InstructionSection[] => {
    return instructions.map((section) => ({
        ...section,
        steps: section.steps.map((step) => ({
            ...step,
            text: convertLegacyIngredientMentions(step.text, ingredients),
        })),
    }));
};
