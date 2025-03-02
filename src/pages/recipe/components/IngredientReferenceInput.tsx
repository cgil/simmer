import React, { FC } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import { Box, Typography } from '@mui/material';
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

// Match Material UI's default font exactly
const fontStyle = {
    // This is Material UI's default font stack
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '1.5',
    letterSpacing: '0.00938em',
};

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
            backgroundColor: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            borderRadius: '4px',
            border: '1px solid rgba(0, 0, 0, 0.23)',
            overflow: 'hidden',
            zIndex: 1300,
            maxHeight: '300px',
            overflowY: 'auto' as const,
            marginTop: '8px',
        },
        item: {
            padding: '8px 12px',
            '&focused': {
                backgroundColor: 'rgba(0,0,0,0.08)',
            },
        },
    },
};

// Simple mention style with no transform or complex effects
const mentionStyle = {
    backgroundColor: '#FFF9C4',
    borderRadius: '2px',
    padding: 0,
    color: '#9C6D00',
    fontWeight: 500,
};

// Force exact alignment with CSS overrides
const customCSS = `
/* Base container styles */
.react-mentions {
    position: relative;
    width: 100%;
}

/* Main selector styles */
.react-mentions,
.react-mentions__control,
.react-mentions__input,
.react-mentions__highlighter {
    box-sizing: border-box !important;
}

/* Force identical rendering between input and highlighter */
.react-mentions__input,
.react-mentions__highlighter {
    font-family: ${fontStyle.fontFamily} !important;
    font-size: ${fontStyle.fontSize} !important;
    font-weight: ${fontStyle.fontWeight} !important;
    line-height: ${fontStyle.lineHeight} !important;
    letter-spacing: ${fontStyle.letterSpacing} !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    text-align: left !important;
    text-indent: 0 !important;
    text-transform: none !important;
    white-space: pre-wrap !important;
    word-break: normal !important;
    word-spacing: normal !important;
    width: 100% !important;
}

/* Position the highlighter directly over the input */
.react-mentions__highlighter {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    pointer-events: none !important;
    color: transparent !important;
    overflow: hidden !important;
}

/* Simple highlight style */
.react-mentions__mention {
    background-color: #FFF9C4 !important;
    color: #9C6D00 !important;
    border-radius: 2px !important;
    padding: 0 4px !important;
    margin: 0 !important;
    font-weight: 500 !important;
    display: inline !important;
    position: relative !important;
    transform: none !important;
    font-family: ${fontStyle.fontFamily} !important;
    font-size: ${fontStyle.fontSize} !important;
    line-height: ${fontStyle.lineHeight} !important;
    letter-spacing: ${fontStyle.letterSpacing} !important;
}
`;

const IngredientReferenceInput: FC<IngredientReferenceInputProps> = ({
    value,
    onChange,
    ingredients,
    placeholder = 'Describe this step...',
}) => {
    // Transform ingredients to the format expected by react-mentions
    const ingredientSuggestions = ingredients.map((ingredient) => ({
        id: ingredient.id,
        display: ingredient.name,
        ingredient, // Include the full ingredient object for reference
    }));

    return (
        <React.Fragment>
            <style>{customCSS}</style>
            <div className="react-mentions">
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
                                        ? 'rgba(0,0,0,0.08)'
                                        : 'transparent',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="body2">
                                    {suggestion.ingredient?.quantity !== null &&
                                    suggestion.ingredient?.quantity !==
                                        undefined
                                        ? `${suggestion.ingredient.quantity}${
                                              suggestion.ingredient.unit
                                                  ? ' ' +
                                                    suggestion.ingredient.unit
                                                  : ''
                                          } `
                                        : ''}
                                    {suggestion.display}
                                </Typography>
                            </Box>
                        )}
                        displayTransform={(_id, display) => display}
                        markup="@[__display__](__id__)"
                        appendSpaceOnAdd
                        style={mentionStyle}
                    />
                </MentionsInput>
            </div>
        </React.Fragment>
    );
};

export default IngredientReferenceInput;
