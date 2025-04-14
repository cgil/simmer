# Simmer – A Paper Notebook Recipe Manager

This document is the Product Requirements Document used to inform product decisions. It reflects the current state of the application and guides future development.

## 1. Overview

### 1.1. Product Name

**Simmer** – A digital recipe manager with a paper notebook aesthetic.

### 1.2. Problem Statement

Users want a simple way to store favorite recipes found online. Current methods (Google Slides, random bookmarks) are clunky, and existing apps feel too digital and impersonal. Simmer addresses these issues by offering a fast, AI-assisted way to capture, organize, and cook recipes with a warm, personal journal-like interface.

### 1.3. Product Solution

A web-based application that:

-   Captures recipes from URLs with AI extraction
-   Presents them in a beautiful, paper notebook-style interface
-   Offers intuitive recipe editing and organization
-   Provides a mobile-friendly cooking mode
-   Maintains a consistent paper journal aesthetic throughout

---

## 2. Design System

### 2.1. Visual Language

The app follows a "Paper Notebook Recipe Journal" aesthetic with these key elements:

**Typography**

-   Headings: Kalam (cursive) for a handwritten feel
-   Body: Inter (sans-serif) for readability
-   Clear hierarchy with consistent sizing

**Color Palette**

-   Primary: Ink-like navy (#2C3E50)
-   Secondary: Warm yellow for interactive elements
-   Paper: Warm whites and creams
-   Text: Soft black for readability

**Texture & Depth**

-   Paper-like backgrounds with dot patterns
-   Subtle shadows and layering
-   Semi-transparent overlays
-   Backdrop blur effects

**Components**

-   Paper-like cards and containers
-   Notebook-style buttons
-   Tag chips resembling paper labels
-   Form inputs with gentle borders

### 2.2. Interaction Design

-   Subtle hover effects
-   Smooth transitions (0.2s ease)
-   Paper-like micro-interactions
-   Mobile-friendly touch targets
-   Personalized user interface elements

### 2.3. User Interface Personalization

-   User profile pictures display from authentication providers
-   Fallback to user initials when profile picture is unavailable
-   Consistent profile representation throughout the application
-   Smooth image loading with proper error handling

---

## 3. Core Features

### 3.1. Recipe Import

-   URL paste functionality
-   AI extraction of recipe data
-   Recipe ideas generation from text prompts
-   Preview and edit capabilities
-   Structured data storage
-   Whimsical loading experience with:
    -   Recipe-themed progress steps
    -   Visual feedback on extraction stages
    -   Friendly, cooking-themed status messages
    -   Smooth transitions between states

### 3.2. Recipe Viewing

-   Clean, paper-like layout
-   Image gallery
-   Ingredient scaling
-   Section-based instructions
-   Notes support
-   Flexible time display:
    -   Support for zero prep/cook times
    -   Automatic total time calculation
    -   Clear time breakdown visualization
    -   Optional time fields

### 3.3. Recipe Editing

-   Rich text editing
-   Image management
-   Ingredient organization
-   Instruction sections
-   Notes and tags
-   Ingredient references:
    -   @-mention style ingredient references in instructions
    -   Auto-formatting of ingredient quantities and units
    -   Visual highlighting of referenced ingredients
    -   Quick ingredient selection via dropdown or carrot button

### 3.4. Recipe Catalog

-   Grid view of recipes
-   Search functionality
-   Tag filtering
-   Preview cards

### 3.5. Collections

-   Organization of recipes into user-defined collections
-   "All Recipes" view showing recipes across all collections
-   Ability to add, rename, and delete collections
-   Custom emoji icons for visual identification
-   Recipes can belong to multiple collections or no collections
-   Animated transitions for smooth user experience when managing collections
-   Collection-specific recipe browsing

### 3.6. Cooking Mode

-   Step-by-step instruction view
-   Interactive timer system with:
    -   Pause/resume functionality
    -   Visual and audio notifications
    -   Multi-timer tracking across steps
    -   Quick navigation between timed steps
-   Real-time timer synchronization
-   Ingredient scaling
-   Mobile-friendly interface

---

## 4. User Flows

### 4.1. Adding a Recipe

1. Click "New Recipe" in header
2. Paste recipe URL
3. AI extracts and structures data
4. Edit and customize
5. Save to collection

### 4.2. Viewing & Cooking

1. Select recipe from catalog
2. View full recipe details
3. Adjust serving size if needed
4. Follow step-by-step instructions
5. Reference ingredients and notes

### 4.3. Editing a Recipe

1. Access recipe edit mode
2. Modify text, images, or structure
3. Add/remove sections
4. Update ingredients or instructions
5. Save changes

---

## 5. Technical Requirements

### 5.1. Performance

-   Smooth transitions and animations
-   Quick recipe loading
-   Responsive image handling
-   Efficient data management
-   Enhanced loading states:
    -   Themed progress indicators
    -   Step-by-step extraction feedback
    -   Optimistic UI updates
    -   Error state handling

### 5.2. Compatibility

-   Modern web browsers
-   Mobile-responsive design
-   Touch-friendly interfaces

### 5.3. Data Management

-   Structured recipe storage
-   Image optimization
-   Efficient search indexing

### 5.4. Security & Authentication

-   JWT-based authentication for all API endpoints
-   Support for multiple OAuth providers (Google, GitHub, etc.)
-   Profile picture integration from authentication providers
-   Secure recipe extraction with authenticated requests
-   Environment-specific security configurations
-   Automatic token management in frontend
-   Protected routes and API endpoints

---

## 6. Future Considerations

### 6.1. Potential Features

-   Recipe version history
-   Cooking mode with timers
-   Shopping list generation
-   Print-friendly layouts
-   Recipe sharing

### 6.2. Scalability

-   User accounts and authentication
-   Cloud storage for images
-   Performance optimization
-   Mobile app potential

---

This PRD will be updated as the product evolves. It serves as a living document to guide development decisions while maintaining our core aesthetic and functional principles.
