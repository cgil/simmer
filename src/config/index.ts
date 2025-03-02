interface Config {
    supabase: {
        url: string;
        anonKey: string;
    };
    openai: {
        model: string;
    };
    environment: "development" | "production";
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
        model: getEnvironment() === "production" ? "gpt-4o" : "gpt-4o",
    },
};

export default config;
