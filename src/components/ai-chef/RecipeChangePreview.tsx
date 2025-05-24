import { FC, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Divider,
    alpha,
    useTheme,
} from '@mui/material';
import IngredientsList from '../../pages/recipe/components/IngredientsList';
import TimeEstimate from '../../pages/recipe/components/TimeEstimate';
import RecipeNotes from '../../pages/recipe/components/RecipeNotes';
import CookingInstructions from '../../pages/recipe/components/CookingInstructions';
import { Recipe, Ingredient } from '../../types/recipe';
import { RecipeChanges } from './index';

interface RecipeChangePreviewProps {
    currentRecipe: Recipe;
    suggestedChanges: RecipeChanges;
}

// Helper function to merge the current recipe with suggested changes
const mergeRecipeWithChanges = (
    currentRecipe: Recipe,
    suggestedChanges: RecipeChanges
): Recipe => {
    // Create a deep copy of the current recipe
    const mergedRecipe = JSON.parse(JSON.stringify(currentRecipe)) as Recipe;

    // Apply each change from suggestedChanges to the merged recipe
    Object.entries(suggestedChanges).forEach(([key, value]) => {
        if (key === 'ingredients') {
            if (Object.prototype.hasOwnProperty.call(suggestedChanges, key)) {
                const newIngredientsList = Array.isArray(value) ? value : [];
                mergedRecipe.ingredients = JSON.parse(
                    JSON.stringify(newIngredientsList)
                );
            }
        } else if (key === 'instructions') {
            // If 'instructions' is a key in suggestedChanges, its value
            // dictates the new state of instructions for the merged recipe.
            // This handles additions, modifications, and removals implicitly.
            if (Object.prototype.hasOwnProperty.call(suggestedChanges, key)) {
                const newInstructions = Array.isArray(value) ? value : [];
                mergedRecipe.instructions = JSON.parse(
                    JSON.stringify(newInstructions)
                );
            }
        } else {
            // For other fields, type-safe update by converting to unknown first
            (mergedRecipe as unknown as Record<string, unknown>)[key] = value;
        }
    });

    return mergedRecipe;
};

// Helper function to calculate ingredients to display (added, modified, removed)
const calculateDisplayedIngredients = (
    currentIngredients: Ingredient[],
    suggestedResultingIngredients: Ingredient[] | undefined
): Array<Ingredient & { changeType: 'added' | 'modified' | 'removed' }> => {
    // If no 'ingredients' key was in suggestedChanges, or if it was an empty array when original was also empty.
    if (suggestedResultingIngredients === undefined) {
        return [];
    }

    // If suggested ingredients are identical to current ones, no changes to display.
    if (
        JSON.stringify(currentIngredients) ===
        JSON.stringify(suggestedResultingIngredients)
    ) {
        return [];
    }

    const displayed: Array<
        Ingredient & { changeType: 'added' | 'modified' | 'removed' }
    > = [];
    const currentMap = new Map(currentIngredients.map((ing) => [ing.id, ing]));
    const suggestedMap = new Map(
        suggestedResultingIngredients.map((ing) => [ing.id, ing])
    );

    // Identify added or modified ingredients
    suggestedResultingIngredients.forEach((suggIng) => {
        const currentIng = currentMap.get(suggIng.id);
        if (!currentIng) {
            displayed.push({ ...suggIng, changeType: 'added' });
        } else {
            if (JSON.stringify(currentIng) !== JSON.stringify(suggIng)) {
                displayed.push({ ...suggIng, changeType: 'modified' });
            }
            // If they are string-identical, they won't be added as 'modified'
            // and won't be caught by the 'removed' logic later, so they are effectively unchanged.
        }
    });

    // Identify removed ingredients
    currentIngredients.forEach((currIng) => {
        if (!suggestedMap.has(currIng.id)) {
            displayed.push({ ...currIng, changeType: 'removed' });
        }
    });

    return displayed;
};

const RecipeChangePreview: FC<RecipeChangePreviewProps> = ({
    currentRecipe,
    suggestedChanges,
}) => {
    const theme = useTheme();

    const previewRecipe = useMemo(() => {
        return mergeRecipeWithChanges(currentRecipe, suggestedChanges);
    }, [currentRecipe, suggestedChanges]);

    const ingredientsForListPreview = useMemo(() => {
        return calculateDisplayedIngredients(
            currentRecipe.ingredients,
            Object.prototype.hasOwnProperty.call(
                suggestedChanges,
                'ingredients'
            )
                ? suggestedChanges.ingredients
                : undefined
        );
    }, [currentRecipe.ingredients, suggestedChanges]);

    const hasInstructionChanges = useMemo(() => {
        if (
            !Object.prototype.hasOwnProperty.call(
                suggestedChanges,
                'instructions'
            )
        ) {
            return false; // No instruction suggestions provided
        }
        // If instructions are suggested, compare with current ones.
        // previewRecipe.instructions will reflect the AI's full suggestion due to merge logic.
        return (
            JSON.stringify(currentRecipe.instructions) !==
            JSON.stringify(previewRecipe.instructions)
        );
    }, [
        currentRecipe.instructions,
        previewRecipe.instructions,
        suggestedChanges,
    ]);

    const hasNotesChanges = useMemo(() => {
        if (!Object.prototype.hasOwnProperty.call(suggestedChanges, 'notes')) {
            return false; // No notes suggestions provided
        }
        // previewRecipe.notes will reflect the AI's full suggestion.
        return (
            JSON.stringify(currentRecipe.notes) !==
            JSON.stringify(previewRecipe.notes)
        );
    }, [currentRecipe.notes, previewRecipe.notes, suggestedChanges]);

    // Intentionally a no-op function for the preview where slider is disabled.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const NoopServingsChange = (_servings: number) => {
        return;
    };

    // Determine if any part of the preview has content to show
    const shouldShowTitleDescriptionTime =
        previewRecipe.title !== currentRecipe.title ||
        previewRecipe.description !== currentRecipe.description ||
        JSON.stringify(previewRecipe.time_estimate) !==
            JSON.stringify(currentRecipe.time_estimate);

    const shouldShowIngredients = ingredientsForListPreview.length > 0;
    const shouldShowInstructions =
        hasInstructionChanges &&
        previewRecipe.instructions &&
        previewRecipe.instructions.length > 0;
    const shouldShowNotes =
        hasNotesChanges &&
        previewRecipe.notes &&
        previewRecipe.notes.length > 0;

    // If no changes AT ALL are suggested for these sections, don't render the preview Paper.
    // We always show the main title/desc/time if they are part of suggestedChanges,
    // but this ensures if ONLY e.g. title changes, we still show the paper.
    // The RecipeChangePreview itself is only rendered if there are *any* suggestedChanges from the AI.
    // This check is more about not showing an empty-looking preview card.
    if (
        !shouldShowTitleDescriptionTime &&
        !shouldShowIngredients &&
        !shouldShowInstructions &&
        !shouldShowNotes &&
        // Also check if title/desc/time estimate were part of the original suggestion object,
        // even if they ended up being the same as currentRecipe
        !(
            Object.prototype.hasOwnProperty.call(suggestedChanges, 'title') ||
            Object.prototype.hasOwnProperty.call(
                suggestedChanges,
                'description'
            ) ||
            Object.prototype.hasOwnProperty.call(
                suggestedChanges,
                'time_estimate'
            )
        )
    ) {
        // If nothing visual changed in these core areas and they weren't even part of the suggestion,
        // it implies other non-visual fields might have changed or no impactful suggestions were made.
        // In this case, we might want to show a message or nothing, but for now, let's render an empty preview
        // or rely on the parent component not to render RecipeChangePreview at all if suggestedChanges is empty.
        // For now, this path will lead to rendering the paper but potentially with no sections.
        // A better approach would be for AiChatComponent not to show the preview action if suggestedChanges is empty or implies no visual change.
    }

    return (
        <Paper
            elevation={0}
            sx={{
                mt: 3,
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                boxShadow: `0 2px 8px ${alpha(
                    theme.palette.common.black,
                    0.05
                )}`,
                position: 'relative',
            }}
        >
            <Box sx={{ mb: 2 }}>
                <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                        mb: 1,
                        fontFamily: "'Kalam', cursive",
                    }}
                >
                    Recipe Preview
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    Here's how your recipe will look with the suggested changes:
                </Typography>
            </Box>

            {/* Title, Description, Time Estimate - Render if there are changes or if they are part of suggestions */}
            {(shouldShowTitleDescriptionTime ||
                Object.prototype.hasOwnProperty.call(
                    suggestedChanges,
                    'title'
                ) ||
                Object.prototype.hasOwnProperty.call(
                    suggestedChanges,
                    'description'
                ) ||
                Object.prototype.hasOwnProperty.call(
                    suggestedChanges,
                    'time_estimate'
                )) && (
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                            mb: 1,
                            fontFamily: "'Lato', 'Helvetica Neue', sans-serif",
                        }}
                    >
                        {previewRecipe.title}
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: theme.palette.text.secondary,
                            mb: 2,
                            fontFamily: "'Kalam', cursive",
                        }}
                    >
                        {previewRecipe.description}
                    </Typography>
                    {previewRecipe.time_estimate && (
                        <Box sx={{ mb: 2, maxWidth: 500 }}>
                            <TimeEstimate
                                timeEstimate={previewRecipe.time_estimate}
                            />
                        </Box>
                    )}
                </Box>
            )}

            {/* Ingredients List - Render only if there are actual ingredient changes */}
            {shouldShowIngredients && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 3 }}>
                        <Box>
                            <IngredientsList
                                recipe={previewRecipe}
                                servings={previewRecipe.servings}
                                onServingsChange={NoopServingsChange}
                                ingredientsToDisplay={ingredientsForListPreview}
                                isPreviewMode={true}
                            />
                        </Box>
                    </Box>
                </>
            )}

            {/* Cooking Instructions - Render only if there are instruction changes */}
            {shouldShowInstructions && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 3 }}>
                        <Box
                            sx={{
                                transformOrigin: 'top left',
                            }}
                        >
                            <CookingInstructions
                                recipe={previewRecipe}
                                servings={previewRecipe.servings}
                            />
                        </Box>
                    </Box>
                </>
            )}

            {/* Recipe Notes - Render only if there are note changes */}
            {shouldShowNotes && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                        <Box
                            sx={{
                                transformOrigin: 'top left',
                            }}
                        >
                            <RecipeNotes recipe={previewRecipe} />
                        </Box>
                    </Box>
                </>
            )}
        </Paper>
    );
};

export default RecipeChangePreview;
