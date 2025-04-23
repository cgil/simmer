/**
 * Collection related type definitions
 */

export interface Collection {
    id: string;
    user_id: string;
    name: string;
    emoji?: string;
    created_at: string;
    updated_at: string;
    recipe_count?: number; // For UI display, not stored in DB
    is_shared?: boolean; // Flag to indicate if this is a shared collection
    access_level?: "view" | "edit"; // Access level for shared collections
}

export interface RecipeCollection {
    id: string;
    recipe_id: string;
    collection_id: string;
    created_at: string;
}

// Special collection ID for "All Recipes" view
export const ALL_RECIPES_ID = "all";

// Collection route path for consistent navigation
export const COLLECTION_ROUTE_PATH = "/collection";

// For the CollectionItem used in UI components
export interface CollectionItem {
    id: string;
    name: string;
    count: number;
    icon?: React.ReactNode;
    emoji?: string;
    is_shared?: boolean; // Flag to indicate if this is a shared collection
    access_level?: "view" | "edit"; // Access level for shared collections
}
