export interface Recipe {
    id?: string;
    title: string;
    description: string;
    images: string[];
    servings: number;
    ingredients: Ingredient[];
    instructions: InstructionSection[];
    notes: string[];
    tags: string[];
    time_estimate?: TimeEstimate;
}

export interface Ingredient {
    id: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    notes?: string | null;
}

export interface InstructionSection {
    section_title: string;
    steps: string[];
}

export interface TimeEstimate {
    prep: number;
    cook: number;
    total: number;
}
