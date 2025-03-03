import React, { FC } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import { Box, Typography, useTheme } from '@mui/material';
import { Ingredient } from '../../../types/recipe';

// Extend SuggestionDataItem type to include our ingredient data
declare module 'react-mentions' {
    interface SuggestionDataItem {
        ingredient?: Ingredient;
    }
}

interface IngredientReferenceInputProps {
    value: string;
    onChange: (value: string) => void;
    ingredients: Ingredient[];
    placeholder?: string;
}

// Font styling for consistent rendering
const fontStyle = {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '1.6',
    letterSpacing: '0px',
};

const IngredientReferenceInput: FC<IngredientReferenceInputProps> = ({
    value,
    onChange,
    ingredients,
    placeholder = 'Describe this step...',
}) => {
    // Get theme
    const theme = useTheme();

    // Custom styles using the expected format for react-mentions
    const mentionsInputStyle = {
        control: {
            ...fontStyle,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(0, 0, 0, 0.23)',
            borderRadius: 0,
            padding: '0px',
            margin: '0px',
            width: '100%',
            position: 'relative' as const,
        },
        input: {
            ...fontStyle,
            padding: '0px',
            margin: '0px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
        },
        highlighter: {
            ...fontStyle,
            padding: '0px',
            margin: '0px',
            border: 'none',
            color: 'transparent',
        },
        suggestions: {
            list: {
                backgroundColor: theme.palette.paper.main,
                borderRadius: '8px',
                color: theme.palette.primary.contrastText,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0, 0, 0, 0.23)',
                overflow: 'hidden',
                zIndex: 1300,
                maxHeight: '300px',
                overflowY: 'auto' as const,
                marginTop: '8px',
            },
            item: {
                padding: 0, // Required property for MentionsSuggestionItemStyle
                '&focus': {
                    backgroundColor: theme.palette.action.hover,
                },
            },
        },
    };

    // Clean highlight styling for mentions
    const mentionStyle = {
        backgroundColor: theme.palette.secondary.light,
        borderRadius: '2px',
        padding: '0 0',
        color: theme.palette.secondary.dark,
        fontWeight: 500,
    };

    // Transform ingredients to the format expected by react-mentions
    const ingredientSuggestions = ingredients.map((ingredient) => ({
        id: ingredient.id,
        display: ingredient.name,
        ingredient, // Include the full ingredient object for reference
    }));

    // Custom CSS to ensure consistent text styling
    const customCSS = `
    .react-mentions__highlighter {
      font-family: "Inter", system-ui, sans-serif !important;
      font-size: 16px !important;
      line-height: 1.6 !important;
      letter-spacing: 0px !important;
    }

    .react-mentions__input {
      font-family: "Inter", system-ui, sans-serif !important;
      font-size: 16px !important;
      line-height: 1.6 !important;
      letter-spacing: 0px !important;
    }

    .react-mentions__mention {
      background-color: ${theme.palette.secondary.light} !important;
      color: ${theme.palette.secondary.dark} !important;
      border-radius: 2px !important;
      padding: 0 4px !important;
      font-weight: 500 !important;
    }
    `;

    return (
        <React.Fragment>
            <style>{customCSS}</style>
            <MentionsInput
                value={value}
                onChange={(_event, newValue) => onChange(newValue)}
                placeholder={placeholder}
                a11ySuggestionsListLabel="Suggested ingredients"
                style={mentionsInputStyle}
                className="react-mentions__input-container"
                allowSuggestionsAboveCursor={true}
            >
                <Mention
                    trigger="@"
                    data={ingredientSuggestions}
                    renderSuggestion={(
                        suggestion,
                        _search,
                        _highlightedDisplay,
                        _index,
                        focused
                    ) => (
                        <Box
                            sx={{
                                padding: '8px 12px',
                                backgroundColor: focused
                                    ? theme.palette.action.hover
                                    : 'transparent',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Typography
                                noWrap
                                sx={{
                                    flexGrow: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {suggestion.display}
                            </Typography>
                            {suggestion.ingredient?.quantity !== null &&
                                suggestion.ingredient?.quantity !==
                                    undefined && (
                                    <Typography
                                        component="span"
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            ml: 1,
                                            flexShrink: 0,
                                        }}
                                    >
                                        ({suggestion.ingredient.quantity}
                                        {suggestion.ingredient.unit
                                            ? ' ' + suggestion.ingredient.unit
                                            : ''}
                                        )
                                    </Typography>
                                )}
                        </Box>
                    )}
                    displayTransform={(_id, display) => display}
                    markup="@[__display__](__id__)"
                    appendSpaceOnAdd
                    style={mentionStyle}
                />
            </MentionsInput>
        </React.Fragment>
    );
};

export default IngredientReferenceInput;
