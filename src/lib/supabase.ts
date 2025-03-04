import { createClient } from "@supabase/supabase-js";
import config from "../config";
import type { Database } from "../types/database";

// Log Supabase initialization attempt in production
if (config.environment === "production") {
    console.log("[SUPABASE] Attempting to initialize Supabase client");
    console.log("[SUPABASE] Config URL exists:", !!config.supabase.url);
    console.log("[SUPABASE] Config anonKey exists:", !!config.supabase.anonKey);
}

if (!config.supabase.url || !config.supabase.anonKey) {
    const error = `Missing Supabase environment variables: ${
        !config.supabase.url ? "URL" : ""
    }${!config.supabase.url && !config.supabase.anonKey ? " and " : ""}${
        !config.supabase.anonKey ? "anonKey" : ""
    }`;
    console.error("[SUPABASE] Initialization Error:", error);
    throw new Error(error);
}

let supabaseClient;

try {
    supabaseClient = createClient<Database>(
        config.supabase.url,
        config.supabase.anonKey,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            },
            db: {
                schema: "public",
            },
        },
    );

    if (config.environment === "production") {
        console.log("[SUPABASE] Client initialized successfully");
    }
} catch (error) {
    console.error("[SUPABASE] Failed to initialize Supabase client:", error);
    throw error;
}

export const supabase = supabaseClient;
