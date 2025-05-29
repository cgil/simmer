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
 * Generates a recipe image using OpenAI
 * Uses a prompt optimized for our app's food art style.
 * @param title The title of the recipe.
 * @param description The description of the recipe.
 * @param detailContext Optional additional context (e.g., original user prompt, recipe idea) to refine the image.
 * @returns A Promise resolving to the base64 data URI (image/jpeg) or null if generation fails.
 */
export const generateStyledRecipeImage = async (
    title: string,
    description?: string | null,
    detailContext?: string | null,
): Promise<string | null> => {
    logger.log(`Starting image generation for: ${title}`);

    if (!title) {
        logger.error("Title is required for image generation.");
        return null;
    }

    const surfacePlacementOptions = [
        "a sun‑bleached reclaimed‑wood surface with a casually draped neutral‑linen napkin",
        "a smooth large white‑marble slab accented by a softly rumpled oatmeal‑linen runner",
        "a matte charcoal‑slate serving board atop a light birch butcher‑block with a loosely folded flax‑gauze cloth",
        "a sand‑toned rattan charger atop a bleached oak table, accented by a gauzy ecru runner",
        "a smooth largedove‑gray quartz slab with delicate veining, keeping the scene textile‑free for a clean editorial look",
        "a large lightly charred cedar plank set over a snow‑white parchment sheet, adding a hint of rustic warmth",
        "a large blush‑toned matte ceramic tile framed by a loosely knotted natural‑linen ribbon",
        "a large butter‑smooth ash wood cutting board bordered by a minimalist ivory parchment strip",
    ];

    // Pick a random surface placement
    const randomIndex = Math.floor(
        Math.random() * surfacePlacementOptions.length,
    );
    const selectedSurfacePlacement = surfacePlacementOptions[randomIndex];

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
                `A delicious looking image of the final dish for a recipe titled '${title}'.${descriptionString}${contextString}

                Style: Soft north‑light window setup with bright white bounce fill, hyper‑realistic hero dish centered on ${selectedSurfacePlacement}, meticulously plated with garnishes arranged for visual flow, complementary ingredient from the recipe vignettes displayed in small bowls, plates, bundles, loose clusters, folded linen or other small relevant props just behind and to the sides to frame the scene, shallow depth of field (≈ f/2.0) keeping the dish tack‑sharp while the ingredient props transition into a gentle creamy bokeh, balanced composition, luminous high‑key atmosphere, airy modern‑magazine clarity. No text, no watermarks, no logos.`,
            n: 1,
            size: "1024x1024",
            quality: "medium", // Consistent quality from recipe-creation
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
