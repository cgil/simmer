/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_POSTHOG_KEY?: string;
    readonly VITE_POSTHOG_HOST?: string;
    readonly VITE_PUBLIC_APP_URL?: string;
    readonly VITE_AUTH_REDIRECT_URL?: string;
    readonly VITE_LOGIN_BACKGROUND_IMAGE_URL?: string;
    readonly VITE_SIGNUP_BACKGROUND_IMAGE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
