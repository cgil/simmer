import AiChefFab from "./AiChefFab";
import AiChefDrawer from "./AiChefDrawer";
import AiChatComponent from "./AiChatComponent";
import SuggestionPills from "./SuggestionPills";
import ApplyChangesAnimation from "./ApplyChangesAnimation";

// Shared type for recipe changes, matching the Zod schemas from recipe-schemas.ts
export interface RecipeChanges {
    // Basic recipe information (all optional since these are changes)
    title?: string;
    description?: string;
    servings?: number;

    // Images URLs
    images?: string[];

    // Ingredients - keeping same structure as IngredientSchema
    ingredients?: Array<{
        id: string; // Required for modifications, generated for new ones
        name: string;
        quantity: number | null;
        unit: string | null;
        notes: string | null;
        position?: number; // Frontend-specific for ordering
    }>;

    // Instructions - matching InstructionSectionSchema
    instructions?: Array<{
        id: string; // Required for modifications, generated for new ones
        section_title: string;
        position?: number; // Frontend-specific for ordering
        steps: Array<{
            id?: string; // Optional for new steps
            text: string;
            position?: number; // Frontend-specific for ordering
            timing: { min: number; max: number; units: "minutes" } | null;
        }>;
    }>;

    // Time estimates - matching TimeEstimateSchema
    timeEstimate?: {
        prep: number;
        cook: number;
        rest: number;
        total: number;
    };

    // Additional metadata
    notes?: string[];
    tags?: string[];
}

export {
    AiChatComponent,
    AiChefDrawer,
    AiChefFab,
    ApplyChangesAnimation,
    SuggestionPills,
};
