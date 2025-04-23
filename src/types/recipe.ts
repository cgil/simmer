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
    user_id?: string;
    is_public?: boolean;
    is_shared?: boolean;
    shared_with_me?: boolean;
    access_level?: "viewer" | "editor" | "owner";
}

export interface RecipeIdea {
    id: string;
    title: string;
    description: string;
}

export interface Ingredient {
    id: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    notes?: string | null;
}

interface StepTiming {
    min: number;
    max: number;
    units: string;
}

interface Step {
    text: string;
    timing: StepTiming | null;
}

export interface InstructionSection {
    section_title: string;
    steps: Step[];
}

export interface TimeEstimate {
    prep: number;
    cook: number;
    rest: number;
    total: number;
}
