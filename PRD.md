# Simmer – A Paper Notebook Recipe Manager

This document is the Product Requirements Document used to inform product decisions. It reflects the current state of the application and guides future development.

## 1. Overview

### 1.1. Product Name

**Simmer** – A digital recipe manager with a paper notebook aesthetic.

### 1.2. Problem Statement

Users want a simple way to store favorite recipes found online. Current methods (Google Slides, random bookmarks) are clunky, and existing apps feel too digital and impersonal. Simmer addresses these issues by offering a fast, AI-assisted way to capture, organize, and cook recipes with a sophisticated, modern digital magazine interface.

### 1.3. Product Solution

A web-based application that:

-   Captures recipes from URLs with AI extraction
-   Presents them in a beautiful, modern digital magazine-style interface
-   Offers intuitive recipe editing and organization
-   Provides a mobile-friendly cooking mode
-   Maintains a consistent, sleek, and modern magazine aesthetic throughout

---

## 2. Design System

### 2.1. Visual Language

The app follows a "Modern Culinary Digital Magazine" aesthetic with these key elements:

**Typography**

-   Headings: A sophisticated serif (e.g., 'Playfair Display', 'Lora') for primary titles, and a clean sans-serif (e.g., 'Inter', 'Montserrat', 'Open Sans') for subheadings and UI elements.
-   Body: A highly readable sans-serif (e.g., 'Inter' or 'Open Sans') for optimal clarity.
-   Clear hierarchy with consistent sizing

**Color Palette**

-   Primary: A deep, rich color (e.g., a dark eggplant #6A0DAD, a forest green #228B22, or a sophisticated charcoal #36454F) or a clean, bright accent on a predominantly neutral base.
-   Secondary: Vibrant, appetizing accent colors (e.g., a coral #FF7F50, a saffron yellow #F4C430, or a teal #008080) for calls-to-action and highlights.
-   Backgrounds: Clean whites (e.g., #FFFFFF, #FAFAFA), light greys (e.g., #F0F0F0), with potential for a dark mode theme. Emphasis on high-quality imagery.
-   Text: Dark grey or off-black (e.g., #333333) for body text on light backgrounds, and light grey or white for dark backgrounds.

**Texture & Depth**

-   Minimal to no explicit textures. Focus on clean lines, generous whitespace, and high-quality imagery.
-   Depth achieved through subtle, modern shadows (e.g., soft, diffused shadows), layering of UI elements, and potentially parallax scrolling effects for visual interest.
-   Use of semi-transparent overlays for modals, pop-ups, or layered information, often blurred for a modern effect.
-   Strategic use of backdrop blur for modals and overlays to enhance focus and create a sophisticated feel.

**Components**

-   Sleek, modern cards with clean edges, possibly with rounded corners. Emphasis on showcasing images within cards.
-   Modern, flat or subtly elevated buttons with clear iconography and typography. Interactive states should be polished.
-   Stylish tag chips with modern typography, possibly using accent colors. Pill-shaped or slightly rounded rectangles.
-   Minimalist form inputs with clean lines, clear focus states, and potentially inline icons.

### 2.2. Interaction Design

-   Subtle hover effects
-   Smooth transitions (0.2s ease)
-   Polished, smooth micro-interactions that enhance the user experience without being distracting.
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

-   Clean, modern layout with a strong emphasis on visual appeal and readability, akin to a high-quality digital magazine.
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

### 3.7. Sharing

-   **Share Recipes and Collections:** Users can share individual recipes or entire collections with other registered users.
-   **Public/Private Visibility:**
    -   Users can set recipes or collections as public or private
    -   Public items can be viewed by anyone with the link, without requiring an account
    -   Private items are only accessible to specifically invited users
    -   Default visibility is public for easy sharing
-   **Share Dialog:** A dedicated dialog provides the interface for sharing and managing access.
    -   Invite users by email address.
    -   Set permissions (Viewer or Editor) using a dropdown.
    -   Default permission for invites is "Viewer".
    -   Toggle between public and private sharing modes via an icon in the dialog footer
-   **Access Management:**
    -   Displays a list of users with access, including their email, avatar, and permission level.
    -   The owner of the item is displayed prominently with a disabled "Owner" chip and cannot be removed or have their permissions changed.
    -   Current user is identified with a "(you)" label.
    -   Long email addresses are truncated with tooltips showing the full email.
    -   Users can change the access level (Viewer/Editor) of others via a dropdown menu attached to the permission chip.
    -   Users can remove access for others via a "Remove access" option within the permission dropdown menu.
-   **Share Button Placement:**
    -   For recipes, the share option is available in the three-dot menu on the Recipe page.
    -   For collections, the share button (paper airplane icon) is located in the header, next to the "New Recipe" button.
-   **Visual Indicator:** A small badge with a paper airplane icon appears on recipe cards in the catalog to indicate shared items.

### 3.8. Ingredient Substitution

-   **AI-Powered Suggestions:** Users can request AI-generated substitutions for specific ingredients.
-   **Contextual Awareness:** The AI considers the ingredient's quantity, unit, and the recipe's context (title, description) to provide relevant substitutions.
-   **Real-time Scaling:** Substitution quantities are automatically scaled based on the current serving size adjustment.
-   **User Interface:** Suggestions are presented in a popover, triggered from the ingredients list in both the Recipe Page and Cooking Mode.
-   **Limited Options:** A maximum of 3 substitution options are provided.
-   **Transient Nature:** Substitutions are temporary suggestions and are not permanently saved with the recipe.
-   **Handling Complex Substitutions:** Supports substitutions that require multiple ingredients and optional brief instructions.
-   **Empty State:** Provides clear feedback when no suitable substitutions are found.

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

### 5.5 Analytics

-   User behavior tracking and product analytics via PostHog (production only).
-   Identification of authenticated users.

---

## 6. Future Considerations

### 6.1. Potential Features

-   Recipe version history
-   Cooking mode with timers
-   Shopping list generation
-   Print-friendly layouts

### 6.2. Scalability

-   User accounts and authentication
-   Cloud storage for images
-   Performance optimization
-   Mobile app potential

---

This PRD will be updated as the product evolves. It serves as a living document to guide development decisions while maintaining our core aesthetic and functional principles.
