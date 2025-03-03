import { FC } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography, Tooltip } from '@mui/material';
import { Ingredient } from '../../../types/recipe';
import { formatQuantity } from '../../../utils/recipe';

interface IngredientReferenceMentionProps {
    ingredient?: Ingredient;
    id?: string;
    display: string;
    servings?: number;
    originalServings?: number;
    scaledQuantity?: number | null;
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

/**
 * Formats an ingredient display text including quantity and units when available
 */
export const formatIngredientDisplayText = (
    ingredient: Ingredient,
    scaledQuantity?: number | null
): string => {
    const quantity =
        scaledQuantity !== undefined ? scaledQuantity : ingredient.quantity;

    if (quantity !== null && quantity !== undefined) {
        return `${formatQuantity(quantity)}${
            ingredient.unit && ingredient.unit.trim()
                ? ' ' + ingredient.unit
                : ''
        } ${ingredient.name}`;
    }

    return ingredient.name;
};

const IngredientReferenceMention: FC<IngredientReferenceMentionProps> = ({
    ingredient,
    id,
    display,
    servings,
    originalServings,
    scaledQuantity: providedScaledQuantity,
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
                title={`Ingredient with ID "${id}" not found. It may have been deleted or renamed.`}
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
                        {display} (not found)
                    </Typography>
                </DeletedMention>
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
