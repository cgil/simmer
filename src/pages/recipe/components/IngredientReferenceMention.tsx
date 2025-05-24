import { FC } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography, Tooltip } from '@mui/material';
import { Ingredient } from '../../../types/recipe';
import { formatIngredientDisplayText } from '../../../utils/ingredientDisplay';
import { SubstitutionState } from '../../../types/substitution';
import { alpha } from '@mui/material/styles';
import { scaleQuantity, formatQuantity } from '../../../utils/recipe';

interface IngredientReferenceMentionProps {
    ingredient?: Ingredient;
    id?: string;
    display: string;
    servings?: number;
    originalServings?: number;
    scaledQuantity?: number | null;
    hasSubstitution?: boolean;
    substitutionInfo?: SubstitutionState | null;
}

// Styling for the mention component (highlighted ingredient references)
// Identical styling to the IngredientReferenceInput component
const StyledMention = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.secondary.light || '#FFF9C4',
    borderRadius: '2px',
    padding: '0 4px',
    color: theme.palette.secondary.dark || '#9C6D00',
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 500,
    boxShadow: 'none',
    border: 'none',
    textShadow: 'none',
    wordBreak: 'break-word',
    fontFamily: '"Inter", "system-ui", "sans-serif"',
    fontSize: '16px',
    lineHeight: '1.6',
    letterSpacing: 'normal',
}));

// Style for deleted ingredients (when an ingredient is referenced but later deleted)
const DeletedMention = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.error.light || '#FFEBEE',
    borderRadius: '2px',
    padding: '0 4px',
    color: theme.palette.error.main,
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 500,
    opacity: 0.8,
    wordBreak: 'break-word',
    fontFamily: '"Inter", "system-ui", "sans-serif"',
    fontSize: '16px',
    lineHeight: '1.6',
    letterSpacing: 'normal',
}));

// Style for invalid references (non-UUID)
const InvalidReferenceMention = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.warning.light || '#FFF3E0',
    borderRadius: '2px',
    padding: '0 4px',
    color: theme.palette.warning.dark || '#E65100',
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 500,
    border: `1px dashed ${theme.palette.warning.main}`,
    wordBreak: 'break-word',
    fontFamily: '"Inter", "system-ui", "sans-serif"',
    fontSize: '16px',
    lineHeight: '1.6',
    letterSpacing: 'normal',
}));

// Style for substituted ingredients (with a distinctive style)
const SubstitutedMention = styled(Box)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.dark,
    borderRadius: '2px',
    padding: '0 4px',
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 500,
    boxShadow: 'none',
    textShadow: 'none',
    wordBreak: 'break-word',
    fontFamily: '"Inter", "system-ui", "sans-serif"',
    fontSize: '16px',
    lineHeight: '1.6',
    letterSpacing: 'normal',
}));

const IngredientReferenceMention: FC<IngredientReferenceMentionProps> = ({
    ingredient,
    id,
    display,
    servings,
    originalServings,
    scaledQuantity: providedScaledQuantity,
    hasSubstitution,
    substitutionInfo,
}) => {
    // If the ingredient doesn't exist but we have an ID
    if (!ingredient && id) {
        const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                id
            );

        // If it's not a UUID, show as invalid reference
        if (!isUuid) {
            return (
                <Tooltip
                    title={`Invalid ingredient reference format: ${id}. Should be a UUID.`}
                >
                    <InvalidReferenceMention>
                        <Typography
                            variant="body2"
                            component="span"
                            sx={{
                                fontFamily:
                                    '"Inter", "system-ui", "sans-serif"',
                                fontSize: '16px',
                                lineHeight: '1.6',
                                letterSpacing: 'normal',
                                fontWeight: 400,
                            }}
                        >
                            {display} (format error)
                        </Typography>
                    </InvalidReferenceMention>
                </Tooltip>
            );
        }

        // If it's a UUID but not found
        return (
            <Tooltip
                title={`"${display}" were removed from the ingredient list.`}
            >
                <DeletedMention>
                    <Typography
                        variant="body2"
                        component="span"
                        sx={{
                            fontFamily: '"Inter", "system-ui", "sans-serif"',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            letterSpacing: 'normal',
                            fontWeight: 400,
                        }}
                    >
                        {display} (removed)
                    </Typography>
                </DeletedMention>
            </Tooltip>
        );
    }

    // Handle substituted ingredients
    if (hasSubstitution && substitutionInfo) {
        let substituteDisplayText = '';
        let substituteDescription = '';

        // Single substitute case
        if (substitutionInfo.substituteOption.ingredients.length === 1) {
            const substitute = substitutionInfo.substituteOption.ingredients[0];

            // Scale the substitute quantity based on servings
            const scaledSubstituteQuantity =
                substitute.quantity !== null &&
                substitute.quantity !== undefined &&
                servings &&
                originalServings
                    ? scaleQuantity(
                          substitute.quantity,
                          originalServings,
                          servings
                      )
                    : substitute.quantity;

            // Format the single substitute with quantity and unit
            substituteDisplayText =
                scaledSubstituteQuantity !== null &&
                scaledSubstituteQuantity !== undefined
                    ? `${formatQuantity(scaledSubstituteQuantity)}${
                          substitute.unit ? ` ${substitute.unit} ` : ' '
                      }${substitute.name}`
                    : substitute.name;

            substituteDescription = '';
        }
        // Multi-ingredient substitute case
        else if (substitutionInfo.substituteOption.ingredients.length > 1) {
            const ingredients = substitutionInfo.substituteOption.ingredients;
            const instructions = substitutionInfo.substituteOption.instructions;

            // For multi-ingredient substitutes, list all ingredients with scaled quantities
            substituteDisplayText = ingredients
                .map((ing) => {
                    // Scale each ingredient quantity
                    const scaledIngQuantity =
                        ing.quantity !== null &&
                        ing.quantity !== undefined &&
                        servings &&
                        originalServings
                            ? scaleQuantity(
                                  ing.quantity,
                                  originalServings,
                                  servings
                              )
                            : ing.quantity;

                    return scaledIngQuantity !== null &&
                        scaledIngQuantity !== undefined
                        ? `${formatQuantity(scaledIngQuantity)}${
                              ing.unit ? ` ${ing.unit} ` : ' '
                          }${ing.name}`
                        : ing.name;
                })
                .join(', ');

            substituteDescription = instructions || '';
        }

        // Calculate scaled original ingredient quantity for tooltip
        const scaledOriginalQuantity =
            substitutionInfo.originalIngredient.quantity !== null &&
            substitutionInfo.originalIngredient.quantity !== undefined &&
            servings &&
            originalServings
                ? scaleQuantity(
                      substitutionInfo.originalIngredient.quantity,
                      originalServings,
                      servings
                  )
                : substitutionInfo.originalIngredient.quantity;

        // Format the original ingredient text for tooltip
        const originalIngredientText =
            scaledOriginalQuantity !== null &&
            scaledOriginalQuantity !== undefined
                ? `${formatQuantity(scaledOriginalQuantity)}${
                      substitutionInfo.originalIngredient.unit
                          ? ` ${substitutionInfo.originalIngredient.unit} `
                          : ' '
                  }${substitutionInfo.originalIngredient.name}`
                : substitutionInfo.originalIngredient.name;

        // Tooltip content for substitutions
        const tooltipContent = (
            <Typography
                variant="body2"
                sx={{
                    color: 'inherit',
                    fontFamily: '"Inter", "system-ui", "sans-serif"',
                }}
            >
                {originalIngredientText} → {substituteDisplayText}
                {substituteDescription && (
                    <Box
                        component="span"
                        sx={{
                            display: 'block',
                            fontStyle: 'italic',
                            mt: 0.5,
                            opacity: 0.8,
                            fontSize: '0.9em',
                        }}
                    >
                        {substituteDescription}
                    </Box>
                )}
            </Typography>
        );

        return (
            <Tooltip title={tooltipContent}>
                <SubstitutedMention>
                    <Typography
                        variant="body2"
                        component="span"
                        sx={{
                            fontFamily: '"Inter", "system-ui", "sans-serif"',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            letterSpacing: 'normal',
                            fontWeight: 400,
                        }}
                    >
                        {substituteDisplayText}
                    </Typography>
                </SubstitutedMention>
            </Tooltip>
        );
    }

    // When ingredient is available, always show with quantity and units if possible
    let displayText = display;

    if (ingredient) {
        // Use provided scaledQuantity from the mention if available, otherwise calculate it
        let scaledQuantity = providedScaledQuantity;
        if (
            scaledQuantity === undefined &&
            ingredient.quantity !== null &&
            ingredient.quantity !== undefined &&
            servings &&
            originalServings
        ) {
            scaledQuantity =
                (ingredient.quantity * servings) / originalServings;
        }

        // Format the display text with quantity and units
        displayText = formatIngredientDisplayText(ingredient, scaledQuantity);
    }

    return (
        <Tooltip
            title={
                ingredient
                    ? `${ingredient.name}${
                          ingredient.notes ? ` (${ingredient.notes})` : ''
                      }`
                    : ''
            }
        >
            <StyledMention>
                <Typography
                    variant="body2"
                    component="span"
                    sx={{
                        fontFamily: '"Inter", "system-ui", "sans-serif"',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        letterSpacing: 'normal',
                        fontWeight: 400,
                    }}
                >
                    {displayText}
                </Typography>
            </StyledMention>
        </Tooltip>
    );
};

export default IngredientReferenceMention;
