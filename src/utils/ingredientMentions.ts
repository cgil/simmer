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

/**
 * Converts slug-based ingredient references to UUID-based references
 * Example: @[andouille sausage](andouille-sausage) -> @[andouille sausage](3f6a1aac-6c59-4f4e-8b17-0e66aa72ffd0)
 *
 * @param text - Text containing @mentions with potential slug IDs
 * @param ingredients - Array of ingredients to use for finding UUIDs
 * @returns Text with slug references converted to UUID references
 */
export const convertSlugReferencesToUuids = (
    text: string,
    ingredients: Ingredient[],
): string => {
    if (!text || !ingredients?.length) return text;

    // Handle multiple reference formats
    // 1. @[display](slug-id)
    // 2. @[display](uuid)
    // 3. @display

    // Create an ingredient mapping for fast lookups
    const ingredientNameMap = new Map();
    const ingredientSlugMap = new Map();
    const ingredientUuidMap = new Map();

    ingredients.forEach((ing) => {
        // Store for lookup by name (case insensitive)
        ingredientNameMap.set(ing.name.toLowerCase(), ing);

        // Store for lookup by potential slug (derived from name)
        const potentialSlug = ing.name.toLowerCase().replace(/\s+/g, "-");
        ingredientSlugMap.set(potentialSlug, ing);

        // Store for verification of valid UUIDs
        if (ing.id) {
            ingredientUuidMap.set(ing.id, ing);
        }
    });

    // First pass: handle @[display](slug-id) format
    let updatedText = text.replace(
        /@\[([^\]]+)\]\(([^)]+)\)/g,
        (match, display, id) => {
            // Check if this is already a valid UUID
            const isUuid =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                    .test(id);
            if (isUuid && ingredientUuidMap.has(id)) {
                // Already a valid UUID, no change needed
                return match;
            }

            // If it's a slug, try to find the matching ingredient
            if (ingredientSlugMap.has(id)) {
                const ingredient = ingredientSlugMap.get(id);
                return `@[${display}](${ingredient.id})`;
            }

            // If the ID doesn't match, try to match by name
            const nameLower = display.toLowerCase();

            // Try exact name match
            if (ingredientNameMap.has(nameLower)) {
                const ingredient = ingredientNameMap.get(nameLower);
                return `@[${display}](${ingredient.id})`;
            }

            // Try partial name match (name might contain quantity and unit)
            const nameWithoutQuantity = nameLower.replace(
                /^\d+\.?\d*\s*[a-z]*\s+/i,
                "",
            );

            // Find ingredient with name contained in the display text or vice versa
            const matchingIngredient = ingredients.find((ing) =>
                ing.name.toLowerCase().includes(nameWithoutQuantity) ||
                nameWithoutQuantity.includes(ing.name.toLowerCase())
            );

            if (matchingIngredient) {
                return `@[${display}](${matchingIngredient.id})`;
            }

            // If no match found, leave it as is
            return match;
        },
    );

    // Second pass: handle simple @mentions without parentheses
    updatedText = updatedText.replace(/@(\w+)/g, (match, name) => {
        const nameLower = name.toLowerCase();

        // Try to find matching ingredient
        const matchingIngredient = ingredients.find((ing) =>
            ing.name.toLowerCase().includes(nameLower) ||
            nameLower.includes(ing.name.toLowerCase())
        );

        if (matchingIngredient) {
            return `@[${name}](${matchingIngredient.id})`;
        }

        // If no match found, leave it as is
        return match;
    });

    return updatedText;
};

/**
 * Process all instruction steps to convert slug references to UUID references
 */
export const convertRecipeInstructionReferences = (
    instructions: InstructionSection[],
    ingredients: Ingredient[],
): InstructionSection[] => {
    return instructions.map((section) => ({
        ...section,
        steps: section.steps.map((step) => ({
            ...step,
            text: convertSlugReferencesToUuids(step.text, ingredients),
        })),
    }));
};
