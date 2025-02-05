import { FC } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Recipe } from '../../../../types';
import {
    parseIngredientReferences,
    scaleQuantity,
    formatQuantity,
} from '../../../../utils/recipe';
import HighlightedInstruction from '../../components/HighlightedInstruction';
import Timer from './Timer';

interface StepContentProps {
    recipe: Recipe;
    currentStep: number;
    currentSectionIndex: number;
    servings: number;
}

const StepContent: FC<StepContentProps> = ({
    recipe,
    currentStep,
    currentSectionIndex,
    servings,
}) => {
    const section = recipe.instructions[currentSectionIndex];
    const step = section.steps[currentStep];

    // Calculate the total step number by counting steps in previous sections
    const totalStepNumber =
        recipe.instructions
            .slice(0, currentSectionIndex)
            .reduce((acc, section) => acc + section.steps.length, 0) +
        currentStep +
        1;

    // Get ingredients needed for this step
    const ingredientMatches = step.text.match(/\[INGREDIENT=([^\]]+)\]/g) || [];
    const stepIngredients = ingredientMatches
        .map((match) => {
            const id = match.match(/\[INGREDIENT=([^\]]+)\]/)?.[1];
            return recipe.ingredients.find((ing) => ing.id === id);
        })
        .filter((ing): ing is Recipe['ingredients'][0] => ing !== undefined)
        .map((ingredient) => {
            const scaledQuantity = scaleQuantity(
                ingredient.quantity,
                recipe.servings,
                servings
            );

            return {
                ...ingredient,
                quantity: scaledQuantity,
            };
        });

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                px: { xs: 2, sm: 3 },
                py: { xs: 2, sm: 3 },
                mb: 10,
            }}
        >
            {/* Section Title */}
            {section.section_title && (
                <Typography
                    variant="h5"
                    sx={{
                        color: 'primary.main',
                        fontFamily: "'Kalam', cursive",
                        mb: 1,
                    }}
                >
                    {section.section_title}
                </Typography>
            )}

            {/* Step Content */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 1,
                    position: 'relative',
                    bgcolor: 'paper.main',
                    boxShadow: `
                        0 1px 2px rgba(0,0,0,0.03),
                        0 4px 20px rgba(0,0,0,0.06),
                        inset 0 0 0 1px rgba(255,255,255,0.9)
                    `,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: 'rgba(255,255,255,0.5)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: 1,
                        zIndex: 0,
                        border: '1px solid',
                        borderColor: 'divider',
                    },
                    '& > *': {
                        position: 'relative',
                        zIndex: 1,
                    },
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: { xs: 2, sm: 3 },
                        alignItems: 'flex-start',
                    }}
                >
                    <Typography
                        sx={{
                            color: 'primary.main',
                            fontFamily: "'Kalam', cursive",
                            fontSize: { xs: '1.25rem', sm: '1.5rem' },
                            fontWeight: 700,
                            lineHeight: 1.4,
                            minWidth: { xs: '24px', sm: '32px' },
                        }}
                    >
                        {totalStepNumber}.
                    </Typography>

                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="body1"
                            sx={{
                                fontSize: { xs: '1.125rem', sm: '1.25rem' },
                                lineHeight: 1.6,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            <HighlightedInstruction
                                text={parseIngredientReferences(
                                    step.text,
                                    recipe,
                                    servings
                                )}
                            />
                        </Typography>

                        {step.timing && (
                            <Box sx={{ mt: 2, maxWidth: 'sm' }}>
                                <Timer
                                    duration={step.timing.min}
                                    maxDuration={step.timing.max}
                                    units={step.timing.units}
                                    label={
                                        step.timing.min === step.timing.max
                                            ? `${step.timing.min} ${step.timing.units}`
                                            : `${step.timing.min}-${step.timing.max} ${step.timing.units}`
                                    }
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
            </Paper>

            {/* Ingredients for this step */}
            {stepIngredients.length > 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: 1,
                        position: 'relative',
                        bgcolor: 'secondary.light',
                        boxShadow: `
                            0 1px 2px rgba(0,0,0,0.03),
                            0 4px 20px rgba(0,0,0,0.06),
                            inset 0 0 0 1px rgba(255,255,255,0.9)
                        `,
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100%',
                            background: 'rgba(255,255,255,0.5)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: 1,
                            zIndex: 0,
                            border: '1px solid',
                            borderColor: 'divider',
                        },
                        '& > *': {
                            position: 'relative',
                            zIndex: 1,
                        },
                    }}
                >
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 600,
                            mb: 2,
                            color: 'primary.main',
                            fontFamily: "'Kalam', cursive",
                        }}
                    >
                        Ingredients Needed:
                    </Typography>
                    <Box
                        component="ul"
                        sx={{
                            m: 0,
                            p: 0,
                            listStyle: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        {stepIngredients.map((ingredient) => (
                            <Box
                                component="li"
                                key={ingredient.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: 1,
                                    fontSize: { xs: '1rem', sm: '1.125rem' },
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                <Typography
                                    component="span"
                                    sx={{
                                        fontWeight: 600,
                                        color: 'text.primary',
                                    }}
                                >
                                    {formatQuantity(ingredient.quantity)}{' '}
                                    {ingredient.unit}
                                </Typography>
                                <Typography
                                    component="span"
                                    sx={{ color: 'text.secondary' }}
                                >
                                    {ingredient.name}
                                    {ingredient.notes && (
                                        <Box
                                            component="span"
                                            sx={{
                                                color: 'text.secondary',
                                                ml: 1,
                                                fontSize: '0.85em',
                                            }}
                                        >
                                            ({ingredient.notes})
                                        </Box>
                                    )}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default StepContent;
