# Setting Up Google Authentication for Simmer

This guide will walk you through setting up Google Authentication for your Simmer app with Supabase.

## Step 1: Create OAuth Credentials in Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. Select "Web application" as the application type
6. Give it a name like "Simmer App"
7. Add authorized JavaScript origins:
    - For local development: `http://localhost:5173` (Vite's default)
    - For production: Your actual domain (if applicable)
8. Add authorized redirect URIs:
    - For local development: `http://127.0.0.1:54321/auth/v1/callback`
    - For production: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
9. Click "Create" and note down your **Client ID** and **Client Secret**

## Step 2: Configure Google Provider in Supabase

### For Local Development:

1. Add the Google OAuth credentials to your `.env.local` file:

```
# Google OAuth
SUPABASE_AUTH_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_GOOGLE_SECRET=your_google_client_secret
```

2. Restart your local Supabase instance:

```bash
supabase stop
supabase start
```

### For Supabase Cloud:

1. Go to your [Supabase Dashboard](https://app.supabase.io/)
2. Select your project
3. Navigate to "Authentication" > "Providers"
4. Find the Google provider and click "Edit"
5. Enable the provider by toggling the switch
6. Enter your Google Client ID and Client Secret
7. Set the Redirect URL (should be prefilled correctly)
8. Save your changes

## Step 3: Update Your Frontend Code (if needed)

Your frontend code in `AuthContext.tsx` already has the necessary implementation for Google authentication:

```typescript
const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        },
    });
};
```

## Step 4: Verify Setup

1. Make sure your local Supabase instance is running
2. Try signing in with Google in your app
3. You should be redirected to Google's login page
4. After signing in, you should be redirected back to your app

## Troubleshooting

-   If you see the error "Unsupported provider: provider is not enabled", make sure:
    -   Google provider is enabled in Supabase
    -   Client ID and Secret are correctly set in your environment
    -   Local Supabase instance was restarted after configuration changes
-   For other issues, check the Supabase logs:
    ```bash
    supabase logs
    ```
