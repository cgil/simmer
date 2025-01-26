# Recipe JSON Template

Below is a JSON template that accommodates scaling by explicitly tracking the base number of servings and storing ingredient amounts in a more structured format (numeric + unit). This way, if you decide to change how many people the recipe should serve, the application can apply the necessary math to update each ingredient amount accordingly. This is an example of the expected output from the AI after being given a url for a recipe.

```json
{
    "title": "Chicken Tikka Masala",
    "description": "A classic curried dish featuring tender chunks of char-grilled chicken simmered in a flavorful and aromatic sauce.",
    "images": [
        // Array of image URLs if available
    ],
    "servings": 4, // Base number of servings for this recipe
    "ingredients": [
        {
            "section_title": "For the Chicken Marinade",
            "items": [
                {
                    "name": "chicken breasts or thighs",
                    "quantity": 500, // numeric amount
                    "unit": "grams", // standard unit
                    "notes": "cut into 1-inch pieces"
                },
                {
                    "name": "plain yogurt",
                    "quantity": 0.5,
                    "unit": "cup"
                },
                {
                    "name": "ginger garlic paste",
                    "quantity": 1,
                    "unit": "tablespoon"
                },
                {
                    "name": "red chili powder",
                    "quantity": 1,
                    "unit": "teaspoon",
                    "notes": "adjust to taste"
                },
                {
                    "name": "turmeric powder",
                    "quantity": 0.5,
                    "unit": "teaspoon"
                },
                {
                    "name": "garam masala",
                    "quantity": 1,
                    "unit": "teaspoon"
                },
                {
                    "name": "coriander powder",
                    "quantity": 1,
                    "unit": "teaspoon"
                },
                {
                    "name": "cumin powder",
                    "quantity": 0.5,
                    "unit": "teaspoon"
                },
                {
                    "name": "kasuri methi (dried fenugreek leaves)",
                    "quantity": 1,
                    "unit": "teaspoon",
                    "notes": "crushed"
                },
                {
                    "name": "lemon juice",
                    "quantity": 1,
                    "unit": "tablespoon"
                },
                {
                    "name": "salt",
                    "quantity": null,
                    "unit": null,
                    "notes": "to taste"
                },
                {
                    "name": "oil",
                    "quantity": 2,
                    "unit": "tablespoon"
                }
            ]
        },
        {
            "section_title": "For the Masala (Gravy)",
            "items": [
                {
                    "name": "oil or butter",
                    "quantity": 2,
                    "unit": "tablespoon"
                },
                {
                    "name": "bay leaf",
                    "quantity": 1,
                    "unit": "leaf"
                },
                {
                    "name": "cinnamon stick",
                    "quantity": 1,
                    "unit": "inch"
                },
                {
                    "name": "green cardamom pods",
                    "quantity": 2,
                    "unit": "pod"
                },
                {
                    "name": "cloves",
                    "quantity": 2,
                    "unit": "whole"
                },
                {
                    "name": "onions, finely chopped",
                    "quantity": 1,
                    "unit": "cup"
                },
                {
                    "name": "ginger garlic paste",
                    "quantity": 1,
                    "unit": "tablespoon"
                },
                {
                    "name": "tomato puree",
                    "quantity": 1.5,
                    "unit": "cup",
                    "notes": "fresh or canned"
                },
                {
                    "name": "red chili powder",
                    "quantity": 0.5,
                    "unit": "teaspoon",
                    "notes": "adjust to taste"
                },
                {
                    "name": "garam masala",
                    "quantity": 0.5,
                    "unit": "teaspoon"
                },
                {
                    "name": "coriander powder",
                    "quantity": 0.5,
                    "unit": "teaspoon"
                },
                {
                    "name": "cumin powder",
                    "quantity": 0.5,
                    "unit": "teaspoon"
                },
                {
                    "name": "cashew nuts (soaked & blended)",
                    "quantity": 0.25,
                    "unit": "cup",
                    "notes": "smooth paste"
                },
                {
                    "name": "heavy cream",
                    "quantity": 0.5,
                    "unit": "cup"
                },
                {
                    "name": "kasuri methi (dried fenugreek leaves)",
                    "quantity": 1,
                    "unit": "teaspoon",
                    "notes": "crushed"
                },
                {
                    "name": "fresh cilantro",
                    "quantity": null,
                    "unit": null,
                    "notes": "garnish"
                },
                {
                    "name": "salt",
                    "quantity": null,
                    "unit": null,
                    "notes": "to taste"
                }
            ]
        }
    ],
    "instructions": [
        {
            "section_title": "Marinating the Chicken",
            "steps": [
                "In a mixing bowl, combine yogurt, ginger garlic paste, red chili powder, turmeric, garam masala, coriander, cumin, crushed kasuri methi, lemon juice, salt, and oil to form a smooth marinade.",
                "Add the chicken pieces, coat thoroughly, and refrigerate for at least 1 hour (preferably overnight)."
            ]
        },
        {
            "section_title": "Grilling the Chicken",
            "steps": [
                "Option 1 (Oven): Preheat oven to 240°C (460°F). Arrange chicken on a wire rack over a foil-lined tray. Bake 15-20 minutes, turning halfway, until slightly charred. Broil 2-3 minutes for extra char.",
                "Option 2 (Stovetop): Heat a grill pan over medium-high heat with a little oil. Place chicken pieces without overcrowding. Grill 5-7 minutes per side, until cooked through and charred."
            ]
        },
        {
            "section_title": "Preparing the Masala (Gravy)",
            "steps": [
                "Heat oil or butter in a large pan. Add bay leaf, cinnamon stick, cardamom pods, and cloves. Sauté until aromatic.",
                "Add onions; cook until golden. Stir in ginger garlic paste for 1 minute.",
                "Pour in tomato puree; cook until oil separates. Add red chili powder, garam masala, coriander, and cumin. Cook for a few minutes.",
                "Stir in cashew paste and cook briefly. Add water as needed for desired consistency.",
                "Add grilled chicken; simmer 5-7 minutes. Reduce heat and stir in heavy cream and crushed kasuri methi. Cook 2 more minutes.",
                "Garnish with fresh cilantro."
            ]
        },
        {
            "section_title": "Serving",
            "steps": [
                "Serve Chicken Tikka Masala hot with Basmati rice, naan, or roti."
            ]
        }
    ],
    "notes": [
        "Adjust spice levels to preference.",
        "For dairy-free, use plant-based yogurt and cream.",
        "Cashew paste adds creaminess; omit if nut-allergic and increase cream or use a substitute."
    ],
    "tags": ["Indian", "Chicken", "Masala", "Main Course", "Dinner"],
    "time_estimate": null
}
```

## How This Addresses Scaling

-   **servings**: We include a base number of servings (e.g., 4), indicating how many people the listed ingredient amounts will feed.
-   **Numeric quantity Fields**: Each ingredient's quantity is stored as a pure number, with a separate unit field (grams, cup, teaspoon, etc.).
-   **Scaling Logic**:
    -   If the user changes servings from 4 to 6, your app can multiply each ingredient's quantity by 6/4 = 1.5.
    -   The UI or AI logic can also handle rounding (e.g., 1.5 cups → 1 ½ cups).

## Additional Improvements

-   **Time Fields**: If the recipe provides prep, cook, or total time, you can add "prep_time", "cook_time", or "total_time" fields (in minutes or as a string like "30 mins").
-   **Nutrition**: If desired, include an object for nutritional info per serving (calories, protein, etc.).
-   **Optional Fields**: Some fields (e.g., notes) can be empty arrays if no notes are given.
