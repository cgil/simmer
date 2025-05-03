interface Config {
    supabase: {
        url: string;
        anonKey: string;
    };
    openai: {
        model: string;
    };
    environment: "development" | "production";
    posthog?: {
        key?: string;
        host?: string;
    };
}

const getEnvironment = () => {
    // Check if we're in a production environment (Vercel sets this)
    if (import.meta.env.PROD) {
        return "production";
    }
    return "development";
};

const config: Config = {
    environment: getEnvironment(),
    supabase: {
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    openai: {
        // Use a more cost-effective model in development
        model: getEnvironment() === "production" ? "o4-mini" : "o4-mini",
    },
    posthog: {
        key: import.meta.env.VITE_POSTHOG_KEY,
        host: import.meta.env.VITE_POSTHOG_HOST,
    },
};

// Add warnings for missing PostHog config in production
if (config.environment === "production") {
    if (!config.posthog?.key) {
        console.warn(
            "Warning: VITE_POSTHOG_KEY is not defined. PostHog analytics will be disabled.",
        );
    }
    if (!config.posthog?.host) {
        console.warn(
            "Warning: VITE_POSTHOG_HOST is not defined. PostHog analytics will be disabled.",
        );
    }
}

export default config;
