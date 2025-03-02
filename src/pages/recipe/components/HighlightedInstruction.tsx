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
}

const HighlightedInstruction: FC<HighlightedInstructionProps> = ({
    text,
    ingredients,
}) => {
    // Parse the text to get segments (text or ingredient mentions)
    const segments = parseIngredientMentions(text, ingredients);

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
                    />
                );
            })}
        </Typography>
    );
};

export default HighlightedInstruction;
