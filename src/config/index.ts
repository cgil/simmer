interface Config {
    supabase: {
        url: string;
        anonKey: string;
    };
    app: {
        publicUrl: string;
        authRedirectUrl: string;
        loginBackgroundImageUrl?: string;
        signupBackgroundImageUrl?: string;
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

const DEFAULT_LOCAL_APP_URL = "http://localhost:5173";

const normalizeOrigin = (value?: string) => {
    const trimmed = value?.trim();
    if (!trimmed) {
        return undefined;
    }

    return trimmed.replace(/\/+$/, "");
};

const getOptionalConfigValue = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
};

const getBrowserOrigin = () => {
    if (typeof window !== "undefined" && window.location.origin) {
        return window.location.origin;
    }

    return DEFAULT_LOCAL_APP_URL;
};

const getPublicAppUrl = () =>
    normalizeOrigin(import.meta.env.VITE_PUBLIC_APP_URL) || getBrowserOrigin();

const getAuthRedirectUrl = () => {
    const explicitRedirectUrl = normalizeOrigin(
        import.meta.env.VITE_AUTH_REDIRECT_URL,
    );

    if (explicitRedirectUrl) {
        return explicitRedirectUrl;
    }

    return `${getPublicAppUrl()}/auth/callback`;
};

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
    app: {
        publicUrl: getPublicAppUrl(),
        authRedirectUrl: getAuthRedirectUrl(),
        loginBackgroundImageUrl: getOptionalConfigValue(
            import.meta.env.VITE_LOGIN_BACKGROUND_IMAGE_URL,
        ),
        signupBackgroundImageUrl: getOptionalConfigValue(
            import.meta.env.VITE_SIGNUP_BACKGROUND_IMAGE_URL,
        ),
    },
    openai: {
        // Use a more cost-effective model in development
        model: getEnvironment() === "production" ? "gpt-5.4-mini" : "gpt-5.4-mini",
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
