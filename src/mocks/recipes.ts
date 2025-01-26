import { Recipe } from '../types';

export const MOCK_RECIPES: Recipe[] = [
    {
        id: '1',
        title: 'Chicken Tikka Masala',
        description:
            'A classic curried dish featuring tender chunks of char-grilled chicken simmered in a flavorful and aromatic sauce.',
        images: [
            'https://www.recipetineats.com/tachyon/2018/04/Chicken-Tikka-Masala_0-SQ.jpg',
        ],
        servings: 4,
        ingredients: [
            {
                section_title: 'For the Chicken Marinade',
                items: [
                    {
                        name: 'chicken breasts or thighs',
                        quantity: 500,
                        unit: 'grams',
                        notes: 'cut into 1-inch pieces',
                    },
                    {
                        name: 'plain yogurt',
                        quantity: 0.5,
                        unit: 'cup',
                    },
                    {
                        name: 'ginger garlic paste',
                        quantity: 1,
                        unit: 'tablespoon',
                    },
                ],
            },
            {
                section_title: 'For the Masala (Gravy)',
                items: [
                    {
                        name: 'oil or butter',
                        quantity: 2,
                        unit: 'tablespoon',
                    },
                    {
                        name: 'onions',
                        quantity: 1,
                        unit: 'cup',
                        notes: 'finely chopped',
                    },
                    {
                        name: 'tomato puree',
                        quantity: 1.5,
                        unit: 'cup',
                        notes: 'fresh or canned',
                    },
                ],
            },
        ],
        instructions: [
            {
                section_title: 'Marinating the Chicken',
                steps: [
                    'In a mixing bowl, combine yogurt, ginger garlic paste, and spices to form a smooth marinade.',
                    'Add the chicken pieces, coat thoroughly, and refrigerate for at least 1 hour (preferably overnight).',
                ],
            },
            {
                section_title: 'Preparing the Masala',
                steps: [
                    'Heat oil in a large pan. Add onions and cook until golden.',
                    'Add tomato puree and spices. Simmer until oil separates.',
                    'Add marinated chicken and cook until done.',
                ],
            },
        ],
        notes: [
            'Adjust spice levels to preference',
            'For dairy-free, use coconut milk instead of cream',
        ],
        tags: ['Indian', 'Chicken', 'Curry', 'Main Course'],
        time_estimate: {
            prep: 30,
            cook: 45,
            total: 75,
        },
    },
    {
        id: '2',
        title: 'Best Street-Style Chicken Tacos',
        description:
            'Simple but delicious chicken tacos that taste like they came straight off a food truck. Made with flavorful chicken thighs and a fresh onion-cilantro topping.',
        images: [
            'https://www.blessthismessplease.com/wp-content/uploads/2019/09/chicken-taco-5-of-5.jpg',
        ],
        servings: 4,
        ingredients: [
            {
                section_title: 'For the Chicken',
                items: [
                    {
                        name: 'boneless skinless chicken thighs',
                        quantity: 454,
                        unit: 'grams',
                        notes: '1 pound',
                    },
                    {
                        name: 'garlic powder',
                        quantity: 1,
                        unit: 'teaspoon',
                    },
                    {
                        name: 'onion powder',
                        quantity: 0.5,
                        unit: 'teaspoon',
                    },
                    {
                        name: 'cumin',
                        quantity: 0.5,
                        unit: 'teaspoon',
                    },
                    {
                        name: 'smoked paprika',
                        quantity: 0.5,
                        unit: 'teaspoon',
                    },
                    {
                        name: 'chili powder',
                        quantity: 0.5,
                        unit: 'teaspoon',
                    },
                    {
                        name: 'salt',
                        quantity: 0.5,
                        unit: 'teaspoon',
                    },
                    {
                        name: 'black pepper',
                        quantity: 0.5,
                        unit: 'teaspoon',
                        notes: 'freshly ground',
                    },
                    {
                        name: 'lime juice',
                        quantity: 2,
                        unit: 'whole',
                        notes: 'about 4 tablespoons',
                    },
                    {
                        name: 'olive oil',
                        quantity: 1,
                        unit: 'tablespoon',
                    },
                ],
            },
            {
                section_title: 'For the Topping',
                items: [
                    {
                        name: 'red onion',
                        quantity: 0.33,
                        unit: 'cup',
                        notes: 'finely chopped',
                    },
                    {
                        name: 'fresh cilantro',
                        quantity: 0.33,
                        unit: 'cup',
                        notes: 'finely chopped',
                    },
                    {
                        name: 'jalapeño',
                        quantity: 1,
                        unit: 'whole',
                        notes: 'finely chopped',
                    },
                    {
                        name: 'lime juice',
                        quantity: 1,
                        unit: 'whole',
                        notes: 'for topping',
                    },
                    {
                        name: 'salt and pepper',
                        quantity: null,
                        unit: null,
                        notes: 'to taste',
                    },
                ],
            },
            {
                section_title: 'For Serving',
                items: [
                    {
                        name: 'corn tortillas',
                        quantity: 16,
                        unit: 'whole',
                        notes: 'small, doubled up for serving',
                    },
                    {
                        name: 'lime wedges',
                        quantity: 8,
                        unit: 'wedges',
                        notes: 'for serving',
                    },
                ],
            },
        ],
        instructions: [
            {
                section_title: 'Marinate the Chicken',
                steps: [
                    'In a large plastic bag or shallow dish, combine chicken with all spices, lime juice, and oil.',
                    'Mix everything together thoroughly and let rest for up to 30 minutes for best flavor.',
                ],
            },
            {
                section_title: 'Cook the Chicken',
                steps: [
                    'Heat a large skillet over medium to medium-high heat with oil.',
                    'Cook chicken for 12-14 minutes, turning once, until cooked through.',
                    'Let rest for 10 minutes, then chop into small pieces.',
                ],
            },
            {
                section_title: 'Prepare Toppings and Serve',
                steps: [
                    'While chicken cooks, combine chopped onion, cilantro, jalapeño, and lime juice. Season with salt and pepper.',
                    'Heat tortillas in a clean skillet until they start to char.',
                    'Assemble tacos with chopped chicken and onion-cilantro topping.',
                    'Serve with lime wedges for squeezing over top.',
                ],
            },
        ],
        notes: [
            'Use two tortillas per taco to prevent breaking and falling apart',
            'Remove jalapeño seeds for less heat or omit entirely',
            'Fresh lime juice at serving is essential for the best flavor',
            'Chicken thighs stay more moist than breasts and are more economical',
        ],
        tags: ['Mexican', 'Chicken', 'Tacos', 'Street Food', 'Main Course'],
        time_estimate: {
            prep: 10,
            cook: 20,
            total: 30,
        },
    },
];
