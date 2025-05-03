# Simmer Architecture Document

This document outlines the technical architecture and implementation details of the Simmer recipe management application.

## 1. Technology Stack

### 1.1. Frontend

-   **Framework**: React with TypeScript
-   **Build Tool**: Vite
-   **UI Framework**: Material-UI (MUI)
-   **State Management**: React Context
-   **Routing**: React Router
-   **Styling**: MUI styled-components with custom theme
-   **Analytics**: PostHog (for product analytics, production only)

### 1.2. Backend & Data

-   **Database**: Supabase (PostgreSQL)
-   **Storage**: Google Cloud Storage (GCS) for images (using Signed URLs)
-   **AI Integration**: OpenAI API for recipe extraction, ideas, creation, and substitution
-   **Authentication**: Supabase Auth

---

## 2. Design System Implementation

### 2.1. Theme Configuration

```typescript
// Theme constants
const COLORS = {
    primary: {
        main: '#2C3E50', // Ink-like navy
        light: '#34495E',
        dark: '#1A252F',
    },
    secondary: {
        main: '#F1C40F', // Warm yellow
        light: '#F4D03F',
        dark: '#D4AC0D',
    },
    paper: {
        light: '#F8F7FA',
        main: '#FFFFFF',
    },
};

const FONTS = {
    heading: 'Kalam',
    body: 'Inter',
};

const TRANSITIONS = {
    duration: '0.2s',
    timing: 'ease',
};
```

### 2.2. Component Base Styles

```typescript
// Paper-like container base styles
const paperStyles = {
    backgroundColor: 'paper.light',
    borderRadius: 2,
    padding: 3,
    position: 'relative',
    '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        zIndex: 0,
    },
};

// Typography base styles
const typographyStyles = {
    h1: {
        fontFamily: FONTS.heading,
        color: 'primary.main',
    },
    body1: {
        fontFamily: FONTS.body,
        color: 'text.primary',
    },
};
```

---

## 3. Component Architecture

### 3.1. Layout Components

```
src/
  components/
    layout/
      AppLayout.tsx       # Main app wrapper with header
      PageContainer.tsx   # Standard page container
      RecipeLayout.tsx    # Recipe page specific layout
      UserAvatar.tsx      # User profile avatar component with robust fallbacks
```

### 3.2. Feature Components

```
src/
  features/
    recipe/
      components/
        RecipeCard.tsx
        RecipeGallery.tsx
        CookingInstructions.tsx
        RecipeNotes.tsx
      hooks/
        useRecipe.ts
        useRecipeForm.ts
    import/
      components/
        ImportForm.tsx
      hooks/
        useRecipeImport.ts
```

### 3.3. Shared Components

```
src/
  components/
    common/
      Button.tsx
      TextField.tsx
      Paper.tsx
      Typography.tsx
```

### 3.4. Ingredient Reference System

```typescript
// IngredientReferenceInput component for mentioning ingredients in instructions
interface IngredientReferenceInputProps {
    value: string;
    onChange: (value: string) => void;
    ingredients: Ingredient[];
    placeholder?: string;
}

// Styling configuration for ingredient references
const mentionStyle = {
    control: {
        /* Input styling */
    },
    input: {
        /* Input field styling */
    },
    highlighter: {
        /* Highlight styling */
    },
    suggestions: {
        /* Dropdown styling */
    },
    mention: {
        backgroundColor: '#FFF8C5',
        color: '#9C6D00',
        borderRadius: '2px',
        boxShadow: 'none',
        border: 'none',
        textShadow: 'none',
    },
};

// Reference format and transforms
const referenceFormat = {
    markup: '@[__display__](__id__)',
    displayTransform: (id, display) => {
        // Format ingredient display based on quantity/unit
        return formattedIngredientText;
    },
};
```

### 3.5. Timer System

```typescript
interface ActiveTimer {
    startTime: number;
    duration: number;
    isRunning: boolean;
    hasFinished: boolean;
    pausedAt: number | null;
    totalPausedTime: number;
}

// Timer state management
const timerManagement = {
    startTimer: (duration: number) => void;
    pauseTimer: () => void;
    resumeTimer: () => void;
    resetTimer: () => void;
    calculateTimeLeft: () => number;
};

// Notification system
const notificationSystem = {
    audio: {
        play: () => void;
        fadeOut: (duration: number) => void;
    },
    visual: {
        showOverlay: boolean;
        vibrate: boolean;
    }
};
```

### 3.6. Authentication and User Profile

```typescript
// UserAvatar component for displaying user profile pictures
interface User {
  id: string;
  email?: string;
  user_metadata?: {
    avatar_url?: string;
    picture?: string;
    [key: string]: unknown;
  };
}

interface UserAvatarProps {
  user: User | null;
  size?: number;
  sx?: SxProps<Theme>;
}

// Avatar rendering with fallbacks
const avatarRenderingStrategy = {
  checkImageValidity: (url: string) => boolean;
  primarySource: 'user_metadata.avatar_url',
  secondarySource: 'user_metadata.picture',
  fallbackDisplay: 'user.email.charAt(0).toUpperCase()',
  noUserFallback: '<AccountCircleIcon />'
};
```

---

## 4. Data Models

### 4.1. Recipe Schema

```sql
create table recipes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  servings integer,
  prep_time integer check (prep_time >= 0),
  cook_time integer check (cook_time >= 0),
  total_time integer check (total_time >= 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table recipe_images (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references recipes(id) on delete cascade,
  url text not null,
  position integer default 0,
  created_at timestamp with time zone default now()
);

create table recipe_ingredients (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references recipes(id) on delete cascade,
  name text not null,
  quantity decimal,
  unit text,
  notes text,
  position integer default 0
);

create table recipe_instructions (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references recipes(id) on delete cascade,
  section_title text,
  step_number integer not null,
  content text not null
);

create table recipe_notes (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references recipes(id) on delete cascade,
  content text not null,
  position integer default 0
);
```

### 4.2. Collections Schema

```sql
-- Collections table
create table collections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  emoji text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Recipe-collections junction table
create table recipe_collections (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references recipes(id) on delete cascade not null,
  collection_id uuid references collections(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(recipe_id, collection_id) -- Prevent duplicates
);
```

### 4.3. Collection Management

```typescript
// Collection item representation
interface CollectionItem {
    id: string;
    name: string;
    count: number;
    emoji?: string;
}

// Collection drawer component
const CollectionsDrawer: FC<{
    selectedCollection: string;
    onCollectionSelect: (id: string) => void;
    collections: CollectionItem[];
    onCreateCollection: () => void;
    onUpdateCollection: (id: string, name: string, emoji?: string) => void;
    onDeleteCollection: (id: string) => void;
}>;

// Collection API methods
const RecipeService = {
    // Get all collections for a user with recipe counts
    getCollectionItems: (userId: string) => Promise<CollectionItem[]>,

    // Create a new collection
    createCollection: (userId: string, name: string, emoji?: string) =>
        Promise<Collection>,

    // Update collection properties
    updateCollection: (
        id: string,
        updates: { name?: string; emoji?: string }
    ) => Promise<Collection>,

    // Delete a collection
    deleteCollection: (id: string) => Promise<boolean>,

    // Get recipes in a specific collection
    getRecipesByCollection: (userId: string, collectionId: string) =>
        Promise<Recipe[]>,
};
```

### 4.4. Time Handling System

```typescript
interface TimeEstimate {
    prep: number; // In minutes, can be 0
    cook: number; // In minutes, can be 0
    total: number; // Auto-calculated, can be 0
}

// Time management utilities
const timeManagement = {
    calculateTotal: (prep: number, cook: number) => prep + cook,
    validateTime: (time: number) => time >= 0,
    formatTimeDisplay: (minutes: number) => `${minutes} mins`,
};
```

### 4.5. Ingredient Display Utilities

```typescript
// Utility for consistently formatting ingredient display text
export const formatIngredientDisplayText = (
    ingredient: Ingredient,
    scaledQuantity?: number | null
): string => {
    // Format ingredient with quantity and unit when available
    // Support for scaled quantities when serving size changes
    // Consistent display format across all ingredient references
};
```

### 4.6. Extraction Progress System

```typescript
// Extraction steps configuration
const EXTRACTION_STEPS = [
    'Visiting the recipe website',
    'Gathering tasty photos',
    'Having our chef taste test',
    'Personalizing it for you',
    'Writing it in our cookbook',
];

interface ExtractionProgress {
    activeStep: number;
    isLoading: boolean;
    error: string | null;
}

// Progress management
const extractionProgress = {
    nextStep: () => void;
    handleError: (error: Error) => void;
    resetProgress: () => void;
};

// Visual components
const progressComponents = {
    StepCard: {
        active: {
            transform: 'rotate(-2deg)',
            elevation: 2,
            bgcolor: 'primary.lighter',
        },
        completed: {
            bgcolor: 'success.lighter',
            checkmark: true,
        },
        pending: {
            bgcolor: 'background.paper',
        },
    },
};
```

---

## 5. API Integration

### 5.1. OpenAI Recipe Extraction

```typescript
interface ExtractedRecipe {
    title: string;
    description?: string;
    servings?: number;
    prepTime?: string;
    cookTime?: string;
    totalTime?: string;
    ingredients: {
        name: string;
        quantity?: number;
        unit?: string;
        notes?: string;
    }[];
    instructions: {
        sectionTitle?: string;
        steps: string[];
    }[];
    notes?: string[];
}

// Recipe extraction API client
const extractRecipe = async (url: string): Promise<Recipe> => {
    const { data, error } = await supabase.functions.invoke(
        'recipe-extraction',
        {
            body: { url },
        }
    );

    if (error) {
        throw new Error(`Recipe extraction failed: ${error.message}`);
    }

    return data;
};
```

### 5.2. OpenAI Recipe Ideas Generation

```typescript
interface RecipeIdea {
    id: string;
    title: string;
    description: string;
}

// Recipe ideas generation API client
const generateRecipeIdeas = async (prompt: string): Promise<RecipeIdea[]> => {
    const { data, error } = await supabase.functions.invoke(
        'recipe-ideas-generation',
        {
            body: { prompt },
        }
    );

    if (error) {
        throw new Error(`Recipe ideas generation failed: ${error.message}`);
    }

    return data;
};
```

### 5.3. Authentication & Security

The recipe extraction and ideas generation endpoints are protected by JWT verification in production:

-   All requests must include a valid JWT token
-   The Supabase client automatically handles token inclusion
-   Development environment can optionally disable JWT verification
-   Production environment enforces JWT verification

### 5.4. Supabase Integration

```typescript
// Database types
interface Recipe {
    id: string;
    title: string;
    description?: string;
    servings?: number;
    prep_time?: string;
    cook_time?: string;
    total_time?: string;
    created_at: string;
    updated_at: string;
    images?: RecipeImage[];
    ingredients?: RecipeIngredient[];
    instructions?: RecipeInstruction[];
    notes?: RecipeNote[];
}

// Database queries
const recipeQueries = {
    getRecipe: (id: string) =>
        supabase
            .from('recipes')
            .select(
                `
      *,
      images (*),
      ingredients (*),
      instructions (*),
      notes (*)
    `
            )
            .eq('id', id)
            .single(),

    // Additional query implementations
};
```

### 5.5. Google Cloud Storage (GCS) Integration for Images

-   **Flow**:
    1.  **User/AI Image Upload (Client-Side Trigger)**:
        -   The client prepares the image data (e.g., reads `File` as base64).
        -   The client calls the `upload-user-image` Supabase Edge Function via `supabase.functions.invoke`, sending the image data (e.g., base64 string and content type) in the request body (typically JSON).
    2.  **Edge Function Processing (`upload-user-image`)**:
        -   The function authenticates the user.
        -   It parses the request body (e.g., decodes base64).
        -   It validates the content type and size.
        -   It calls the shared `uploadDataToGCS` utility function using service account credentials to upload the image bytes directly to GCS.
        -   It returns the permanent GCS URL to the client.
    3.  **Backend Image Upload (e.g., Recipe Extraction/Creation)**:
        -   Backend functions (like `recipe-extraction`, `recipe-creation`) generate or download image data.
        -   They directly call the shared `uploadDataToGCS` utility function to upload the image bytes to GCS using service account credentials.
        -   The resulting permanent GCS URL is stored in the database.
    4.  **Reference Storage**: The permanent GCS URL is stored in the appropriate database table (e.g., `recipes.images` array or a dedicated `recipe_images` table) when the recipe is saved or created.
-   **CORS**: GCS bucket CORS configuration might still be necessary for allowing the browser to _display_ images directly from GCS, depending on bucket/object access settings. However, it's no longer required for the upload PUT requests from the browser.
-   **Security**: Service account keys are stored securely as environment variables/secrets in Supabase Function settings, granting backend functions the necessary permissions to upload data via `uploadDataToGCS`.

### 5.6. PostHog Analytics Integration

-   **Initialization**: PostHog is initialized in `src/main.tsx` only when the application runs in the production environment (`config.environment === 'production'`). It requires `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` environment variables set in the deployment environment (e.g., Vercel).
-   **User Identification**: User identification is handled within `src/context/AuthContext.tsx`. When the Supabase authentication state changes (`onAuthStateChange`), if a user is logged in (and in production), `posthog.identify()` is called with the user's ID, email, and name (if available in metadata). If the user logs out, `posthog.reset()` is called.
-   **Automatic Capture**: PostHog automatically captures page view events.
-   **Custom Events**: Custom events can be captured using the `usePostHog` hook or `posthog.capture()` directly.

---

## 6. Performance Considerations

### 6.1. Image Optimization

-   **Client-Side Resizing**: Consider resizing images on the client before uploading to reduce upload time and storage costs.
-   **GCS Features**: Leverage GCS features like Object Lifecycle Management for potential future optimizations (e.g., moving older images to cheaper storage classes).
-   **Lazy Loading**: Lazy loading for recipe images in the frontend.
-   **Responsive Image Sizes**: Frontend retrieves appropriate image sizes if different versions are stored or generated (potentially via GCS functions/triggers later).
-   **Format**: Standard web formats like JPEG, PNG, WebP.

### 6.2. State Management

-   Context-based state management for UI
-   Efficient data caching
-   Optimistic updates for better UX

### 6.3. Loading States

-   Skeleton loaders for recipe cards
-   Progressive image loading
-   Smooth transitions between states

---

## 7. Security

### 7.1. Authentication

-   Supabase authentication
-   OAuth providers (Google, GitHub, etc.)
-   User profile image display from auth providers
-   Protected routes
-   Secure session management

### 7.2. Data Access

-   Row Level Security (RLS) policies
-   Secure API endpoints
-   Input validation

---

## 8. Testing Strategy

### 8.1. Unit Tests

-   Component testing with React Testing Library
-   Hook testing
-   Utility function testing

### 8.2. Integration Tests

-   API integration tests
-   Database query tests
-   User flow tests

### 8.3. E2E Tests

-   Critical user journeys
-   Cross-browser testing
-   Mobile responsiveness

---

This architecture document will be updated as the application evolves. It serves as a reference for technical decisions and implementation details.
