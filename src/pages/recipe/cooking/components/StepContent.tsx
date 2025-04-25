import { FC } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Recipe } from '../../../../types';
import { scaleQuantity } from '../../../../utils/recipe';
import HighlightedInstruction from '../../components/HighlightedInstruction';
import Timer from './Timer';
import { parseIngredientMentions } from '../../../../utils/ingredientMentions';
import { useIngredientSubstitution } from '../../../../components/substitution/IngredientSubstitutionContext';
import { SubstitutionState, Substitute } from '../../../../types/substitution';
import IngredientItemWithSubstitutionCookingMode from './IngredientItemWithSubstitutionCookingMode';

interface StepContentProps {
    recipe: Recipe;
    currentStep: number;
    currentSectionIndex: number;
    servings: number;
    activeTimers: Array<{
        sectionIndex: number;
        stepIndex: number;
        startTime: number;
        duration: number;
        isRunning: boolean;
        hasFinished: boolean;
        pausedAt: number | null;
        totalPausedTime: number;
    }>;
    onStartTimer: (
        sectionIndex: number,
        stepIndex: number,
        duration: number
    ) => void;
    onPauseTimer: (sectionIndex: number, stepIndex: number) => void;
    onResumeTimer: (sectionIndex: number, stepIndex: number) => void;
    onResetTimer: (sectionIndex: number, stepIndex: number) => void;
}

const StepContent: FC<StepContentProps> = ({
    recipe,
    currentStep,
    currentSectionIndex,
    servings,
    activeTimers,
    onStartTimer,
    onPauseTimer,
    onResumeTimer,
    onResetTimer,
}) => {
    const section = recipe.instructions[currentSectionIndex];
    const step = section.steps[currentStep];
    const { substitutions } = useIngredientSubstitution();

    // Calculate the total step number by counting steps in previous sections
    const totalStepNumber =
        recipe.instructions
            .slice(0, currentSectionIndex)
            .reduce((acc, section) => acc + section.steps.length, 0) +
        currentStep +
        1;

    // Parse the step text to find ingredient mentions
    const segments = parseIngredientMentions(
        step.text,
        recipe.ingredients,
        servings,
        recipe.servings,
        substitutions
    );

    // Extract ingredient IDs from the mentions, accounting for substitutions
    const stepIngredients = segments
        .filter(
            (
                segment
            ): segment is {
                id: string;
                display: string;
                ingredient?: Recipe['ingredients'][0];
                hasSubstitution?: boolean;
                substitutionInfo?: SubstitutionState;
            } => typeof segment !== 'string' && Boolean(segment.id)
        )
        .map((mention) => {
            // Check if this ingredient has a substitution
            if (mention.hasSubstitution && mention.substitutionInfo) {
                // For single ingredient substitute
                if (
                    mention.substitutionInfo.substituteOption.ingredients
                        .length === 1
                ) {
                    const substitute =
                        mention.substitutionInfo.substituteOption
                            .ingredients[0];

                    // Scale the substitute quantity based on servings
                    const scaledQuantity = scaleQuantity(
                        substitute.quantity !== undefined
                            ? substitute.quantity
                            : null,
                        recipe.servings,
                        servings
                    );

                    return {
                        id: `subst-${mention.id}`,
                        name: substitute.name,
                        quantity: scaledQuantity,
                        unit: substitute.unit,
                        notes: null,
                        isSubstituted: true,
                        originalIngredient: {
                            ...mention.substitutionInfo.originalIngredient,
                            // Scale the original ingredient quantity too
                            quantity: scaleQuantity(
                                mention.substitutionInfo.originalIngredient
                                    .quantity !== undefined
                                    ? mention.substitutionInfo
                                          .originalIngredient.quantity
                                    : null,
                                recipe.servings,
                                servings
                            ),
                        },
                    };
                }
                // For multi-ingredient substitutes
                else if (
                    mention.substitutionInfo.substituteOption.ingredients
                        .length > 1
                ) {
                    const ingredients =
                        mention.substitutionInfo.substituteOption.ingredients;
                    const instructions =
                        mention.substitutionInfo.substituteOption.instructions;

                    // Scale each ingredient in multi-substitute
                    const scaledMultiIngredients = ingredients.map(
                        (ing: Substitute) => ({
                            ...ing,
                            quantity: scaleQuantity(
                                ing.quantity !== undefined
                                    ? ing.quantity
                                    : null,
                                recipe.servings,
                                servings
                            ),
                        })
                    );

                    // Generate a special ingredient object for UI display
                    return {
                        id: `multi-subst-${mention.id}`,
                        name: 'Multiple ingredients',
                        quantity: null,
                        unit: null,
                        notes: 'See below',
                        isSubstituted: true,
                        originalIngredient: {
                            ...mention.substitutionInfo.originalIngredient,
                            // Scale the original ingredient quantity too
                            quantity: scaleQuantity(
                                mention.substitutionInfo.originalIngredient
                                    .quantity !== undefined
                                    ? mention.substitutionInfo
                                          .originalIngredient.quantity
                                    : null,
                                recipe.servings,
                                servings
                            ),
                        },
                        multiIngredients: scaledMultiIngredients,
                        instructions: instructions,
                    };
                }
            }

            // When there's no substitution or a regular ingredient
            if (mention.ingredient) {
                // Scale the ingredient quantity based on servings
                const scaledQuantity = scaleQuantity(
                    mention.ingredient.quantity,
                    recipe.servings,
                    servings
                );

                return {
                    ...mention.ingredient,
                    quantity: scaledQuantity,
                };
            }

            // Fallback for incomplete ingredient data
            return {
                id: mention.id,
                name: mention.display,
                quantity: null,
                unit: null,
            };
        });

    // Find active timer for current step
    const activeTimer = activeTimers.find(
        (timer) =>
            timer.sectionIndex === currentSectionIndex &&
            timer.stepIndex === currentStep
    );

    return (
        <Box
            sx={{
                p: { xs: 2, sm: 3 },
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
            }}
        >
            {/* Step content */}
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
                            component="div"
                            sx={{
                                fontSize: { xs: '1.125rem', sm: '1.25rem' },
                                lineHeight: 1.6,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            <HighlightedInstruction
                                text={step.text}
                                ingredients={recipe.ingredients}
                                servings={servings}
                                originalServings={recipe.servings}
                            />
                        </Typography>

                        {/* Timer */}
                        {step.timing && step.timing.min > 0 && (
                            <Box
                                sx={{
                                    mt: 2,
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                <Timer
                                    duration={step.timing.min}
                                    maxDuration={step.timing.max}
                                    units={step.timing.units}
                                    label={
                                        step.timing.min === step.timing.max
                                            ? `${step.timing.min} ${step.timing.units}`
                                            : `${step.timing.min}-${step.timing.max} ${step.timing.units}`
                                    }
                                    activeTimer={activeTimer}
                                    onStart={(duration) =>
                                        onStartTimer(
                                            currentSectionIndex,
                                            currentStep,
                                            duration
                                        )
                                    }
                                    onPause={() =>
                                        onPauseTimer(
                                            currentSectionIndex,
                                            currentStep
                                        )
                                    }
                                    onResume={() =>
                                        onResumeTimer(
                                            currentSectionIndex,
                                            currentStep
                                        )
                                    }
                                    onReset={() =>
                                        onResetTimer(
                                            currentSectionIndex,
                                            currentStep
                                        )
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
                            <Box component="li" key={ingredient.id}>
                                <IngredientItemWithSubstitutionCookingMode
                                    id={
                                        ingredient.id.startsWith('subst-')
                                            ? ingredient.id.substring(6)
                                            : ingredient.id
                                    }
                                    name={ingredient.name}
                                    quantity={ingredient.quantity}
                                    unit={ingredient.unit}
                                    originalServings={recipe.servings}
                                    currentServings={servings}
                                    notes={
                                        ingredient.notes as string | undefined
                                    }
                                    multiIngredients={
                                        ingredient.multiIngredients
                                    }
                                    instructions={
                                        ingredient.instructions ?? undefined
                                    }
                                    isSubstituted={ingredient.isSubstituted}
                                    originalIngredient={
                                        ingredient.originalIngredient
                                    }
                                />
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default StepContent;
