import { createClient } from "@supabase/supabase-js";
import type { Database } from "./src/types/database";

// Define crawler user agents regex
const CRAWLER_USER_AGENTS_REGEX =
    /facebookexternalhit|Twitterbot|LinkedInBot|Pinterest|Slackbot|WhatsApp|Discordbot|googlebot|bingbot|Applebot|TelegramBot|iMessage/i;

// Default OG content for non-recipe pages
const DEFAULT_OG_CONTENT = {
    title: "Simmer | Your AI Recipe Journal",
    description:
        "Your AI-powered recipe journal for collecting, organizing, and sharing your favorite recipes.",
    imageUrl: "/og-image.jpg",
};

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

// Helper to generate HTML with OG tags
function generateHtml(
    url: URL,
    title: string,
    description: string,
    imageUrl: string,
    bodyContent?: string,
): string {
    // Convert relative image URL to absolute if needed
    const absoluteImageUrl = imageUrl.startsWith("http")
        ? imageUrl
        : `${url.protocol}//${url.host}${imageUrl}`;

    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(absoluteImageUrl)}" />
    <meta property="og:url" content="${url.toString()}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(absoluteImageUrl)}">
  </head>
  <body>
    ${
        bodyContent || `
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    <img src="${escapeHtml(absoluteImageUrl)}" alt="Image" />
    `
    }
  </body>
</html>
    `;
}

export default async function middleware(request: Request) {
    // Get request URL and user agent
    const url = new URL(request.url);
    const { pathname } = url;
    const userAgent = request.headers.get("user-agent") || "";

    // Check if it's a crawler request
    const isCrawler = CRAWLER_USER_AGENTS_REGEX.test(userAgent);

    // If not a crawler, pass through to the origin server
    if (!isCrawler) {
        // Let the request continue to the React app
        return undefined;
    }

    // Check if it's a valid recipe detail path with UUID
    const recipeIdRegex =
        /^\/recipe\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\/cook)?$/i;
    const recipeMatch = pathname.match(recipeIdRegex);

    // If it's a crawler but not a valid recipe page, return default OG content
    if (!recipeMatch) {
        // Generate HTML with default OG content
        const html = generateHtml(
            url,
            DEFAULT_OG_CONTENT.title,
            DEFAULT_OG_CONTENT.description,
            DEFAULT_OG_CONTENT.imageUrl,
        );

        return new Response(html, {
            status: 200,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control":
                    "public, s-maxage=86400, stale-while-revalidate=172800", // Cache for 24 hours
            },
        });
    }

    // At this point we have a crawler requesting a valid recipe page
    // Only proceed with Supabase query if client is initialized
    if (supabase) {
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
                // Fall back to default OG content if recipe fetch fails
                const html = generateHtml(
                    url,
                    DEFAULT_OG_CONTENT.title,
                    DEFAULT_OG_CONTENT.description,
                    DEFAULT_OG_CONTENT.imageUrl,
                );

                return new Response(html, {
                    status: 200,
                    headers: {
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control":
                            "public, s-maxage=3600, stale-while-revalidate=7200", // Cache for 1 hour
                    },
                });
            }

            // Determine the first image URL or use a fallback
            const imageUrl = recipe.recipe_images &&
                    Array.isArray(recipe.recipe_images) &&
                    recipe.recipe_images.length > 0 &&
                    recipe.recipe_images[0]?.url
                ? recipe.recipe_images[0].url
                : DEFAULT_OG_CONTENT.imageUrl;

            // Generate recipe title with cooking mode suffix if applicable
            const recipeTitle = `${recipe.title}${
                isCookMode ? " - Cooking Mode" : ""
            }`;

            // Generate recipe description or use a default with context
            const recipeDescription = recipe.description ||
                `${
                    isCookMode
                        ? "Cooking mode for"
                        : "View"
                } this recipe on Simmer`;

            // Generate HTML with recipe-specific OG content
            const html = generateHtml(
                url,
                recipeTitle,
                recipeDescription,
                imageUrl,
                `
                <h1>${escapeHtml(recipeTitle)}</h1>
                <p>${escapeHtml(recipeDescription)}</p>
                <img src="${escapeHtml(imageUrl)}" alt="Recipe Image" />
                `,
            );

            return new Response(html, {
                status: 200,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control":
                        "public, s-maxage=600, stale-while-revalidate=1200", // Cache for 10 mins
                },
            });
        } catch (err: unknown) {
            console.error(
                `Middleware: Error processing recipe ${recipeId}:`,
                err instanceof Error ? err.message : "Unknown error",
            );
            // Fall back to default OG content on error
            const html = generateHtml(
                url,
                DEFAULT_OG_CONTENT.title,
                DEFAULT_OG_CONTENT.description,
                DEFAULT_OG_CONTENT.imageUrl,
            );

            return new Response(html, {
                status: 200,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control":
                        "public, s-maxage=300, stale-while-revalidate=600", // Cache for 5 mins on error
                },
            });
        }
    }

    // If Supabase client isn't initialized, fallback to default OG content
    const html = generateHtml(
        url,
        DEFAULT_OG_CONTENT.title,
        DEFAULT_OG_CONTENT.description,
        DEFAULT_OG_CONTENT.imageUrl,
    );

    return new Response(html, {
        status: 200,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600", // Cache for 5 mins
        },
    });
}

// Configuration - Apply to all recipe paths
export const config = {
    matcher: ["/recipe/:path*"],
};
