import { Recipe } from '../types';

export const MOCK_RECIPES: Recipe[] = [
    {
        id: 'chicken-tikka-masala',
        title: 'Chicken Tikka Masala',
        description:
            'A classic curried dish featuring marinated chicken pieces in a fragrant, creamy tomato sauce.',
        images: [
            'https://www.recipetineats.com/tachyon/2018/04/Chicken-Tikka-Masala_0-SQ.jpg',
            'https://s23209.pcdn.co/wp-content/uploads/2019/02/Easy-Chicken-Tikka-MasalaIMG_8253.jpg',
            'https://c.ndtvimg.com/2022-07/33meqsb_chicken-tikka_625x300_08_July_22.png',
        ],
        servings: 4,
        ingredients: [
            {
                id: 'chicken',
                name: 'boneless chicken thighs',
                quantity: 500,
                unit: 'grams',
                notes: 'cut into bite-sized pieces',
            },
            {
                id: 'yogurt',
                name: 'plain yogurt',
                quantity: 0.5,
                unit: 'cup',
                notes: null,
            },
            {
                id: 'ginger_garlic',
                name: 'ginger garlic paste',
                quantity: 1,
                unit: 'tablespoon',
                notes: null,
            },
            {
                id: 'masala_spices',
                name: 'masala spice mix',
                quantity: 1,
                unit: 'tablespoon',
                notes: 'includes chili powder, turmeric, cumin, coriander',
            },
            {
                id: 'cream',
                name: 'heavy cream',
                quantity: 0.5,
                unit: 'cup',
                notes: null,
            },
            {
                id: 'tomato_puree',
                name: 'tomato puree',
                quantity: 1.5,
                unit: 'cup',
                notes: null,
            },
            {
                id: 'oil',
                name: 'cooking oil',
                quantity: 2,
                unit: 'tablespoon',
                notes: null,
            },
            {
                id: 'salt',
                name: 'salt',
                quantity: null,
                unit: null,
                notes: 'to taste',
            },
        ],
        instructions: [
            {
                section_title: 'Marinating the Chicken',
                steps: [
                    {
                        text: 'In a bowl, combine [INGREDIENT=chicken], [INGREDIENT=yogurt], [INGREDIENT=ginger_garlic], and [INGREDIENT=masala_spices] with a pinch of [INGREDIENT=salt].',
                        timing: null, // No specific time aside from marinade time below
                    },
                    {
                        text: 'Cover and refrigerate for at least 1 hour (overnight for best results).',
                        // We'll treat 1 hour (60 min) as min, and "overnight" as a max of 720 min (12 hours) if desired.
                        timing: { min: 60, max: 720, units: 'minutes' },
                    },
                ],
            },
            {
                section_title: 'Cooking the Chicken',
                steps: [
                    {
                        text: 'Heat [INGREDIENT=oil] in a skillet over medium-high heat.',
                        timing: null,
                    },
                    {
                        text: 'Add the marinated [INGREDIENT=chicken] and cook until lightly browned on all sides.',
                        // Approximate time can be 5-7 minutes total for browning.
                        timing: { min: 5, max: 7, units: 'minutes' },
                    },
                ],
            },
            {
                section_title: 'Making the Sauce',
                steps: [
                    {
                        text: 'Stir in [INGREDIENT=tomato_puree] and let it simmer for about 5 minutes.',
                        timing: { min: 5, max: 5, units: 'minutes' },
                    },
                    {
                        text: 'Reduce heat to low, then add [INGREDIENT=cream].',
                        timing: null,
                    },
                    {
                        text: 'Season with [INGREDIENT=salt] if needed, and simmer until the chicken is fully cooked.',
                        timing: null, // No explicit time
                    },
                ],
            },
            {
                section_title: 'Serving',
                steps: [
                    {
                        text: 'Serve hot with rice or naan.',
                        timing: null,
                    },
                ],
            },
        ],
        notes: [
            'For a lighter version, use half-and-half instead of cream.',
            'Adjust chili powder in the spice mix if you prefer more heat.',
        ],
        tags: ['Indian', 'Chicken', 'Dinner', 'Curry'],
        time_estimate: {
            prep: 30,
            cook: 30,
            total: 60,
        },
    },
    {
        id: 'chicken-tacos',
        title: 'Chicken Tacos',
        description:
            'Easy chicken tacos with a zesty marinade, crisp toppings, and soft tortillas.',
        images: [
            'https://littlechefwithin.com/wp-content/uploads/2024/01/Shredded-Chicken-Tacos-Little-Chef-Within.jpg',
        ],
        servings: 3,
        ingredients: [
            {
                id: 'chicken',
                name: 'chicken breast',
                quantity: 300,
                unit: 'grams',
                notes: 'sliced into strips',
            },
            {
                id: 'taco_seasoning',
                name: 'taco seasoning',
                quantity: 1,
                unit: 'tablespoon',
                notes: null,
            },
            {
                id: 'lime_juice',
                name: 'lime juice',
                quantity: 1,
                unit: 'tablespoon',
                notes: null,
            },
            {
                id: 'salt',
                name: 'salt',
                quantity: null,
                unit: null,
                notes: 'to taste',
            },
            {
                id: 'oil',
                name: 'vegetable oil',
                quantity: 1,
                unit: 'tablespoon',
                notes: null,
            },
            {
                id: 'tortillas',
                name: 'small flour tortillas',
                quantity: 6,
                unit: 'piece',
                notes: null,
            },
            {
                id: 'lettuce',
                name: 'shredded lettuce',
                quantity: 1,
                unit: 'cup',
                notes: null,
            },
            {
                id: 'cheese',
                name: 'shredded cheese',
                quantity: 0.5,
                unit: 'cup',
                notes: 'cheddar or Mexican blend',
            },
            {
                id: 'salsa',
                name: 'salsa',
                quantity: 0.5,
                unit: 'cup',
                notes: 'mild or spicy',
            },
        ],
        instructions: [
            {
                section_title: 'Marinating the Chicken',
                steps: [
                    {
                        text: 'In a bowl, mix [INGREDIENT=chicken] with [INGREDIENT=taco_seasoning], [INGREDIENT=lime_juice], and a pinch of [INGREDIENT=salt].',
                        timing: null,
                    },
                    {
                        text: 'Let it sit for 15 minutes to absorb flavors.',
                        timing: { min: 15, max: 15, units: 'minutes' },
                    },
                ],
            },
            {
                section_title: 'Cooking the Chicken',
                steps: [
                    {
                        text: 'Heat [INGREDIENT=oil] in a pan over medium-high heat.',
                        timing: null,
                    },
                    {
                        text: 'Add [INGREDIENT=chicken] and cook until browned and fully done, about 5-7 minutes.',
                        timing: { min: 5, max: 7, units: 'minutes' },
                    },
                ],
            },
            {
                section_title: 'Assembling Tacos',
                steps: [
                    {
                        text: 'Warm [INGREDIENT=tortillas] in a microwave or on a skillet.',
                        timing: null,
                    },
                    {
                        text: 'Fill each tortilla with cooked [INGREDIENT=chicken], [INGREDIENT=lettuce], [INGREDIENT=cheese], and top with [INGREDIENT=salsa].',
                        timing: null,
                    },
                ],
            },
        ],
        notes: [
            'Add guacamole or sour cream if desired.',
            'For extra spice, include sliced jalapeños or hot sauce.',
        ],
        tags: ['Mexican', 'Chicken', 'Tacos', 'Lunch', 'Dinner'],
        time_estimate: {
            prep: 20,
            cook: 10,
            total: 30,
        },
    },
    {
        id: 'salmon-pesto-pasta',
        title: 'Salmon & Broccoli Pesto Pasta',
        description:
            'A light and fresh pasta dish with flaky salmon, broccoli florets, and a flavorful pesto sauce.',
        images: [
            'https://herculeanmealprep.com/cdn/shop/products/SalmonPestoPasta.jpg?v=1666149521',
            'https://fedandfit.com/wp-content/uploads/2022/02/230125_salmon-pesto-pasta-23.jpg',
        ],
        servings: 2,
        ingredients: [
            {
                id: 'salmon',
                name: 'salmon fillet',
                quantity: 200,
                unit: 'grams',
                notes: 'skinless, cut into chunks',
            },
            {
                id: 'broccoli',
                name: 'broccoli florets',
                quantity: 1,
                unit: 'cup',
                notes: 'rinsed',
            },
            {
                id: 'pasta',
                name: 'penne pasta',
                quantity: 150,
                unit: 'grams',
                notes: null,
            },
            {
                id: 'pesto',
                name: 'pesto sauce',
                quantity: 0.25,
                unit: 'cup',
                notes: 'basil-based',
            },
            {
                id: 'olive_oil',
                name: 'olive oil',
                quantity: 1,
                unit: 'tablespoon',
                notes: null,
            },
            {
                id: 'salt',
                name: 'salt',
                quantity: null,
                unit: null,
                notes: 'to taste',
            },
            {
                id: 'pepper',
                name: 'black pepper',
                quantity: null,
                unit: null,
                notes: 'to taste',
            },
        ],
        instructions: [
            {
                section_title: 'Cooking the Pasta & Broccoli',
                steps: [
                    {
                        text: 'Boil water in a large pot with a pinch of [INGREDIENT=salt].',
                        timing: null,
                    },
                    {
                        text: 'Add [INGREDIENT=pasta] and cook according to package directions.',
                        timing: null,
                    },
                    {
                        text: 'During the last 2 minutes, add [INGREDIENT=broccoli] florets to the same pot.',
                        timing: { min: 2, max: 2, units: 'minutes' },
                    },
                ],
            },
            {
                section_title: 'Cooking the Salmon',
                steps: [
                    {
                        text: 'Meanwhile, heat [INGREDIENT=olive_oil] in a pan over medium heat.',
                        timing: null,
                    },
                    {
                        text: 'Season [INGREDIENT=salmon] with [INGREDIENT=salt] and [INGREDIENT=pepper].',
                        timing: null,
                    },
                    {
                        text: "Cook salmon pieces until they're lightly browned and opaque, about 3-4 minutes per side.",
                        timing: { min: 3, max: 4, units: 'minutes' },
                    },
                ],
            },
            {
                section_title: 'Combining & Serving',
                steps: [
                    {
                        text: 'Drain the pasta and [INGREDIENT=broccoli], then return them to the pot.',
                        timing: null,
                    },
                    {
                        text: 'Add [INGREDIENT=salmon] and [INGREDIENT=pesto]. Toss gently to coat everything in the sauce.',
                        timing: null,
                    },
                    {
                        text: 'Adjust seasoning with [INGREDIENT=salt] and [INGREDIENT=pepper] if needed.',
                        timing: null,
                    },
                ],
            },
        ],
        notes: [
            'Use whole-wheat pasta for a healthier version.',
            'Substitute chicken or shrimp if you prefer.',
        ],
        tags: ['Pasta', 'Seafood', 'Salmon', 'Lunch', 'Dinner'],
        time_estimate: {
            prep: 15,
            cook: 10,
            total: 25,
        },
    },
];
