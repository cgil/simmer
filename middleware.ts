import { createClient } from "@supabase/supabase-js";
import type { Database } from "./src/types/database";

// Define crawler user agents regex
const CRAWLER_USER_AGENTS_REGEX =
    /facebookexternalhit|Twitterbot|LinkedInBot|Pinterest|Slackbot|WhatsApp|Discordbot|googlebot|bingbot|Applebot|TelegramBot|iMessage/i;

// Get Supabase URL and Key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Simple check for required env vars
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        "Supabase URL or Anon Key missing in middleware environment. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel.",
    );
}

// Initialize Supabase client conditionally
const supabase = supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;

// Helper to escape HTML entities in content
function escapeHtml(unsafe: string | null | undefined): string {
    if (unsafe === null || typeof unsafe === "undefined") return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export default async function middleware(request: Request) {
    // Get request URL and user agent
    const url = new URL(request.url);
    const { pathname } = url;
    const userAgent = request.headers.get("user-agent") || "";

    // Check if it's a recipe path and a crawler request
    // Only match specific recipe detail paths like /recipe/uuid or /recipe/uuid/cook
    // This regex ensures we only proceed for actual recipe detail pages with UUIDs
    const recipeIdRegex =
        /^\/recipe\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\/cook)?$/i;
    const recipeMatch = pathname.match(recipeIdRegex);
    const isCrawler = CRAWLER_USER_AGENTS_REGEX.test(userAgent);

    // Only proceed if it's a valid recipe detail/cook page, a crawler, and supabase is initialized
    if (recipeMatch && isCrawler && supabase) {
        const recipeId = recipeMatch[1]; // UUID from the regex match
        const isCookMode = recipeMatch[2] !== undefined; // If /cook path segment exists

        try {
            // Fetch recipe data from Supabase
            const { data: recipe, error } = await supabase
                .from("recipes")
                .select(`
          id,
          title,
          description,
          recipe_images (
            url,
            position
          )
        `)
                .eq("id", recipeId)
                .order("position", {
                    foreignTable: "recipe_images",
                    ascending: true,
                })
                .limit(1, { foreignTable: "recipe_images" })
                .single();

            if (error || !recipe) {
                console.error(
                    `Middleware: Recipe fetch error for ID ${recipeId}:`,
                    error?.message || "Recipe not found",
                );
                // Let it fall through to normal rendering if data fetch fails
                return Response.redirect(request.url);
            }

            // Determine the first image URL or use a fallback
            const imageUrl = recipe.recipe_images &&
                    Array.isArray(recipe.recipe_images) &&
                    recipe.recipe_images.length > 0 &&
                    recipe.recipe_images[0]?.url
                ? recipe.recipe_images[0].url
                : "/og-image.jpg";

            // Get the absolute URL for the image (if it's relative)
            const absoluteImageUrl = imageUrl.startsWith("http")
                ? imageUrl
                : `${url.protocol}//${url.host}${imageUrl}`;

            // Generate minimal HTML with OG tags
            const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(recipe.title)}${
                isCookMode ? " - Cooking Mode" : ""
            }</title>
    <meta name="description" content="${
                escapeHtml(
                    recipe.description || `${
                        isCookMode
                            ? "Cooking mode for"
                            : "View"
                    } this recipe on Simmer`,
                )
            }" />
    <meta property="og:title" content="${escapeHtml(recipe.title)}${
                isCookMode ? " - Cooking Mode" : ""
            }" />
    <meta property="og:description" content="${
                escapeHtml(
                    recipe.description || `${
                        isCookMode
                            ? "Cooking mode for"
                            : "View"
                    } this recipe on Simmer`,
                )
            }" />
    <meta property="og:image" content="${escapeHtml(absoluteImageUrl)}" />
    <meta property="og:url" content="${request.url}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(recipe.title)}">
    <meta name="twitter:description" content="${
                escapeHtml(recipe.description || "View this recipe on Simmer")
            }">
    <meta name="twitter:image" content="${escapeHtml(absoluteImageUrl)}">
  </head>
  <body>
    <h1>${escapeHtml(recipe.title)}</h1>
    <p>${escapeHtml(recipe.description || "")}</p>
    <img src="${escapeHtml(absoluteImageUrl)}" alt="Recipe Image" />
  </body>
</html>
      `;

            // Return the custom HTML response
            return new Response(html, {
                status: 200,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control":
                        "public, s-maxage=600, stale-while-revalidate=1200", // Cache for 10 mins, allow stale for 20 mins
                },
            });
        } catch (err: unknown) {
            console.error(
                `Middleware: Error processing recipe ${recipeId}:`,
                err instanceof Error ? err.message : "Unknown error",
            );
            // Fall through on unexpected errors
            return Response.redirect(request.url);
        }
    }

    // Pass through all other requests
    return Response.redirect(request.url);
}

// Configuration - Apply to both recipe detail and cooking mode paths
export const config = {
    matcher: ["/recipe/:id", "/recipe/:id/cook"],
};
