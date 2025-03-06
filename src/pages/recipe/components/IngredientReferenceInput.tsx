import { FC, useRef, useState, useEffect } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import { Box, Typography, useTheme } from '@mui/material';
import { Ingredient } from '../../../types/recipe';
import { formatIngredientDisplayText } from '../../../utils/ingredientDisplay';
import { isValidUuid, ensureUuid } from '../../../utils/uuid';

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
    onCursorPositionChange?: (position: number) => void;
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
    placeholder = 'Describe step (use @ for ingredients)...',
    onCursorPositionChange,
}) => {
    // Get theme
    const theme = useTheme();
    // Track current cursor position
    const [cursorPosition, setCursorPosition] = useState<number>(value.length);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Update cursor position when input is focused, clicked, or cursor position changes
    const handleCursorPositionChange = () => {
        if (inputRef.current) {
            const position = inputRef.current.selectionStart || 0;
            setCursorPosition(position);
            if (onCursorPositionChange) {
                onCursorPositionChange(position);
            }
        }
    };

    // Update cursor position when value changes externally
    useEffect(() => {
        if (cursorPosition > value.length) {
            setCursorPosition(value.length);
            if (onCursorPositionChange) {
                onCursorPositionChange(value.length);
            }
        }
    }, [value, cursorPosition, onCursorPositionChange]);

    // Validate ingredient IDs and create a validated copy for use in component
    const validatedIngredients = ingredients.map((ing) => {
        if (!isValidUuid(ing.id)) {
            return { ...ing, id: ensureUuid(ing.id) };
        }
        return ing;
    });

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
            display: 'block',
            minWidth: '100%',
        },
        input: {
            ...fontStyle,
            padding: '0px',
            margin: '0px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
        },
        highlighter: {
            ...fontStyle,
            padding: '0px',
            margin: '0px',
            border: 'none',
            color: 'transparent',
            width: '100%',
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
                padding: 0,
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
        padding: '2px 0',
        color: theme.palette.secondary.dark,
    };

    // Transform ingredients to the format expected by react-mentions
    const ingredientSuggestions = validatedIngredients.map((ingredient) => ({
        id: ingredient.id,
        display: ingredient.name,
        ingredient,
    }));

    // Function to find an ingredient by ID
    const findIngredientById = (id: string) => {
        return validatedIngredients.find((ingredient) => ingredient.id === id);
    };

    // Handle changes in input value, ensuring proper UUID formats
    const handleInputChange = (_: unknown, newValue: string) => {
        // Process the value to ensure all IDs are valid UUIDs
        const processedValue = newValue.replace(
            /@\[([^\]]+)\]\(([^)]+)\)/g,
            (match, display, id) => {
                // If already a valid UUID, leave it as is
                if (isValidUuid(id)) {
                    return match;
                }
                // Generate a deterministic UUID from the id
                const validUuid = ensureUuid(id);
                return `@[${display}](${validUuid})`;
            }
        );

        onChange(processedValue);
    };

    // Custom CSS to ensure consistent text styling
    const customCSS = `
    .react-mentions__highlighter {
      font-family: "Inter", system-ui, sans-serif !important;
      font-size: 16px !important;
      line-height: 1.6 !important;
      letter-spacing: 0px !important;
      width: 100% !important;
    }

    .react-mentions__input {
      font-family: "Inter", system-ui, sans-serif !important;
      font-size: 16px !important;
      line-height: 1.6 !important;
      letter-spacing: 0px !important;
      width: 100% !important;
    }

    .react-mentions__mention {
      background-color: ${theme.palette.secondary.light} !important;
      color: ${theme.palette.secondary.dark} !important;
      border-radius: 2px !important;
      padding: 0 4px !important;
      font-weight: 500 !important;
    }

    .react-mentions__suggestions__list {
      width: 100% !important;
    }

    .react-mentions__input-container__input {
      width: 100% !important;
      display: block !important;
      margin: 0px !important;
      color: ${theme.palette.secondary.contrastText} !important;
    }
    `;

    return (
        <Box sx={{ width: '100%' }}>
            <style>{customCSS}</style>
            <MentionsInput
                value={value}
                onChange={handleInputChange}
                placeholder={placeholder}
                a11ySuggestionsListLabel="Suggested ingredients"
                style={mentionsInputStyle}
                className="react-mentions__input-container"
                allowSuggestionsAboveCursor={true}
                inputRef={inputRef}
                onSelect={handleCursorPositionChange}
                onClick={handleCursorPositionChange}
                onKeyUp={handleCursorPositionChange}
                onFocus={handleCursorPositionChange}
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
                    displayTransform={(id, display) => {
                        // Find the ingredient by id
                        const ingredient = findIngredientById(id);
                        if (!ingredient) return display;

                        // Use the formatIngredientDisplayText utility for consistent display
                        return formatIngredientDisplayText(ingredient);
                    }}
                    markup="@[__display__](__id__)"
                    appendSpaceOnAdd
                    style={mentionStyle}
                />
            </MentionsInput>
        </Box>
    );
};

export default IngredientReferenceInput;
