import { createClient } from "@supabase/supabase-js";
import config from "../config";
import type { Database } from "../types/database";

if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(
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
