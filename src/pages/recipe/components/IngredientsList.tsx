// src/pages/recipe/components/IngredientsList.tsx
// This component displays the list of ingredients for a recipe, allowing users to adjust servings.
// It can also display a specific list of ingredients (e.g., for showing changes in a preview).
// It's styled as a floating card with a modern magazine aesthetic for the recipe page redesign.

import { FC } from 'react';
import { Box, Typography, Paper, Slider, Stack, useTheme } from '@mui/material';
import { Recipe, Ingredient } from '../../../types';
import IngredientItemWithSubstitution from '../../../components/substitution/IngredientItemWithSubstitution';
import { useIngredientSubstitution } from '../../../components/substitution/IngredientSubstitutionContext';
import { SubstituteOption } from '../../../types/substitution';

interface IngredientsListProps {
    recipe: Recipe;
    servings: number;
    onServingsChange: (servings: number) => void;
    ingredientsToDisplay?: Array<
        Ingredient & { changeType: 'added' | 'modified' | 'removed' }
    >;
    isPreviewMode?: boolean;
}

const IngredientsList: FC<IngredientsListProps> = ({
    recipe,
    servings,
    onServingsChange,
    ingredientsToDisplay,
    isPreviewMode = false,
}) => {
    const theme = useTheme();
    const {
        addSubstitution,
        removeSubstitution,
        hasSubstitution,
        getSubstituteInfo,
        getOriginalIngredient,
    } = useIngredientSubstitution();

    const handleServingsChange = (_event: Event, value: number | number[]) => {
        onServingsChange(value as number);
    };

    const handleSubstitute = (
        ingredientId: string,
        substituteOption: SubstituteOption
    ) => {
        const originalIngredient = recipe.ingredients.find(
            (i) => i.id === ingredientId
        );
        if (originalIngredient) {
            addSubstitution(ingredientId, originalIngredient, substituteOption);
        }
    };

    const handleRevertSubstitution = (ingredientId: string) => {
        removeSubstitution(ingredientId);
    };

    const defaultServings = recipe.servings || 4;
    const maxServings = defaultServings >= 6 ? defaultServings * 2 : 10;

    const generateMarks = () => {
        const marks = [];
        if (maxServings <= 10) {
            for (let i = 1; i <= maxServings; i++) {
                marks.push({ value: i, label: i.toString() });
            }
            return marks;
        }
        marks.push({ value: 1, label: '1' });
        const interval =
            maxServings <= 20 ? 2 : Math.ceil(maxServings / 10) * 2;
        for (let i = interval; i <= maxServings; i += interval) {
            marks.push({ value: i, label: i.toString() });
        }
        if (
            !marks.some((mark) => mark.value === defaultServings) &&
            defaultServings > 1
        ) {
            marks.push({
                value: defaultServings,
                label: defaultServings.toString(),
            });
        }
        if (!marks.some((mark) => mark.value === maxServings)) {
            marks.push({ value: maxServings, label: maxServings.toString() });
        }
        return marks.sort((a, b) => a.value - b.value);
    };

    const cardSx = {
        p: { xs: 2.5, sm: 3 },
        height: '100%',
        borderRadius: theme.shape.borderRadius * 2,
        bgcolor: 'background.paper',
        boxShadow: '0px 8px 24px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
    };

    const ingredientsSource = ingredientsToDisplay
        ? ingredientsToDisplay
        : recipe.ingredients;

    if (!ingredientsSource || ingredientsSource.length === 0) {
        let message = 'No ingredients available for this recipe.';
        if (ingredientsToDisplay && ingredientsToDisplay.length === 0) {
            message = 'No changes to ingredients.';
        }
        return (
            <Paper sx={cardSx}>
                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        fontWeight: 700,
                        color: 'primary.main',
                        mb: 2,
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        fontFamily: "'Kalam', cursive",
                    }}
                >
                    Ingredients
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                >
                    {message}
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={cardSx}>
            <Stack spacing={3} sx={{ flexGrow: 1 }}>
                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        fontWeight: 700,
                        color: 'primary.main',
                        fontSize: { xs: '1.4rem', sm: '1.7rem' },
                        fontFamily: "'Kalam', cursive",
                        textAlign: 'left',
                        mb: 3.5,
                        position: 'relative',
                        display: 'inline-block',
                        pb: 1.5,
                        '&:after': {
                            content: '""',
                            position: 'absolute',
                            left: 2,
                            bottom: 2,
                            width: '100%',
                            height: '8px',
                            background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='8' viewBox='0 0 80 8' fill='none'%3E%3Cpath d='M1,4 C25,1 55,1 79,4 L79,4.5 C55,2 25,2.5 1,6 Z' fill='${encodeURIComponent(
                                theme.palette.primary.main
                            )}'/%3E%3C/svg%3E") no-repeat bottom left`,
                            backgroundSize: 'contain',
                        },
                    }}
                >
                    Ingredients
                </Typography>

                <Box sx={{ px: { xs: 0, sm: 1 } }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                            flexWrap: 'wrap',
                            gap: 1,
                        }}
                    >
                        <Typography
                            id="servings-slider-label"
                            sx={{
                                color: 'text.secondary',
                                fontWeight: 500,
                                fontSize: { xs: '1rem', sm: '1rem' },
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Servings:
                        </Typography>
                        <Typography
                            variant="body1"
                            aria-live="polite"
                            sx={{
                                fontWeight: 600,
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                px: 2,
                                py: 0.5,
                                borderRadius: '8px',
                                minWidth: 40,
                                textAlign: 'center',
                                boxShadow: theme.shadows[1],
                                fontSize: { xs: '1rem', sm: '1.05rem' },
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {servings}
                        </Typography>
                    </Box>
                    <Slider
                        value={servings}
                        onChange={handleServingsChange}
                        aria-labelledby="servings-slider-label"
                        step={1}
                        marks={generateMarks()}
                        min={1}
                        max={maxServings}
                        valueLabelDisplay="off"
                        disabled={isPreviewMode}
                        sx={{
                            color: 'primary.main',
                            height: { xs: 6, sm: 8 },
                            '& .MuiSlider-thumb': {
                                width: { xs: 16, sm: 20 },
                                height: { xs: 16, sm: 20 },
                                backgroundColor: 'primary.main',
                                border: `2px solid ${theme.palette.common.white}`,
                                '&:hover, &.Mui-focusVisible': {
                                    boxShadow: `0px 0px 0px 8px ${theme.palette.action.hover}`,
                                },
                                '&.Mui-active': {
                                    boxShadow: `0px 0px 0px 14px ${theme.palette.action.hover}`,
                                },
                            },
                            '& .MuiSlider-track': {
                                height: { xs: 6, sm: 8 },
                                borderRadius: 4,
                            },
                            '& .MuiSlider-rail': {
                                height: { xs: 6, sm: 8 },
                                borderRadius: 4,
                                opacity: 0.3,
                            },
                            '& .MuiSlider-markLabel': {
                                fontFamily: "'Inter', sans-serif",
                                fontSize: { xs: '0.875rem', sm: '0.9rem' },
                                color: 'text.secondary',
                            },
                            mb: 1,
                        }}
                    />
                </Box>

                <Box
                    component="ul"
                    sx={{
                        listStyle: 'none',
                        p: 0,
                        m: 0,
                        flexGrow: 1,
                        overflowY: 'auto',
                        width: '100%',
                    }}
                >
                    {ingredientsSource.map((ingredient, index: number) => {
                        const isSubstituted = hasSubstitution(ingredient.id);
                        const currentSubstituteInfo =
                            getSubstituteInfo(ingredient.id) || undefined;
                        const currentOriginalIngredient =
                            getOriginalIngredient(ingredient.id) || undefined;
                        const changeType =
                            'changeType' in ingredient
                                ? (
                                      ingredient as Ingredient & {
                                          changeType:
                                              | 'added'
                                              | 'modified'
                                              | 'removed';
                                      }
                                  ).changeType
                                : undefined;

                        return (
                            <Box
                                component="li"
                                key={ingredient.id || index}
                                sx={{
                                    py: { xs: 1.2, sm: 1.5 },
                                    borderBottom:
                                        index === ingredientsSource.length - 1
                                            ? 'none'
                                            : `1px solid ${theme.palette.divider}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                }}
                            >
                                <Box sx={{ width: '100%' }}>
                                    <IngredientItemWithSubstitution
                                        id={ingredient.id}
                                        name={ingredient.name}
                                        quantity={ingredient.quantity}
                                        unit={ingredient.unit}
                                        originalServings={recipe.servings || 2}
                                        currentServings={servings}
                                        isSubstituted={isSubstituted}
                                        onSubstitute={handleSubstitute}
                                        onRevertSubstitution={
                                            handleRevertSubstitution
                                        }
                                        substituteInfo={currentSubstituteInfo}
                                        originalIngredient={
                                            currentOriginalIngredient
                                                ? {
                                                      name: currentOriginalIngredient.name,
                                                      quantity:
                                                          currentOriginalIngredient.quantity,
                                                      unit: currentOriginalIngredient.unit,
                                                  }
                                                : undefined
                                        }
                                        changeType={changeType}
                                        isPreviewMode={isPreviewMode}
                                    />
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Stack>
        </Paper>
    );
};

export default IngredientsList;
