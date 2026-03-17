# Simmer - Your AI Recipe Manager

Simmer is a modern web application that offers a sleek, magazine-style experience for managing your digital recipes. It allows you to capture, organize, and cook from your favorite recipes with a beautiful, journal-like interface.

![Simmer home page showing the All Recipes view](docs/media/simmer-home-page-preview.jpg)

## Preview

Simmer is built to feel warm, visual, and easy to browse. Here are a few quick examples of what the app looks like in practice.

### Home Page

The home page gives you a searchable overview of all your recipes, with collections on the left and rich recipe cards front and center. It is designed to make it easy to scan photos, titles, tags, servings, and cook times at a glance.

### Recipe Editing Demo

This short walkthrough shows editing an existing recipe, using AI to generate a recipe image, and updating the cooking instructions with the rich editor.

[Watch the recipe editing demo](docs/media/recipe-editing-ai-image-rich-editor-demo.mp4)

### AI Chef Guided Editing

This demo shows the guided AI Chef experience, where you chat with the recipe in plain language, review suggested changes, and apply the updates directly into the recipe.

[Watch the AI Chef guided editing demo](docs/media/ai-chef-guided-recipe-editing-demo.mp4)

### AI Chef New Recipe Creation

This walkthrough shows creating a brand-new recipe from scratch with AI Chef, using the guided experience to shape the idea into a full recipe you can save and refine.

[Watch the AI Chef new recipe creation demo](docs/media/ai-chef-new-recipe-from-scratch-demo.mp4)

### Cooking Mode and Quick Adjustments

This demo shows how to quickly update a recipe's servings, apply those changes throughout the instructions, swap ingredients with substitutions, and then jump into the mobile-friendly cooking mode with step-by-step instructions, timers, and a screen-awake experience while you cook.

[Watch the cooking mode and quick adjustments demo](docs/media/servings-substitutions-and-cooking-mode-demo.mp4)

### Sharing and Collaboration

This demo shows how to share a recipe or a full collection with other people, keep recipes private for invited collaborators or make them public for anyone to discover, and assign viewer or editor access so people can collaborate in the way that fits best.

[Watch the sharing and collaboration demo](docs/media/sharing-and-collaboration-demo.mp4)

## Features

- 💄 Elegant, magazine-style interface for a premium culinary experience
- 🔍 AI-powered recipe extraction from URLs
- 🧠 AI-powered recipe ideas generation from text prompts
- 🍳 AI-powered ingredient substitution suggestions
- 💬 AI Chef assistant for conversational recipe improvement and editing
- 📱 Mobile-friendly cooking mode with interactive timers
- 🖼️ Beautiful image gallery management
- 📂 Collections to organize recipes with custom emoji icons
- 🔍 All Recipes view and collection-specific browsing
- ⚡ Real-time ingredient scaling
- 📋 Section-based cooking instructions
- ⏲️ Multi-timer tracking across recipe steps
- ⚖️ Flexible time handling (supports zero prep/cook times)
- 🎨 Whimsical loading states with recipe-themed progress indicators
- 🔖 @-mention style ingredient references in instructions
- 👤 User profile pictures from authentication providers (Google, GitHub, etc.)
- 📊 Product analytics via PostHog (production only)

## Local Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed globally
- Docker Desktop (required for Supabase local development)
- OpenAI API key
- [Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk/docs/install) installed and authenticated (for GCS CORS setup)

### Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/your-github-username/simmer.git
cd simmer
```

2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to create your environment files:

```bash
cp .env.example .env.local    # For local development
cp .env.example .env.production    # For production deployment
```

4. Configure your environment files:
    - `.env.local`: Used for local development with Supabase running locally.
    - `.env.production`: Used for production deployment with your Supabase cloud project.
    - **Public app configuration**: Set these values to match your own app and branding.
        ```env
        # Canonical frontend URL, without a trailing slash
        VITE_PUBLIC_APP_URL=https://your-app-domain.com
        # Optional override if your auth callback URL differs
        VITE_AUTH_REDIRECT_URL=https://your-app-domain.com/auth/callback
        # Optional branded auth backgrounds. Leave blank to use the built-in paper background.
        VITE_LOGIN_BACKGROUND_IMAGE_URL=https://your-cdn-or-bucket.example.com/login-background.png
        VITE_SIGNUP_BACKGROUND_IMAGE_URL=https://your-cdn-or-bucket.example.com/signup-background.png
        ```
    - **PostHog Variables (Optional for Local, Required for Production)**: Add your PostHog Project API Key and Host URL.
        ```env
        # PostHog Configuration (Optional - primarily for production)
        VITE_POSTHOG_KEY= # Your PostHog Project API Key (leave blank locally if desired)
        VITE_POSTHOG_HOST= # Your PostHog API Host (e.g., https://us.posthog.com)
        ```
    - **Critical GCS Variables**: You will need to obtain a Google Cloud Service Account JSON key file with appropriate permissions (`Storage Object Creator`, `Storage Object Viewer`) for your GCS bucket. Add the following variables derived from the key file to **both** `.env.local` and `.env.production` (or configure them directly in your deployment environments):
        ```env
        # Google Cloud Storage Configuration
        GCS_BUCKET_NAME=your-gcs-bucket-name
        GCS_PROJECT_ID=your-gcp-project-id
        GCS_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
        # Ensure the private key is handled securely, especially in .env.production
        # Paste the full private key from your service account JSON and escape newlines as \n
        GCS_PRIVATE_KEY=replace_with_your_service_account_private_key_and_escape_newlines
        ```
    - **Security Note**: Do NOT commit your service account key file or the `.env.production` file containing the private key directly to your Git repository. Use environment variable management provided by your hosting platforms (Supabase Functions Secrets, Vercel Environment Variables) for production.
    - **Your own content**: If you want custom login and signup backgrounds, upload those images to your own public bucket/CDN and point `VITE_LOGIN_BACKGROUND_IMAGE_URL` and `VITE_SIGNUP_BACKGROUND_IMAGE_URL` at those files. If you leave them blank, the app still works and falls back to the paper-style background.

### Starting the Development Environment

1. Start the Supabase local development environment:

```bash
npm run supabase:start
```

2. Start both the Vite development server and Supabase functions:

```bash
npm run dev:all
```

The application will be available at:

- Frontend: `http://localhost:5173`
- Supabase Studio: `http://localhost:54323`
- Functions: `http://localhost:54321/functions/v1/*`

### Available Development Commands

#### Supabase Control

- `npm run supabase:start` - Start Supabase local development
- `npm run supabase:stop` - Stop Supabase local development
- `npm run supabase:status` - Check Supabase services status

#### Database Management

- `npm run db:reset` - Reset local database to clean state
- `npm run db:migration:new` - Create a new migration file

#### Function Development

- `npm run functions:serve` - Start functions development server
- `npm run functions:deploy` - Deploy functions (development)
- `npm run functions:deploy:prod` - Deploy functions (production)

#### Testing

- `npm run test:function` - Test recipe extraction with sample URL
- `npm run test:ideas` - Test recipe ideas generation with sample prompt
- `npm run test:creation` - Test recipe creation from an idea
- `npm run test:substitution` - Test ingredient substitution
- `npm run test:ai-chef-chat` - Test AI Chef chat with a simple recipe
- `npm run test:ai-chef-chat:detailed` - Test AI Chef chat with a more detailed recipe example

### Development Workflow

1. **Making Database Changes**

    ```bash
    # Create a new migration
    npm run db:migration:new your_migration_name

    # Apply migrations
    npm run db:reset
    ```

2. **Working with Functions**

    ```bash
    # Start functions server (auto-reloads on changes)
    # Development mode - JWT verification disabled
    npm run functions:serve

    # Test recipe extraction (requires authentication in production)
    npm run test:function

    # Deploy functions
    npm run functions:deploy:dev  # Development (JWT verification disabled)
    npm run functions:deploy:prod # Production (JWT verification enabled)
    ```

3. **Full Development Environment**
    ```bash
    # Start everything
    npm run supabase:start
    npm run dev:all
    ```

### Troubleshooting

1. **Supabase Issues**
    - Check service status: `npm run supabase:status`
    - Try stopping and restarting:
        ```bash
        npm run supabase:stop
        npm run supabase:start
        ```

2. **Function Development**
    - Functions logs are available in the terminal running `functions:serve`
    - Check Supabase Studio for function invocation logs

3. **Database Reset**
    - If schema gets corrupted: `npm run db:reset`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

### Environment Setup

We use two primary environment files locally:

1.  `.env.local` - Local development
2.  `.env.production` - Base for production deployment variables (DO NOT COMMIT SENSITIVE KEYS HERE)

For deployment, **critical environment variables must be set directly in your hosting providers**: Vercel for the frontend and Supabase for the Edge Functions.

**Required Environment Variables:**

- **Vercel (Frontend)**:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `VITE_PUBLIC_APP_URL`
    - `VITE_AUTH_REDIRECT_URL` (optional if it matches `VITE_PUBLIC_APP_URL/auth/callback`)
    - `VITE_LOGIN_BACKGROUND_IMAGE_URL` (optional)
    - `VITE_SIGNUP_BACKGROUND_IMAGE_URL` (optional)
    - `VITE_POSTHOG_KEY` (Your **production** PostHog Project API Key)
    - `VITE_POSTHOG_HOST` (Your **production** PostHog API Host URL)
    - Frontend generally doesn't need `GCS_*` variables directly because uploads go through Edge Functions.

- **Supabase (Edge Functions Secrets)**:
    - `SUPABASE_URL` (Often available implicitly)
    - `SUPABASE_ANON_KEY` (Often available implicitly)
    - `SUPABASE_SERVICE_ROLE_KEY` (If needed by functions)
    - `OPENAI_API_KEY`
    - `SUPABASE_JWT_SECRET` (Required for production JWT verification)
    - `ENVIRONMENT=production`
    - `GCS_BUCKET_NAME`
    - `GCS_PROJECT_ID`
    - `GCS_CLIENT_EMAIL`
    - `GCS_PRIVATE_KEY` (Store securely as a secret)

- **Local CLI Deployment Configuration**:
    - `SUPABASE_PROJECT_REF` (used locally by `npm run functions:deploy:prod` if you do not rely on `supabase link`)

**Setup Steps:**

1.  **Vercel Environment Variables**: Configure the required `VITE_` variables in your Vercel project settings, including your public app URL and any optional background image URLs.
2.  **Supabase Function Secrets**: Navigate to your Supabase project dashboard -> Project Settings -> Functions -> Set Secrets. Add the `OPENAI_API_KEY`, `SUPABASE_JWT_SECRET`, and all `GCS_*` variables here. Pay special attention to formatting the `GCS_PRIVATE_KEY` correctly.
3.  **Supabase Project Reference for CLI deploys**: Set `SUPABASE_PROJECT_REF` in your local `.env.production`, export it in your shell, or run `supabase link --project-ref your-project-ref` once before deploying functions.

### Deploying to Vercel

1.  Install Vercel CLI:

```bash
npm i -g vercel
```

2.  Configure environment variables in Vercel:

```bash
vercel env pull .env.production
```

3.  Deploy:

```bash
npm run deploy
```

### Deploying Functions to Supabase

```bash
npm run functions:deploy:prod
```

This command deploys the following functions configured for production. It will use `SUPABASE_PROJECT_REF` from your shell or local `.env.production` when available, and otherwise falls back to the Supabase project linked in your CLI:

- recipe-extraction
- recipe-ideas-generation
- recipe-creation
- link-shares-on-signup
- ingredient-substitution
- generate-recipe-image
- `upload-user-image` # Handles user image uploads
- `ai-chef-chat` # Handles conversational recipe improvements

### Deployment Checklist

1.  Configure environment variables/secrets in Vercel and Supabase.
2.  Ensure GCS bucket exists and CORS is configured correctly for your GCS bucket. Update `cors-config.json` with your own app domain before applying it. Note: CORS rules are less critical for the current Edge Function upload approach compared to direct browser uploads, but may still be needed for displaying images depending on configuration.
3.  Run database migrations if needed (`supabase db push`)
