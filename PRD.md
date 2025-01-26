This document is a technical and architural summary for the application. It should be used to inform decisions although it is not always completely up to date. It should be used as a reference and starting point when working on new problems to ensure we adhere to creating a consistent application.

# Simmer – A Minimalist, Personal Recipe Manager

## 1. Overview

### 1.1. Product Name (Working Title)

**Simmer – A minimalist, personal recipe manager.**

### 1.2. Problem Statement

Users (a couple) want a simple way to store favorite recipes found online. Current methods (Google Slides, random bookmarks) are clunky, and existing apps are too feature-heavy.

### 1.3. Product Solution

A web-based application that:

-   Allows users to paste a recipe URL into a field.
-   Automatically extracts and cleans the recipe data (title, ingredients, steps, images) using AI.
-   Saves these recipes in a clean, searchable catalog.
-   Provides a mobile-friendly cooking mode with step-by-step instructions and serving-size scaling.

---

## 2. Objectives & Success Criteria

### Fast & Simple Capture

-   The user can add a new recipe to the catalog by pasting a single URL.
-   Minimal manual editing required after extraction.

### Accurate AI Extraction

-   Correctly identifies at least 90% of recipe titles, ingredient lists, and instructions without user intervention.

### Clean, Organized Storage

-   The user can browse or search for recipes by title, ingredient, or auto-generated tags.

### Optimized Cooking View

-   Step-by-step instructions in large, easy-to-read text, accessible on mobile devices.

### Scalable Serving Sizes

-   Easily adjust ingredient amounts for the desired serving count.

---

## 3. Scope

### 3.1. In-Scope Features

1. **Manual Paste-in Recipe URL**: A text field where users paste the link to a recipe page.
2. **AI Extraction**: Backend service (OpenAI or similar) processes the HTML, strips fluff, and returns structured recipe data (title, ingredients, instructions, images).
3. **Recipe Storage & Catalog**:
    - Store structured data in a database.
    - Display recipes in a grid or list.
    - Include simple search (by title, ingredients, or auto-generated tags).
4. **Auto Tagging**:
    - AI tries to detect cuisine type, meal type, or key descriptors (e.g., “Italian,” “Vegan,” “Dessert”).
    - Tags are optional metadata to enhance search.
5. **Cooking Mode**:
    - Large-text, step-by-step instructions.
    - Ingredient references inline.
    - Serving-size scaling (with basic rounding).
6. **Responsive Web Interface**:
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
-   **FR-3**: The AI returns structured data:
    -   Title
    -   Main Image (if available)
    -   Ingredient List (with amounts and units)
    -   Step-by-Step Instructions
    -   Potential tags (cuisine, meal type, etc.)
-   **FR-4**: The user can review and make minor edits (optional) before saving.
-   **FR-5**: The system saves the final recipe data to the user’s account.

### 4.2. View Recipes (Catalog)

-   **FR-6**: The user can see all saved recipes in a grid or list, showing thumbnail, title, and tags.
-   **FR-7**: Clicking/tapping a recipe card opens the detailed view (ingredients, instructions).

### 4.3. Search Recipes

-   **FR-8**: A search bar allows free-text search across:
    -   Title
    -   Ingredients
    -   Auto-generated tags
-   **FR-9**: The system returns relevant recipes ranked by best match.

### 4.4. Cooking Mode

-   **FR-10**: A “Cook” or “Start Cooking” button toggles a step-by-step view.
-   **FR-11**: Each instruction step is displayed in large, readable text.
-   **FR-12**: Ingredient references within steps are highlighted or bolded.
-   **FR-13**: A user can navigate steps via “Next” / “Previous” or swipe (on mobile).

### 4.5. Serving-Size Scaling

-   **FR-14**: The recipe detail page or cooking mode provides a serving-size control (slider or numeric input).
-   **FR-15**: Changing the serving size automatically recalculates ingredient amounts.
-   **FR-16**: Recalculated amounts use sensible rounding (e.g., nearest 0.25 for cups, or nearest 0.5 for tablespoons).

### 4.6. Tagging

-   **FR-17**: The AI extraction service suggests tags (e.g., “Italian,” “Spicy,” “Dessert”).
-   **FR-18**: The user may edit or remove tags if desired.
-   **FR-19**: Tags are used in search filtering or as clickable categories on the catalog screen.

### 4.7. Data Persistence

-   **FR-20**: All recipe data is stored in a cloud database.
-   **FR-21**: The user can access the same recipe library from multiple devices (no additional user accounts needed, just the same login).

---

## 5. Non-Functional Requirements

### Performance

-   AI extraction should complete in under 5 seconds on average (depending on service).
-   Searching the local database should return results instantaneously (sub-1 second).

### Security

-   Basic authentication for user login.
-   All traffic served over HTTPS.

### Usability

-   Clear, minimal UI optimized for mobile screens and desktop.
-   Step navigation in cooking mode must be intuitive, with large touch targets.

### Reliability

-   The system should handle occasional AI extraction failures gracefully (e.g., revert to “paste raw text” if the AI fails).
-   Data is backed up or redundantly stored to prevent loss.

### Scalability

-   Although this is for personal use, the architecture should handle up to a moderate number of stored recipes (e.g., thousands).
-   AI calls remain cost-effective for personal usage volume.

---

## 6. User Flows

### 6.1. Add Recipe Flow

1. User navigates to the “Add Recipe” screen.
2. User pastes a recipe URL into the text field.
3. User clicks/taps “Submit.”
4. System calls AI extraction service with the URL.
5. AI Service returns structured recipe data (title, ingredients, etc.).
6. System displays a preview for user confirmation.
7. User (optionally) edits or corrects any fields.
8. User confirms “Save Recipe.”
9. System stores the recipe and returns to the catalog (or goes to recipe detail view).

### 6.2. View & Search Flow

1. User opens the homepage or catalog screen.
2. System displays recipe cards with thumbnail, title, auto-generated tags.
3. User types a query (e.g., “chicken”) into the search bar.
4. System filters results by ingredient/title/tag match.
5. User clicks/taps a recipe to open detail view.

### 6.3. Cooking Mode Flow

1. User opens a recipe detail page.
2. User selects the desired serving size (optional).
3. System updates ingredient amounts in real time.
4. User taps “Cook Now” (or similar button).
5. System displays step-by-step instructions in large text.
6. User swipes or taps “Next Step” to proceed.
7. User completes cooking and can exit cooking mode.

---

## 7. Acceptance Criteria

-   **AC-1**: Pasting a URL from a standard recipe site (e.g., Allrecipes, Food Network, blog sites) correctly auto-fills title, at least one image, ingredient list, and instructions.
-   **AC-2**: The user can confirm or edit the parsed recipe data before saving.
-   **AC-3**: Searching for an ingredient (e.g., “chicken”) returns recipes with “chicken” in the ingredients.
-   **AC-4**: Serving size changes recalculate ingredient amounts correctly in both the detail view and cooking mode.
-   **AC-5**: The recipe detail and cooking mode pages are fully responsive on an iPhone screen.
-   **AC-6**: The system can handle unsuccessful AI extractions by allowing the user to paste the ingredients or instructions manually if needed.

---

## 8. Additional Notes / Assumptions

-   **Single User Account**: Both the user and spouse share one login. No multi-user roles.
-   **AI Provider**: OpenAI or similar third-party service with a standard REST API for text analysis/parsing.
-   **Costs**: Must consider usage-based costs for AI calls.
-   **Offline Use**: Not in scope for this MVP; an internet connection is required to fetch AI extraction and sync data.

---

**End of Document**

This PRD outlines the minimum viable product for a personal, AI-powered recipe webapp—now called **Simmer**—relying on manual URL input, with core features of recipe parsing, catalog, search, and cooking mode. It should serve as a clear blueprint for the development team or AI assistants.
