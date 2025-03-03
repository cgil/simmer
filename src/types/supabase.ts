// Define your database schema types here
export type Database = {
    public: {
        Tables: {
            recipes: {
                Row: {
                    id: string;
                    title: string;
                    // Add other fields as needed
                };
                // Add Insert and Update types if needed
            };
            recipe_ingredients: {
                Row: {
                    id: string;
                    recipe_id: string;
                    // Add other fields as needed
                };
                // Add Insert and Update types if needed
            };
            recipe_instruction_sections: {
                Row: {
                    id: string;
                    recipe_id: string;
                    // Add other fields as needed
                };
                // Add Insert and Update types if needed
            };
            recipe_instruction_steps: {
                Row: {
                    id: string;
                    section_id: string;
                    // Add other fields as needed
                };
                // Add Insert and Update types if needed
            };
            recipe_images: {
                Row: {
                    id: string;
                    recipe_id: string;
                    // Add other fields as needed
                };
                // Add Insert and Update types if needed
            };
        };
        Enums: Record<string, unknown>;
    };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
    Database["public"]["Enums"][T];

// Export type aliases for common tables
export type Recipe = Tables<"recipes">;
export type RecipeIngredient = Tables<"recipe_ingredients">;
export type RecipeInstructionSection = Tables<"recipe_instruction_sections">;
export type RecipeInstructionStep = Tables<"recipe_instruction_steps">;
export type RecipeImage = Tables<"recipe_images">;
