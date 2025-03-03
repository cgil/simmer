import React, { FC } from 'react';
import { Typography } from '@mui/material';
import { Ingredient } from '../../../types/recipe';
import {
    parseIngredientMentions,
    IngredientMention,
} from '../../../utils/ingredientMentions';
import IngredientReferenceMention from './IngredientReferenceMention';

interface HighlightedInstructionProps {
    text: string;
    ingredients: Ingredient[];
    servings?: number;
    originalServings?: number;
}

const HighlightedInstruction: FC<HighlightedInstructionProps> = ({
    text,
    ingredients,
    servings,
    originalServings,
}) => {
    if (!text) return null;
    if (!ingredients || !Array.isArray(ingredients)) {
        // Handle the case where ingredients is undefined or not an array
        return (
            <Typography variant="body1" component="div">
                {text}
            </Typography>
        );
    }

    // Parse the text to get segments (text or ingredient mentions)
    // Pass servings information to properly handle ingredient scaling
    const segments = parseIngredientMentions(
        text,
        ingredients,
        servings,
        originalServings
    );

    return (
        <Typography variant="body1" component="div">
            {segments.map((segment, index) => {
                // If segment is a string, render it directly
                if (typeof segment === 'string') {
                    return (
                        <React.Fragment key={`text-${index}`}>
                            {segment}
                        </React.Fragment>
                    );
                }

                // Otherwise, it's an ingredient mention, render the component
                const mention = segment as IngredientMention;
                return (
                    <IngredientReferenceMention
                        key={`mention-${mention.id}-${index}`}
                        ingredient={mention.ingredient}
                        display={mention.display}
                        servings={servings}
                        originalServings={originalServings}
                        scaledQuantity={mention.scaledQuantity}
                    />
                );
            })}
        </Typography>
    );
};

export default HighlightedInstruction;
