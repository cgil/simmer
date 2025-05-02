import { supabase } from "./supabase";
import { Recipe, RecipeIdea } from "../types";
import logger from "../utils/logger"; // Assuming you have a logger utility

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

export const createRecipeFromIdea = async (
    recipeIdea: RecipeIdea,
    originalPrompt: string,
): Promise<Recipe> => {
    // --- Logging Start ---
    let session = null;
    let token = null;
    try {
        const { data: sessionData, error: sessionError } = await supabase.auth
            .getSession();
        if (sessionError) {
            logger.error(
                "Error getting session in createRecipeFromIdea:",
                sessionError,
            );
        } else {
            session = sessionData?.session;
            token = session?.access_token;
            logger.log(
                "Session obtained in createRecipeFromIdea:",
                session ? `User ID: ${session.user.id}` : "No session",
            );
            logger.log(
                "Access Token present:",
                token ? `Length: ${token.length}` : "No token",
            ); // Log presence/length, not the token itself
        }
    } catch (e) {
        logger.error("Exception getting session in createRecipeFromIdea:", e);
    }
    // --- Logging End ---

    const { data, error } = await supabase.functions.invoke(
        "recipe-creation",
        {
            // Important: If you manually set headers here, DO NOT set Authorization
            // Let supabase-js handle adding the Authorization header automatically
            body: {
                recipeIdea,
                originalPrompt,
            },
        },
    );

    if (error) {
        // Log the specific error received from the function invoke
        logger.error(
            "Supabase function invoke error (recipe-creation):",
            error,
        );
        throw new Error(`Recipe creation failed: ${error.message}`);
    }

    // Log the response data (or lack thereof)
    logger.log(
        "Recipe creation function response data:",
        data ? "Data received" : "No data received",
    );

    if (!data) {
        throw new Error(
            "Recipe creation failed: No data returned from function.",
        );
    }

    return data as Recipe; // Add 'as Recipe' for stronger typing if needed
};

export const generateRecipeImage = async (
    title: string,
    description: string,
): Promise<string | null> => {
    const { data, error } = await supabase.functions.invoke(
        "generate-recipe-image",
        {
            body: {
                title,
                description,
            },
        },
    );

    if (error) {
        // Log the error but don't throw, as we want the recipe save to proceed
        console.error("Image generation failed:", error);
        return null;
    }

    // The function returns { imageDataUri: "data:image/..." } or { imageDataUri: null }
    return data?.imageDataUri || null;
};
