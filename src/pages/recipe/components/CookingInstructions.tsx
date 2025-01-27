import { FC } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Recipe } from '../../../types';
import { parseIngredientReferences } from '../../../utils/recipe';
import HighlightedInstruction from './HighlightedInstruction';
import TimeEstimate from './TimeEstimate';

interface CookingInstructionsProps {
    recipe: Recipe;
    servings: number;
}

const CookingInstructions: FC<CookingInstructionsProps> = ({
    recipe,
    servings,
}) => {
    return (
        <>
            <TimeEstimate timeEstimate={recipe.time_estimate} />
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, sm: 4 },
                    height: '100%',
                    borderRadius: 4,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
            >
                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        fontWeight: 700,
                        color: 'primary.main',
                        mb: 4,
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    }}
                >
                    Instructions
                </Typography>

                {recipe.instructions.map((section) => (
                    <Box key={section.section_title} sx={{ mb: 4 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 600,
                                mb: 2,
                                color: 'text.primary',
                                fontSize: { xs: '1.1rem', sm: '1.2rem' },
                            }}
                        >
                            {section.section_title}
                        </Typography>
                        <Box
                            component="ol"
                            sx={{
                                pl: { xs: 3, sm: 4 },
                                '& > li': {
                                    pl: 1,
                                    pb: 2,
                                    '&:last-child': {
                                        pb: 0,
                                    },
                                },
                            }}
                        >
                            {section.steps.map((step, index) => (
                                <Typography
                                    component="li"
                                    key={index}
                                    sx={{
                                        fontSize: { xs: '0.9rem', sm: '1rem' },
                                        lineHeight: 1.6,
                                        color: 'text.primary',
                                    }}
                                >
                                    <HighlightedInstruction
                                        text={parseIngredientReferences(
                                            step,
                                            recipe,
                                            servings
                                        )}
                                    />
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                ))}
            </Paper>
        </>
    );
};

export default CookingInstructions;
