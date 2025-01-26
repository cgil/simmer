export interface Recipe {
    id: string;
    title: string;
    description: string;
    images: string[];
    servings: number;
    ingredients: IngredientSection[];
    instructions: InstructionSection[];
    notes: string[];
    tags: string[];
    time_estimate?: TimeEstimate;
}

export interface IngredientSection {
    section_title: string;
    items: Ingredient[];
}

export interface Ingredient {
    name: string;
    quantity: number | null;
    unit: string | null;
    notes?: string;
}

export interface InstructionSection {
    section_title: string;
    steps: string[];
}

export interface TimeEstimate {
    prep: number; // minutes
    cook: number; // minutes
    total: number; // minutes
}
