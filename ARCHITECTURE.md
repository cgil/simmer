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

### 1.2. Backend & Data

-   **Database**: Supabase (PostgreSQL)
-   **Storage**: Supabase Storage for images
-   **AI Integration**: OpenAI API for recipe extraction
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

### 3.4. Timer System

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

---

## 4. Data Models

### 4.1. Recipe Schema

```sql
create table recipes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  servings integer,
  prep_time text,
  cook_time text,
  total_time text,
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

### 5.2. Authentication & Security

The recipe extraction endpoint is protected by JWT verification in production:

-   All requests must include a valid JWT token
-   The Supabase client automatically handles token inclusion
-   Development environment can optionally disable JWT verification
-   Production environment enforces JWT verification

### 5.3. Supabase Integration

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

---

## 6. Performance Considerations

### 6.1. Image Optimization

-   Automatic image resizing on upload
-   Lazy loading for recipe images
-   Responsive image sizes
-   WebP format support

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
