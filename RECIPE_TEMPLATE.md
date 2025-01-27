# Recipe JSON Template

Below is a JSON template that accommodates scaling by explicitly tracking the base number of servings and storing ingredient amounts in a more structured format (numeric + unit). This way, if you decide to change how many people the recipe should serve, the application can apply the necessary math to update each ingredient amount accordingly. This is an example of the expected output from the AI after being given a url for a recipe.

```json
{
    "title": "Chicken Tikka Masala",
    "description": "A classic curried dish featuring tender chunks of char-grilled chicken...",
    "images": [],
    "servings": 4, // Base number of servings for the amounts listed below
    "ingredients": [
        {
            "id": "chicken",
            "name": "chicken breasts or thighs",
            "quantity": 500,
            "unit": "grams",
            "notes": "cut into 1-inch pieces"
        },
        {
            "id": "yogurt",
            "name": "plain yogurt",
            "quantity": 0.5,
            "unit": "cup"
        },
        {
            "id": "ginger_garlic",
            "name": "ginger garlic paste",
            "quantity": 1,
            "unit": "tablespoon"
        }
        // ... more ingredients
    ],
    "instructions": [
        {
            "section_title": "Marinating the Chicken",
            "steps": [
                "In a bowl, combine [INGREDIENT=chicken], [INGREDIENT=yogurt], and [INGREDIENT=ginger_garlic] along with spices to form a smooth marinade.",
                "Refrigerate for at least 1 hour."
            ]
        },
        {
            "section_title": "Grilling the Chicken",
            "steps": [
                "Option (Oven): Arrange [INGREDIENT=chicken] on a rack and bake at 240°C (460°F) for 15-20 minutes, turning once.",
                "Option (Stovetop): Heat oil in a grill pan and cook [INGREDIENT=chicken] 5-7 minutes per side."
            ]
        },
        {
            "section_title": "Masala (Gravy)",
            "steps": [
                "Heat oil or butter in a pan; sauté onions and spices until golden.",
                "Add tomato puree, then stir in cashew paste and simmer.",
                "Add [INGREDIENT=chicken] to the sauce. Cook for 5-7 minutes, then stir in cream."
            ]
        },
        {
            "section_title": "Serving",
            "steps": ["Serve hot with rice or naan."]
        }
    ],
    "notes": [
        "Adjust spice to taste.",
        "Use plant-based yogurt/cream for dairy-free."
    ],
    "tags": ["Indian", "Chicken", "Dinner"],
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
