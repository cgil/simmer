import { z } from "https://deno.land/x/zod@v3.24.1/mod.ts";

// Helper function to generate kebab-case IDs
export function generateId(text: string): string {
    return text
        .toLowerCase()
        // Replace special characters with spaces
        .replace(/[^a-z0-9\s-]/g, "")
        // Replace multiple spaces with single space
        .replace(/\s+/g, " ")
        .trim()
        // Replace spaces with hyphens
        .replace(/\s/g, "-")
        // Remove consecutive hyphens
        .replace(/-+/g, "-");
}

// Define interfaces for recipe components
export interface IngredientWithId {
    id: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    notes: string | null;
}

export interface InstructionStep {
    text: string;
    timing: { min: number; max: number; units: string } | null;
}

export interface InstructionSection {
    id?: string;
    section_title: string;
    steps: InstructionStep[];
}

// Simple environment-aware logger for Deno functions
const isProduction = Deno.env.get("ENVIRONMENT") === "production";
const logger = {
    log: (...args: unknown[]) => {
        if (!isProduction) {
            console.log(...args);
        }
    },
    error: (...args: unknown[]) => {
        console.error(...args);
    },
};

// Function to validate AI-generated ingredient mentions
export function validateIngredientMentions(
    instructions: InstructionSection[],
    ingredients: IngredientWithId[],
): InstructionSection[] {
    // Create a map of ingredient IDs for validation
    const ingredientIdMap = new Map<string, IngredientWithId>();
    const ingredientNameMap = new Map<string, IngredientWithId>();

    // Build validation maps
    ingredients.forEach((ingredient) => {
        ingredientIdMap.set(ingredient.id, ingredient);
        ingredientNameMap.set(ingredient.name.toLowerCase(), ingredient);
    });

    // Validate each instruction section and its steps
    return instructions.map((section) => {
        const validatedSteps = section.steps.map((step) => {
            let text = step.text;

            // Skip empty steps
            if (!text || !text.trim()) {
                return step;
            }

            // Regex to find all ingredient mentions
            const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
            const matches = [...text.matchAll(mentionPattern)];

            if (matches.length > 0) {
                // Check and fix mentions as needed
                matches.forEach((match) => {
                    const [fullMatch, displayName, id] = match;

                    // Check if ID exists in our ingredients
                    if (!ingredientIdMap.has(id)) {
                        // Try to find by display name
                        const matchByName = ingredientNameMap.get(
                            displayName.toLowerCase(),
                        );

                        if (matchByName) {
                            // Replace with correct ID
                            text = text.replace(
                                fullMatch,
                                `@[${matchByName.name}](${matchByName.id})`,
                            );
                        } else {
                            // Fallback: Try kebab-case version of display name
                            const kebabId = displayName.toLowerCase().replace(
                                /\s+/g,
                                "-",
                            );
                            const possibleIngredient = ingredientIdMap.get(
                                kebabId,
                            );

                            if (possibleIngredient) {
                                // Replace with correct name and ID
                                text = text.replace(
                                    fullMatch,
                                    `@[${possibleIngredient.name}](${possibleIngredient.id})`,
                                );
                            }
                            // If we can't find a match, leave it as is - the AI already formatted it
                        }
                    } else {
                        // ID exists but check if display name matches
                        const ingredient = ingredientIdMap.get(id);
                        if (ingredient && ingredient.name !== displayName) {
                            // Fix display name to match the ingredient name
                            text = text.replace(
                                fullMatch,
                                `@[${ingredient.name}](${id})`,
                            );
                        }
                    }
                });
            } else {
                // No mentions found in this step, which might be okay for some steps
                // e.g., "Preheat the oven to 350°F" or "Let cool for 10 minutes"
                // Log with our environment-aware logger
                logger.log(`No ingredient mentions found in step: "${text}"`);
            }

            return {
                ...step,
                text,
            };
        });

        return {
            ...section,
            steps: validatedSteps,
        };
    });
}

// Define Zod schemas
export const TimingSchema = z.object({
    min: z.number(),
    max: z.number(),
    units: z.literal("minutes"),
}).nullable();

export const StepSchema = z.object({
    text: z.string(),
    timing: TimingSchema,
});

export const InstructionSectionSchema = z.object({
    id: z.string(),
    section_title: z.string(),
    steps: z.array(StepSchema),
});

export const IngredientSchema = z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    notes: z.string().nullable(),
});

export const TimeEstimateSchema = z.object({
    prep: z.number(),
    cook: z.number(),
    rest: z.number(),
    total: z.number(),
});

export const RecipeSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    servings: z.number(),
    images: z.array(z.string()),
    ingredients: z.array(IngredientSchema),
    instructions: z.array(InstructionSectionSchema),
    notes: z.array(z.string()),
    tags: z.array(z.string()),
    time_estimate: TimeEstimateSchema,
});
