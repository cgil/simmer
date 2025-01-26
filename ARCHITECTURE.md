# Simmer – Technical Architecture Document (TypeScript)

This document describes how **Simmer** will be built using React (with Vite), TypeScript, Material UI, Supabase, and OpenAI. It aims to be concise and focused on the core features from the [Product Requirements](#).

---

## 1. Overview

-   **Front End**:
    -   React + TypeScript, bundled with Vite
    -   Material UI for layout and components
    -   React Router for navigation
-   **Back End / Database**:
    -   [Supabase](https://supabase.com/) with a PostgreSQL database
    -   Supabase Auth for user authentication (single account)
    -   No RPC usage; we'll use the Supabase client directly for queries
-   **AI Extraction**:
    -   [OpenAI API](https://openai.com/) to parse recipe data from HTML

### Key Principles

-   **Simplicity**: Avoid unnecessary complexity.
-   **Single Page Application**: All major functionality handled by React + Supabase on the client side.
-   **Secure Calls to OpenAI**: Typically done via a serverless function or Supabase Edge Function to keep the API key hidden.

---

## 2. High-Level Architecture

1. **User** interacts with the React SPA (pages: login, catalog, recipe detail, etc.).
2. **React** fetches and stores data in Supabase (CRUD operations).
3. **AI Extraction** is triggered from the front end, but the actual call to OpenAI can be routed through a serverless/edge function to hide the API key.
4. **Supabase** manages user auth, the `recipes` table, and optional file storage.

---

## 3. Front-End Architecture

### 3.1. Tech Stack

-   **React (TypeScript)**: Ensures type safety.
-   **Vite**: Fast dev/build tooling.
-   **Material UI**: Pre-built UI components and theming.
-   **React Router**: Defines app routes.

### 3.2. Directory Structure (Proposed)

```
src/
├── components/       # Reusable UI components
├── pages/           # Route-level components
├── services/        # API and data services
├── hooks/           # Custom React hooks
├── utils/           # Helper functions
├── types/           # TypeScript interfaces
└── theme/           # Material UI theme config
```

### 3.3. App Routes

| Path               | Component         | Description                                             |
| ------------------ | ----------------- | ------------------------------------------------------- |
| `/login`           | `<Login />`       | Handles Supabase Auth sign-in.                          |
| `/catalog`         | `<Catalog />`     | Displays list/grid of saved recipes, includes search.   |
| `/add`             | `<AddRecipe/>`    | Form to paste URL, trigger AI extraction, preview data. |
| `/recipe/:id`      | `<RecipeDetail/>` | Detailed view of recipe with serving-size scaling.      |
| `/recipe/:id/cook` | `<CookingMode/>`  | Step-by-step instructions in large, readable format.    |
| `*` (catch-all)    | `<NotFound/>`     | Renders a 404-style page if no match is found.          |

---

## 4. Database Schema (Supabase)

**Table: `recipes`**

```sql
CREATE TABLE recipes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL,   -- references auth.users.id
    title       text NOT NULL,
    image_url   text,
    ingredients jsonb NOT NULL,  -- e.g. [{ "item": "Flour", "quantity": 2, "unit": "cups"}, ...]
    instructions jsonb NOT NULL, -- e.g. ["Step 1: ...", "Step 2: ...", ...]
    tags        text[] DEFAULT '{}',
    created_at  timestamptz DEFAULT now()
);
```

-   ingredients and instructions are stored as JSON for flexibility (TypeScript interfaces manage structure on the client).
-   tags is a text array for quick filtering.
-   For a single-user scenario, `user_id` can be constant or your shared login's ID.

---

## 5. Services & Data Flows

### 5.1. Adding a New Recipe

1. User pastes a recipe URL into /add.
2. Front End calls a serverless function (or Supabase Edge Function) to:
3. Fetch the webpage HTML.
4. Call OpenAI with a prompt to parse out title, ingredients, instructions, etc.
5. OpenAI returns structured JSON.
6. Front End shows a preview form. User can edit fields before saving.
7. Front End sends the final data to Supabase via recipeService.createRecipe().

### 5.2. Viewing & Searching Recipes

1. `/catalog`: The front end uses recipeService.getRecipes() to fetch all recipes or to filter by search term.
2. Recipes appear as cards with title, thumbnail (image_url), and tags.
3. Search can be implemented client-side (basic filtering) or via a query to Supabase with a like/ilike condition.

### 5.3. Cooking Mode

1. User opens /recipe/:id.
2. Front End fetches recipe data from Supabase.
3. Serving Size changes recalculate ingredient amounts on the fly in the client.
4. User clicks "Cook Now" => navigates to /recipe/:id/cook.
5. CookingMode displays instructions step by step.

---

## 6. Deployment

### Front End

-   Deploy as static files on Vercel, Netlify, or a similar host.
-   Built via vite build.

### Supabase

-   Hosted instance on Supabase.com.
-   Manages auth and database.

### Serverless/Edge Function (For AI Key Security)

-   Optionally use Vercel/Netlify Functions, or Supabase Edge Functions.
-   Stores OpenAI API key in environment variables.
-   Endpoint: POST /api/extract => { url: string } => returns structured recipe.

---

## 7. Libraries & Utilities

-   **TypeScript**: Ensures type safety across front end code and data models.
-   **React + Vite**: Core SPA framework and bundler.
-   **Material UI**: UI components (forms, buttons, layout).
-   **React Router**: Defines routes (/login, /catalog, etc.).
-   **Supabase JS Client**: Auth, CRUD (direct usage, no RPC).
-   **OpenAI Node/JS Library**: In a serverless function or direct REST fetch.
-   **Axios or Fetch**: For internal HTTP requests if needed.
