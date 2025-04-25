export interface Substitute {
    id: string;
    name: string;
    quantity?: number | null;
    unit?: string | null;
}

export interface SubstituteOption {
    ingredients: Substitute[];
    instructions?: string | null;
}

export interface SubstitutionState {
    originalIngredientId: string;
    originalIngredient: {
        id: string;
        name: string;
        quantity?: number | null;
        unit?: string | null;
    };
    substituteOption: SubstituteOption;
}
