import { Ingredient } from "../types/recipe";
import { SubstitutionState } from "../types/substitution";
import { isValidUuid } from "./uuid";

// We can't import the component directly here to avoid a circular dependency
// This will be rendered later at the component level
export interface IngredientMention {
    id: string;
    display: string;
    ingredient?: Ingredient;
    scaledQuantity?: number | null;
    hasSubstitution?: boolean;
    substitutionInfo?: SubstitutionState | null;
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
    servings?: number,
    originalServings?: number,
    substitutions?: Record<string, SubstitutionState>,
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

        // Check if this ingredient has a substitution
        const hasSubstitution = substitutions && id in substitutions;
        const substitutionInfo = hasSubstitution ? substitutions?.[id] : null;

        // Calculate scaled quantity if applicable
        let scaledQuantity = null;
        if (
            ingredient?.quantity !== null &&
            ingredient?.quantity !== undefined &&
            servings &&
            originalServings
        ) {
            scaledQuantity = (ingredient.quantity * servings) /
                originalServings;
        }

        // Add the ingredient mention data
        segments.push({
            id,
            display,
            ingredient,
            scaledQuantity,
            hasSubstitution: Boolean(hasSubstitution),
            substitutionInfo: substitutionInfo || null,
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
            text: convertSlugReferencesToUuids(
                convertLegacyIngredientMentions(step.text, ingredients),
                ingredients,
            ),
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

    // Check if we have valid ingredients with UUIDs
    const validIngredients = ingredients.filter((ing) => {
        const hasValidUuid = isValidUuid(ing.id);
        return hasValidUuid && ing.name;
    });

    if (validIngredients.length === 0) {
        console.warn(
            "No valid ingredients with UUIDs found for reference conversion",
        );
        return text;
    }

    // Handle multiple reference formats
    // 1. @[display](slug-id)
    // 2. @[display](uuid)
    // 3. @display

    // Create an ingredient mapping for fast lookups
    const ingredientNameMap = new Map();
    const ingredientSlugMap = new Map();
    const ingredientUuidMap = new Map();

    validIngredients.forEach((ing) => {
        // Store for lookup by name (case insensitive)
        ingredientNameMap.set(ing.name.toLowerCase(), ing);

        // Store for lookup by potential slug (derived from name)
        const potentialSlug = ing.name.toLowerCase().replace(/\s+/g, "-");
        ingredientSlugMap.set(potentialSlug, ing);

        // Store for verification of valid UUIDs
        ingredientUuidMap.set(ing.id, ing);
    });

    // First pass: handle @[display](slug-id) format
    let updatedText = text.replace(
        /@\[([^\]]+)\]\(([^)]+)\)/g,
        (match, display, id) => {
            // Check if this is already a valid UUID
            const isUuidFormat = isValidUuid(id);

            // If it's a valid UUID and exists in our ingredients, no change needed
            if (isUuidFormat && ingredientUuidMap.has(id)) {
                return match;
            }

            // If it's a slug, try to find the matching ingredient
            if (ingredientSlugMap.has(id)) {
                const ingredient = ingredientSlugMap.get(id);
                return `@[${display}](${ingredient.id})`;
            }

            // Try to match by name - strip any quantity and unit info from display
            const nameLower = display.toLowerCase();

            // First try exact name match
            if (ingredientNameMap.has(nameLower)) {
                const ingredient = ingredientNameMap.get(nameLower);
                return `@[${display}](${ingredient.id})`;
            }

            // Extract the likely name from the display text
            // This handles cases like "2 cups flour" -> "flour"
            const nameWithoutQuantity = nameLower.replace(
                /^(\d+\.?\d*\s*([a-z]+\s+)?)/i,
                "",
            ).trim();

            // Try best match by ingredient name
            if (nameWithoutQuantity) {
                // Sort ingredients by name similarity, closest match first
                const matches = validIngredients
                    .map((ing) => ({
                        ingredient: ing,
                        // Simple similarity measure
                        similarity: Math.max(
                            nameWithoutQuantity.includes(ing.name.toLowerCase())
                                ? 0.8
                                : 0,
                            ing.name.toLowerCase().includes(nameWithoutQuantity)
                                ? 0.7
                                : 0,
                            ing.name.toLowerCase() === nameWithoutQuantity
                                ? 1
                                : 0,
                        ),
                    }))
                    .filter((match) => match.similarity > 0)
                    .sort((a, b) => b.similarity - a.similarity);

                // Use the best match if found
                if (matches.length > 0) {
                    return `@[${display}](${matches[0].ingredient.id})`;
                }
            }

            // If we can't match to an existing ingredient, convert the ID to a valid UUID format
            if (!isUuidFormat) {
                const validUuid = isValidUuid(id);
                console.warn(
                    `Converting non-UUID reference ID '${id}' to UUID format: ${validUuid}`,
                );
                return `@[${display}](${validUuid})`;
            }

            // If we can't match, print a warning and keep the original
            console.warn(
                `Could not find a valid ingredient match for: "${display}" with ID: "${id}"`,
            );

            // Default to the first ingredient if we must replace with a valid UUID
            if (validIngredients.length > 0) {
                console.warn(
                    `Using fallback ingredient: "${
                        validIngredients[0].name
                    }" for reference`,
                );
                return `@[${display}](${validIngredients[0].id})`;
            }

            return match;
        },
    );

    // Second pass: handle simple @mentions without parentheses
    updatedText = updatedText.replace(/@(\w+)/g, (match, name) => {
        const nameLower = name.toLowerCase();

        // Try to find matching ingredient
        const matches = validIngredients
            .map((ing) => ({
                ingredient: ing,
                similarity: Math.max(
                    nameLower.includes(ing.name.toLowerCase()) ? 0.7 : 0,
                    ing.name.toLowerCase().includes(nameLower) ? 0.6 : 0,
                    ing.name.toLowerCase() === nameLower ? 1 : 0,
                ),
            }))
            .filter((match) => match.similarity > 0)
            .sort((a, b) => b.similarity - a.similarity);

        if (matches.length > 0) {
            return `@[${name}](${matches[0].ingredient.id})`;
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
