import { FC } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Recipe } from '../../../types';
import { parseIngredientReferences } from '../../../utils/recipe';
import HighlightedInstruction from './HighlightedInstruction';
import TimeEstimate from './TimeEstimate';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';

interface CookingInstructionsProps {
    recipe: Recipe;
    servings: number;
}

const CookingInstructions: FC<CookingInstructionsProps> = ({
    recipe,
    servings,
}) => {
    // Keep track of overall step number across sections
    let stepNumber = 1;

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
                                m: 0,
                                p: 0,
                                listStyle: 'none',
                            }}
                        >
                            {section.steps.map((step, index) => {
                                const currentStepNumber = stepNumber++;
                                return (
                                    <Box
                                        component="li"
                                        key={index}
                                        sx={{
                                            fontSize: {
                                                xs: '0.9rem',
                                                sm: '1rem',
                                            },
                                            lineHeight: 1.6,
                                            color: 'text.primary',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: { xs: 2, sm: 3 },
                                            mb: 2,
                                            '&:last-child': {
                                                mb: 0,
                                            },
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                color: 'primary.main',
                                                fontFamily: "'Kalam', cursive",
                                                fontSize: {
                                                    xs: '1.25rem',
                                                    sm: '1.5rem',
                                                },
                                                fontWeight: 700,
                                                lineHeight: 1.4,
                                                minWidth: {
                                                    xs: '24px',
                                                    sm: '32px',
                                                },
                                            }}
                                        >
                                            {currentStepNumber}.
                                        </Typography>
                                        <Box
                                            sx={{
                                                flex: 1,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                gap: 2,
                                            }}
                                        >
                                            <Typography sx={{ flex: 1 }}>
                                                <HighlightedInstruction
                                                    text={parseIngredientReferences(
                                                        step.text,
                                                        recipe,
                                                        servings
                                                    )}
                                                />
                                            </Typography>
                                            {step.timing && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                        color: 'text.secondary',
                                                        fontSize: '0.85em',
                                                        flexShrink: 0,
                                                        bgcolor: 'grey.50',
                                                        p: 0.5,
                                                        px: 1,
                                                        borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: 'grey.100',
                                                        mt: 0.25,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    <TimerOutlinedIcon
                                                        sx={{
                                                            fontSize: '1.1em',
                                                            opacity: 0.8,
                                                        }}
                                                    />
                                                    <span>
                                                        {step.timing.min ===
                                                        step.timing.max
                                                            ? `${step.timing.min}`
                                                            : `${step.timing.min}-${step.timing.max}`}{' '}
                                                        {step.timing.units}
                                                    </span>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                ))}
            </Paper>
        </>
    );
};

export default CookingInstructions;
