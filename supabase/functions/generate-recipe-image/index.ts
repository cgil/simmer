import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { generateGhibliRecipeImage } from "../_shared/image-generation.ts";

// Simple environment-aware logger
const isProduction = Deno.env.get("ENVIRONMENT") === "production";
const logger = {
    log: (...args: unknown[]) => {
        if (!isProduction) {
            console.log("[Info][generate-recipe-image]", ...args);
        }
    },
    warn: (...args: unknown[]) => {
        if (!isProduction) {
            console.warn("[Warn][generate-recipe-image]", ...args);
        }
    },
    error: (...args: unknown[]) => {
        // Always log errors
        console.error("[Error][generate-recipe-image]", ...args);
    },
};

logger.log("Generate Recipe Image function initializing.");

serve(async (req) => {
    logger.log("Function received a request.");

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        logger.log("Handling OPTIONS preflight request.");
        return new Response(null, {
            status: 204,
            headers: {
                ...corsHeaders,
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    try {
        const { title, description } = await req.json();
        logger.log(`Processing request for image generation: Title - ${title}`);

        if (!title) {
            logger.warn("Request received without a title.");
            throw new Error("Recipe title is required to generate an image");
        }

        // Call the shared image generation utility
        // Pass a generic context or null since there's no original prompt here
        const imageDataUri = await generateGhibliRecipeImage(
            title,
            description || null,
        );

        if (imageDataUri) {
            logger.log("Image generated successfully via shared utility.");
        } else {
            logger.warn("Shared image utility returned null.");
        }

        logger.log("Returning response.");
        // Return the result (could be null if generation failed)
        return new Response(JSON.stringify({ imageDataUri }), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        });
    } catch (error: unknown) {
        logger.error("Uncaught error in main handler:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error occurred";

        // Determine appropriate status code
        let statusCode = 500;
        if (errorMessage === "Recipe title is required to generate an image") {
            statusCode = 400; // Bad Request
        } else if (
            typeof error === "object" && error !== null && "status" in error &&
            typeof error.status === "number"
        ) {
            statusCode = error.status;
        }

        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                status: statusCode,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    }
});
