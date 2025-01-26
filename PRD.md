# Simmer – A Minimalist, Personal Recipe Manager

This document is the Product Requirements Document used to inform product decisions. It may not always be completely up to date but should be used as a starting reference point for the project.

## 1. Overview

### 1.1. Product Name

**Simmer** – A minimalist, personal recipe manager.

### 1.2. Problem Statement

Users (a couple) want a simple way to store favorite recipes found online. Current methods (Google Slides, random bookmarks) are clunky, and existing apps are too feature-heavy. Simmer addresses these issues by offering a fast, AI-assisted way to capture, organize, and cook recipes with serving-size flexibility.

### 1.3. Product Solution

A web-based application that:

-   Lets users paste a recipe URL into a field.
-   Automatically extracts and cleans the recipe data (title, ingredients with numeric amounts, steps, images, etc.) using AI.
-   Saves these recipes in a clean, searchable catalog.
-   Offers a mobile-friendly cooking mode with step-by-step instructions, ingredient referencing, and serving-size scaling.

---

## 2. Objectives & Success Criteria

### Fast & Simple Capture

-   The user can add a new recipe to the catalog by pasting a single URL.
-   Minimal manual editing required after extraction (i.e., AI does most of the work).

### Accurate AI Extraction

-   Correctly identifies at least 90% of recipe titles, ingredient amounts/units, instructions, and other metadata without user intervention.

### Clean, Organized Storage

-   The user can browse or search for recipes by title, ingredient, or auto-generated tags.
-   Recipes store a **base number of servings** and per-ingredient **quantity + unit** data for improved scaling.

### Optimized Cooking View

-   Step-by-step instructions in large, easy-to-read text, accessible on mobile devices.
-   Ingredient amounts dynamically adjust based on the chosen serving size.

### Scalable Serving Sizes

-   Users can adjust ingredient amounts for the desired serving count.
-   The system handles sensible rounding and updates references in instructions accordingly.

---

## 3. Scope

### 3.1. In-Scope Features

1. **Manual Paste-in Recipe URL**
    - A text field where users paste the link to a recipe page.
2. **AI Extraction**
    - Backend service (OpenAI or similar) processes the HTML, strips fluff, and returns structured recipe data, including:
        - Title
        - Main Image (if available)
        - **Servings** (base number of servings, if stated or inferred)
        - **Ingredient List** with numeric `quantity` and `unit` for each ingredient
        - Step-by-Step Instructions (split into sections)
        - Potential tags (cuisine, meal type, etc.)
3. **Recipe Storage & Catalog**
    - Store structured data in a database (including numeric ingredient amounts).
    - Display recipes in a grid or list.
    - Include simple search (by title, ingredients, or auto-generated tags).
4. **Auto Tagging**
    - AI tries to detect cuisine type, meal type, or key descriptors (e.g., “Italian,” “Vegan,” “Dessert”).
    - Tags are optional metadata to enhance search.
5. **Cooking Mode**
    - Large-text, step-by-step instructions.
    - Ingredient references inline, updated for scaled servings.
    - Serving-size scaling (with basic rounding).
6. **Responsive Web Interface**
    - Usable on desktop (Chrome) and mobile devices (iPhone/Android browsers).

### 3.2. Out-of-Scope Features (For This Version)

-   **Browser Extensions or Bookmarklets**: No direct browser integration.
-   **Native Mobile Apps / Share Extensions**: No iOS or Android native app.
-   **Social Sharing / Comments / Ratings**: Not needed for personal usage.
-   **Meal Planning & Grocery Lists**: Excluded from MVP.
-   **User Management**: Single account, no multi-user or invite links.

---

## 4. Functional Requirements

### 4.1. Add a Recipe

-   **FR-1**: The user can paste a recipe URL into a text input.
-   **FR-2**: On submission, the system sends the URL to an AI extraction service.
-   **FR-3**: The AI returns structured data including:
    -   Title
    -   Main Image
    -   **Base Servings** (if specified)
    -   **Ingredients** (each with `name`, numeric `quantity`, `unit`, and optional `notes`)
    -   Instructions (section-based steps)
    -   Potential tags (cuisine, meal type, etc.)
-   **FR-4**: The user can review and make minor edits before saving.
-   **FR-5**: The system saves the final recipe data to the user’s account (database).

### 4.2. View Recipes (Catalog)

-   **FR-6**: The user can see all saved recipes in a grid or list, each showing thumbnail, title, tags, and possibly serving-size info.
-   **FR-7**: Clicking/tapping a recipe card opens the detailed view (ingredients, instructions).

### 4.3. Search Recipes

-   **FR-8**: A search bar allows free-text search across:
    -   Title
    -   Ingredients
    -   Auto-generated tags
-   **FR-9**: The system returns relevant recipes ranked by best match.

### 4.4. Cooking Mode

-   **FR-10**: A “Cook” or “Start Cooking” button toggles a step-by-step cooking view.
-   **FR-11**: Each instruction step is displayed in large, readable text.
-   **FR-12**: Ingredient references within steps are highlighted or bolded.
-   **FR-13**: A user can navigate steps via “Next” / “Previous” or swipe (mobile).

### 4.5. Serving-Size Scaling

-   **FR-14**: The recipe detail page or cooking mode provides a serving-size control (slider or numeric input).
-   **FR-15**: Changing the serving size recalculates each ingredient’s `quantity` based on a ratio (`newServings / baseServings`).
-   **FR-16**: The UI applies rounding (e.g., 1.5 => 1 ½ cups) and updates the ingredient references in steps if desired.

### 4.6. Tagging

-   **FR-17**: The AI extraction service suggests tags (e.g., “Italian,” “Spicy,” “Dessert”).
-   **FR-18**: The user may edit or remove tags if desired.
-   **FR-19**: Tags are used in search filtering or as clickable categories on the catalog screen.

### 4.7. Data Persistence

-   **FR-20**: All recipe data (including numeric ingredient amounts and base servings) is stored in a cloud database.
-   **FR-21**: The user can access the same recipe library from multiple devices.

---

## 5. Non-Functional Requirements

### Performance

-   AI extraction should complete in under 5 seconds on average (depending on service).
-   Searching the local database should return results nearly instantly (<1 second).

### Usability

-   Clear, minimal UI optimized for mobile and desktop.
-   Step navigation in cooking mode must be intuitive, with large touch targets.

### Reliability

-   The system should handle AI extraction failures gracefully (offer a fallback to paste raw text).
-   Data is backed up or redundantly stored to prevent loss.

### Scalability

-   Architecture should handle up to a moderate number of stored recipes (e.g., thousands).
-   AI calls remain cost-effective for personal usage volume.

---

## 6. User Flows

### 6.1. Add Recipe Flow

1. User navigates to the “Add Recipe” screen.
2. User pastes a recipe URL into the text field.
3. User clicks/taps “Submit.”
4. System calls AI extraction service with the URL.
5. AI Service returns structured recipe data (title, servings, ingredients, instructions, etc.).
6. System displays a preview for user confirmation.
7. User (optionally) edits any fields.
8. User confirms “Save Recipe.”
9. System stores the recipe in the database.

### 6.2. View & Search Flow

1. User opens the homepage/catalog screen.
2. System displays recipe cards with thumbnail, title, auto-generated tags, and optional serving info.
3. User types a query (e.g., “chicken”) into the search bar.
4. System filters results by ingredient/title/tag match.
5. User clicks/taps a recipe to open detail view.

### 6.3. Cooking Mode Flow

1. User opens a recipe detail page.
2. User adjusts the serving size (optional).
3. The system updates ingredient quantities in real time.
4. User taps “Cook Now.”
5. System displays step-by-step instructions in large text.
6. Ingredient references reflect scaled amounts.
7. User navigates steps with Next/Previous.

---

## 7. Acceptance Criteria

-   **AC-1**: Pasting a URL from a standard recipe site (e.g., Allrecipes, Food Network, blog sites) auto-fills title, at least one image, ingredient list (with numeric amounts), instructions, and the base servings if found.
-   **AC-2**: The user can confirm or edit the parsed recipe data before saving.
-   **AC-3**: Searching by an ingredient (e.g., “chicken”) returns recipes containing that ingredient in the JSON structure.
-   **AC-4**: Serving size changes recalculate ingredient amounts in both detail view and cooking mode.
-   **AC-5**: The recipe detail and cooking mode pages are fully responsive on an iPhone screen.
-   **AC-6**: The system can handle unsuccessful AI extractions by allowing the user to paste ingredients/instructions manually if needed.
-   **AC-7**: Ingredient amounts use sensible rounding for scaled servings in cooking mode.

---

## 8. Additional Notes / Assumptions

-   **Single User Account**: Both partners share one login. No multi-user roles.
-   **AI Provider**: OpenAI or similar third-party service with a REST API for text parsing.
-   **Costs**: Must consider usage-based costs for AI calls.
-   **Offline Use**: Not in scope for MVP; the app requires an internet connection for AI extraction and data sync.
-   **Data Structure**: Numeric ingredient amounts, units, base servings, plus JSON-based instructions with sections support dynamic scaling and cooking steps.

---

**End of Document**

This PRD reflects the latest decisions on storing numeric ingredient amounts, base servings, and supporting dynamic scaling for a cooking-focused experience. The updates ensure Simmer remains easy to use, with minimal overhead and a clear path for future enhancements.
