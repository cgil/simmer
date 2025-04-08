import { supabase } from "./supabase";
import { Recipe, RecipeIdea } from "../types";

export const extractRecipe = async (url: string): Promise<Recipe> => {
    const { data, error } = await supabase.functions.invoke(
        "recipe-extraction",
        {
            body: { url },
        },
    );

    if (error) {
        throw new Error(`Recipe extraction failed: ${error.message}`);
    }

    return data;
};

export const generateRecipeIdeas = async (
    prompt: string,
): Promise<RecipeIdea[]> => {
    const { data, error } = await supabase.functions.invoke(
        "recipe-ideas-generation",
        {
            body: { prompt },
        },
    );

    if (error) {
        throw new Error(`Recipe ideas generation failed: ${error.message}`);
    }

    return data;
};
