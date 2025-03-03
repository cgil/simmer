import { FC } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Recipe } from '../../../types';
import { parseIngredientReferences } from '../../../utils/recipe';
import HighlightedInstruction from './HighlightedInstruction';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { formatTimeDisplay } from '../../../utils/time';

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
                                        flexDirection: 'column',
                                        gap: { xs: 1, sm: 1.5 },
                                        mb: { xs: 3, sm: 4 },
                                        '&:last-child': {
                                            mb: 0,
                                        },
                                    }}
                                >
                                    {/* Header row with step number and timing */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                color: 'primary.main',
                                                fontFamily: "'Kalam', cursive",
                                                fontSize: {
                                                    xs: '1.0rem',
                                                    sm: '1.0rem',
                                                },
                                                fontWeight: 700,
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            Step {currentStepNumber}.
                                        </Typography>
                                        {step.timing && (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    color: 'text.secondary',
                                                    fontSize: '0.85em',
                                                    bgcolor: 'grey.50',
                                                    p: 0.5,
                                                    px: 1.5,
                                                    borderRadius: '12px',
                                                    border: '1px solid',
                                                    borderColor: 'grey.100',
                                                    boxShadow:
                                                        '0 1px 2px rgba(0,0,0,0.05)',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        bgcolor: 'grey.100',
                                                        borderColor: 'grey.200',
                                                    },
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
                                                        ? formatTimeDisplay(
                                                              step.timing.min
                                                          )
                                                        : `${formatTimeDisplay(
                                                              step.timing.min
                                                          )} - ${formatTimeDisplay(
                                                              step.timing.max
                                                          )}`}
                                                </span>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Instruction text */}
                                    <Typography
                                        sx={{
                                            color: 'text.primary',
                                            fontSize: {
                                                xs: '0.9rem',
                                                sm: '1rem',
                                            },
                                            lineHeight: 1.8,
                                            pl: { xs: 1, sm: 2 },
                                            borderLeft: '2px solid',
                                            borderColor: 'grey.100',
                                        }}
                                    >
                                        <HighlightedInstruction
                                            text={
                                                // First apply any scaling to ingredient quantities
                                                parseIngredientReferences(
                                                    step.text,
                                                    recipe,
                                                    servings
                                                )
                                            }
                                            ingredients={recipe.ingredients}
                                            servings={servings}
                                            originalServings={recipe.servings}
                                        />
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            ))}
        </Paper>
    );
};

export default CookingInstructions;
