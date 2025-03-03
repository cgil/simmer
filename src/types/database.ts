export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            recipes: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    servings: number;
                    tags: string[];
                    notes: string[];
                    prep_time: number | null;
                    cook_time: number | null;
                    rest_time: number | null;
                    total_time: number | null;
                    user_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<
                    Database["public"]["Tables"]["recipes"]["Row"],
                    "id" | "created_at" | "updated_at"
                >;
                Update: Partial<
                    Database["public"]["Tables"]["recipes"]["Insert"]
                >;
            };
            recipe_images: {
                Row: {
                    id: string;
                    recipe_id: string;
                    url: string;
                    position: number;
                    created_at: string;
                };
                Insert: Omit<
                    Database["public"]["Tables"]["recipe_images"]["Row"],
                    "id" | "created_at"
                >;
                Update: Partial<
                    Database["public"]["Tables"]["recipe_images"]["Insert"]
                >;
            };
            recipe_ingredients: {
                Row: {
                    id: string;
                    recipe_id: string;
                    name: string;
                    quantity: number | null;
                    unit: string | null;
                    notes: string | null;
                    position: number;
                };
                Insert: Omit<
                    Database["public"]["Tables"]["recipe_ingredients"]["Row"],
                    "id"
                >;
                Update: Partial<
                    Database["public"]["Tables"]["recipe_ingredients"]["Insert"]
                >;
            };
            recipe_instruction_sections: {
                Row: {
                    id: string;
                    recipe_id: string;
                    section_title: string;
                    position: number;
                };
                Insert: Omit<
                    Database["public"]["Tables"]["recipe_instruction_sections"][
                        "Row"
                    ],
                    "id"
                >;
                Update: Partial<
                    Database["public"]["Tables"]["recipe_instruction_sections"][
                        "Insert"
                    ]
                >;
            };
            recipe_instruction_steps: {
                Row: {
                    id: string;
                    section_id: string;
                    text: string;
                    timing_min: number | null;
                    timing_max: number | null;
                    timing_units: "seconds" | "minutes" | "hours" | null;
                    position: number;
                };
                Insert: Omit<
                    Database["public"]["Tables"]["recipe_instruction_steps"][
                        "Row"
                    ],
                    "id"
                >;
                Update: Partial<
                    Database["public"]["Tables"]["recipe_instruction_steps"][
                        "Insert"
                    ]
                >;
            };
        };
    };
}
