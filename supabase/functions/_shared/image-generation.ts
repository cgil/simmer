import { OpenAI } from "https://esm.sh/openai@4.103.0";

// Simple environment-aware logger for shared utility
const isProduction = Deno.env.get("ENVIRONMENT") === "production";
const logger = {
    log: (...args: unknown[]) => {
        if (!isProduction) {
            console.log("[Info][image-generation]", ...args);
        }
    },
    warn: (...args: unknown[]) => {
        if (!isProduction) {
            console.warn("[Warn][image-generation]", ...args);
        }
    },
    error: (...args: unknown[]) => {
        console.error("[Error][image-generation]", ...args);
    },
};

/**
 * Generates a recipe image using OpenAI DALL-E.
 * Uses a prompt optimized for Studio Ghibli food art style.
 * @param title The title of the recipe.
 * @param description The description of the recipe.
 * @param detailContext Optional additional context (e.g., original user prompt, recipe idea) to refine the image.
 * @returns A Promise resolving to the base64 data URI (image/jpeg) or null if generation fails.
 */
export const generateGhibliRecipeImage = async (
    title: string,
    description?: string | null,
    detailContext?: string | null,
): Promise<string | null> => {
    logger.log(`Starting image generation for: ${title}`);

    if (!title) {
        logger.error("Title is required for image generation.");
        return null;
    }

    try {
        const openai = new OpenAI({
            apiKey: Deno.env.get("OPENAI_API_KEY") || "",
        });

        const descriptionString = description
            ? ` Description: ${description}.`
            : "";

        const contextString = detailContext
            ? ` With the following original user prompt and recipe idea which led to the title and description: "${detailContext}".`
            : "";

        const imageGenParams = {
            model: "gpt-image-1", // Consistent model from recipe-creation
            prompt:
                `A delicious looking image of the final dish for a recipe titled '${title}'.${descriptionString}${contextString} Style: In the style of Studio Ghibli. Clearly show the ingredients and the final dish. No text, no watermarks, no logos.`,
            n: 1,
            size: "1024x1024",
            quality: "low", // Consistent quality from recipe-creation
            output_format: "jpeg",
        };

        logger.log(`Using image prompt: ${imageGenParams.prompt}`);

        const imageResponse = await openai.images.generate(imageGenParams);

        const base64Json = imageResponse.data[0]?.b64_json;

        if (base64Json) {
            logger.log("Image generation successful (b64_json found).");
            return `data:image/jpeg;base64,${base64Json}`;
        }

        if (!imageResponse.data || imageResponse.data.length === 0) {
            logger.warn(
                "Image generation finished but response.data array is empty.",
            );
        } else if (!imageResponse.data[0]?.b64_json) {
            logger.warn(
                "Image generation finished but b64_json property is missing in the first data item.",
            );
        }

        return null;
    } catch (error) {
        logger.error("Error during OpenAI image generation task:", error);
        return null; // Return null on error, don't throw
    }
};
