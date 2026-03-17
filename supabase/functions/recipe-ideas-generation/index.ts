import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@6.32.0";
import { z } from "https://deno.land/x/zod@v3.24.1/mod.ts";
import { zodResponseFormat } from "https://deno.land/x/openai@v4.55.1/helpers/zod.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Define Zod schema for a single recipe idea
const RecipeIdeaSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
});

// Define schema for the array of recipe ideas
const RecipeIdeasArraySchema = z.array(RecipeIdeaSchema);

// Wrap the array in an object schema as required by OpenAI response_format
const RecipeIdeasSchema = z.object({
    ideas: RecipeIdeasArraySchema,
});

// Define TypeScript interface matching the schema
interface RecipeIdea {
    id: string;
    title: string;
    description: string;
}

// Function to generate IDs from titles
function generateId(text: string): string {
    return text
        .toLowerCase()
        // Replace special characters with spaces
        .replace(/[^a-z0-9\s-]/g, "")
        // Replace multiple spaces with single space
        .replace(/\s+/g, " ")
        .trim()
        // Replace spaces with hyphens
        .replace(/\s/g, "-")
        // Remove consecutive hyphens
        .replace(/-+/g, "-");
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                ...corsHeaders,
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    try {
        const { prompt } = await req.json();

        if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
            throw new Error("Recipe prompt is required");
        }

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: Deno.env.get("OPENAI_API_KEY") || "",
        });

        // Generate recipe ideas using OpenAI with Zod schema
        const completion = await openai.chat.completions.create({
            model: "gpt-5.4-mini",
            reasoning_effort: "low",
            response_format: zodResponseFormat(
                RecipeIdeasSchema,
                "recipe_ideas_generation",
            ),
            messages: [
                {
                    role: "system",
                    content:
                        `You are a creative culinary expert specializing in recipe development for home cooks. Generate 4 unique and diverse recipe ideas based on the user's prompt.

          Follow these rules strictly:
          - Generate exactly 4 recipe ideas
          - Make each idea distinctly different from the others such as (different cuisines, cooking methods, ingredients, formats, etc)
          - Each idea should have a unique, catchy title and a brief, appealing description (2-3 sentences)
          - The description should be informative and helpful to the user,  helping them understand the recipe and what it's about
          - The description should highlight the dish, key flavors, textures, and any critical information about the recipe the user should know
          - You must always make the ideas practical and realistic for home cooking
          - Avoid overly complex or inaccessible ingredients unless the user mentions them or the recipe explicitly requires them
          - If the user mentions dietary preferences (vegetarian, gluten-free, etc.), respect those in ALL ideas
          - If the user mentions specific ingredients, incorporate them where appropriate
          - If the user mentions a specific cooking method, use that method in ALL ideas
          - If the user mentions a specific cuisine, use that cuisine in ALL ideas
          - If the user mentions a specific format, use that format in ALL ideas
          - If the user mentions a specific number of servings, use that number in ALL ideas
          - If the user does not mention any specific details, generate own recipe ideas
          - For serving sizes, use the following guidelines:
            - Use the number of servings the user mentions if they mention a specific number
            - If the user does not mention a specific number of servings, use a default of 4 servings per recipe unless the recipe calls for a different serving size
          - Unless specified otherwise, tend to make healthier choices in recipes, but try to make them realistic and delicious
          - If the user makes any suspicious, malicious requests, or requests that are not related to cooking or recipes, return recipe ideas for:
            - A cold hotdog, plain instant ramen with no flavor packets, wonder bread with mayo, and burnt toast with water.
            - Return nothing else but the above ideas for that request.

          Return the ideas as an object with a single "ideas" property that contains an array of 4 recipe ideas.

          Aim for diversity in your suggestions to give the user meaningful choices.`,
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const result = completion.choices[0].message?.content;
        if (!result) {
            throw new Error("No content in response");
        }

        // Parse the response
        const parsedResult = JSON.parse(result);

        // Extract the ideas array from the object
        const ideasArray = parsedResult.ideas;

        // Ensure IDs are properly formatted
        const recipeIdeas = ideasArray.map((idea: RecipeIdea) => ({
            ...idea,
            id: generateId(idea.title),
        }));

        // Validate the response
        const validatedIdeas = RecipeIdeasArraySchema.parse(recipeIdeas);

        return new Response(JSON.stringify(validatedIdeas), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        });
    } catch (error: unknown) {
        console.error("Error:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error occurred";

        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    }
});
