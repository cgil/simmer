import React from 'react';
import { Box } from '@mui/material';

interface HighlightedInstructionProps {
    text: string;
}

const HighlightedInstruction: React.FC<HighlightedInstructionProps> = ({
    text,
}) => {
    // Split the text into parts based on ingredient mentions
    const parts = text.split(/(\[INGREDIENT=[^\]]+\])/g);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('[INGREDIENT=')) {
                    // Extract the ingredient text without the tags
                    const ingredientText = part
                        .replace('[INGREDIENT=', '')
                        .replace(']', '');
                    return (
                        <Box
                            key={index}
                            component="span"
                            sx={{
                                bgcolor: 'secondary.light',
                                borderRadius: 0.5,
                                px: 0.5,
                                display: 'inline-block',
                                mx: 0.5,
                            }}
                        >
                            {ingredientText}
                        </Box>
                    );
                }
                // Regular text
                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </>
    );
};

export default HighlightedInstruction;
