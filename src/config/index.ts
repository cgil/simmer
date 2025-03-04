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

// Helper function to mask sensitive keys for logging
const maskKey = (key: string): string => {
    if (!key) return "undefined";
    if (key.length <= 8) return "***";
    return key.substring(0, 4) + "..." + key.substring(key.length - 4);
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log configuration details in production for debugging
if (getEnvironment() === "production") {
    console.log("[CONFIG] Environment:", getEnvironment());
    console.log("[CONFIG] Supabase URL length:", supabaseUrl?.length || 0);
    console.log("[CONFIG] Supabase URL:", supabaseUrl);
    console.log(
        "[CONFIG] Supabase Anon Key length:",
        supabaseAnonKey?.length || 0,
    );
    console.log(
        "[CONFIG] Supabase Anon Key (masked):",
        maskKey(supabaseAnonKey),
    );
}

const config: Config = {
    environment: getEnvironment(),
    supabase: {
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
    },
    openai: {
        // Use a more cost-effective model in development
        model: getEnvironment() === "production" ? "o3-mini" : "o3-mini",
    },
};

export default config;
