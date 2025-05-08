// src/pages/recipe/components/CookingInstructions.tsx
// This component displays cooking instructions with an elegant, contemporary culinary magazine style
// that creates intuitive visual separation between sections and steps.

import { FC } from 'react';
import {
    Box,
    Typography,
    Paper,
    useTheme,
    Stack,
    alpha,
    Tooltip,
} from '@mui/material';
import { Recipe } from '../../../types';
import { parseIngredientReferences } from '../../../utils/recipe';
import HighlightedInstruction from './HighlightedInstruction';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatTimeDisplay } from '../../../utils/time';

interface CookingInstructionsProps {
    recipe: Recipe;
    servings: number;
}

// Helper function to format time in a compact way
const formatCompactTime = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes}m`;
    } else if (minutes % 60 === 0) {
        // Clean hours with no minutes
        return `${Math.floor(minutes / 60)}h`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h${remainingMinutes}m`;
    }
};

// Formats time even more compactly for very long ranges
const formatSmartCompactTime = (min: number, max: number): string => {
    const minCompact = formatCompactTime(min);
    const maxCompact = formatCompactTime(max);

    // If the combined text would be too long, we'll make it even more compact
    const combinedLength = minCompact.length + maxCompact.length;

    if (combinedLength > 8) {
        // For hour + minute combinations where both have hours, abbreviate further
        if (min >= 60 && max >= 60) {
            const minHours = Math.floor(min / 60);
            const maxHours = Math.floor(max / 60);
            const minMinutes = min % 60;
            const maxMinutes = max % 60;

            // If hours are the same, just show the minute difference
            if (minHours === maxHours) {
                return `${minHours}h${minMinutes} - ${maxMinutes}m`;
            }

            // If minutes are small or zero, just show the hours
            if (minMinutes === 0 && maxMinutes === 0) {
                return `${minHours} - ${maxHours}h`;
            }

            // Otherwise show compact hour-minute notation
            return `${minHours}h${minMinutes} - ${maxHours}h${maxMinutes}`;
        }
    }

    // Default format
    return `${minCompact} - ${maxCompact}`;
};

const CookingInstructions: FC<CookingInstructionsProps> = ({
    recipe,
    servings,
}) => {
    const theme = useTheme();
    let stepNumber = 1;

    const cardSx = {
        p: { xs: 2.5, sm: 3 },
        height: '100%',
        borderRadius: theme.shape.borderRadius * 2,
        bgcolor: 'background.paper',
        boxShadow: '0px 8px 24px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
    };

    if (!recipe.instructions || recipe.instructions.length === 0) {
        return (
            <Paper sx={cardSx}>
                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        fontWeight: 700,
                        color: 'primary.main',
                        mb: 2,
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        fontFamily: "'Kalam', cursive",
                    }}
                >
                    Instructions
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontFamily: "'Inter', sans-serif" }}
                >
                    No instructions available for this recipe.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={cardSx}>
            <Typography
                variant="h5"
                component="h2"
                sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    mb: 3.5,
                    fontSize: { xs: '1.4rem', sm: '1.7rem' },
                    fontFamily: "'Kalam', cursive",
                    flexShrink: 0,
                    position: 'relative',
                    display: 'inline-block',
                    pb: 1.5,
                    '&:after': {
                        content: '""',
                        position: 'absolute',
                        left: 2,
                        bottom: 2,
                        width: '100%',
                        height: '8px',
                        background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='8' viewBox='0 0 80 8' fill='none'%3E%3Cpath d='M1,4 C25,1 55,1 79,4 L79,4.5 C55,2 25,2.5 1,6 Z' fill='${encodeURIComponent(
                            theme.palette.primary.main
                        )}'/%3E%3C/svg%3E") no-repeat bottom left`,
                        backgroundSize: 'contain',
                    },
                }}
            >
                Instructions
            </Typography>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                {recipe.instructions.map((section, sectionIndex) => (
                    <Box
                        key={`section-${sectionIndex}-${section.section_title}`}
                        sx={{
                            mb:
                                sectionIndex === recipe.instructions.length - 1
                                    ? 3
                                    : 5,
                            position: 'relative',
                        }}
                    >
                        {section.section_title && (
                            <Box sx={{ mb: 2.5 }}>
                                <Typography
                                    variant="h6"
                                    component="h3"
                                    sx={{
                                        color: 'primary.dark',
                                        fontFamily: "'Kalam', cursive",
                                        fontWeight: 700,
                                        fontSize: {
                                            xs: '1.15rem',
                                            sm: '1.25rem',
                                        },
                                        display: 'inline-block',
                                        pr: 2,
                                        position: 'relative',
                                        zIndex: 2,
                                        backgroundColor:
                                            theme.palette.background.paper,
                                    }}
                                >
                                    {section.section_title}
                                </Typography>
                                <Box
                                    sx={{
                                        height: '1px',
                                        width: '100%',
                                        backgroundColor: alpha(
                                            theme.palette.primary.main,
                                            0.12
                                        ),
                                        position: 'relative',
                                        top: '-12px',
                                        zIndex: 1,
                                    }}
                                />
                            </Box>
                        )}

                        <Stack spacing={3.5}>
                            {section.steps.map((step, index) => {
                                const currentStepNumber = stepNumber++;
                                const hasTimer = !!step.timing;
                                const timing = step.timing || {
                                    min: 0,
                                    max: 0,
                                };

                                const isLongRange =
                                    hasTimer && timing.min !== timing.max;
                                const timeText = hasTimer
                                    ? timing.min === timing.max
                                        ? formatCompactTime(timing.min)
                                        : formatSmartCompactTime(
                                              timing.min,
                                              timing.max
                                          )
                                    : '';

                                return (
                                    <Box
                                        component="li"
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: {
                                                xs: 'row',
                                                sm: 'row',
                                            },
                                            gap: { xs: 1.5, sm: 2 },
                                            listStyle: 'none',
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        <Tooltip
                                            title={
                                                hasTimer
                                                    ? timing.min === timing.max
                                                        ? `${formatTimeDisplay(
                                                              timing.min
                                                          )}`
                                                        : `${formatTimeDisplay(
                                                              timing.min
                                                          )} - ${formatTimeDisplay(
                                                              timing.max
                                                          )}`
                                                    : ''
                                            }
                                            arrow
                                            placement="top"
                                            disableHoverListener={!hasTimer}
                                        >
                                            <Box
                                                sx={{
                                                    width: { xs: 70, sm: 74 },
                                                    minWidth: {
                                                        xs: 60,
                                                        sm: 65,
                                                    },
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent:
                                                        'flex-start',
                                                    position: 'relative',
                                                    mt: 0.75,
                                                }}
                                            >
                                                {/* Step Number Circle */}
                                                <Box
                                                    sx={{
                                                        width: {
                                                            xs: 30,
                                                            sm: 32,
                                                        },
                                                        height: {
                                                            xs: 30,
                                                            sm: 32,
                                                        },
                                                        borderRadius: '50%',
                                                        bgcolor:
                                                            'background.paper',
                                                        border: '1px solid',
                                                        borderColor: alpha(
                                                            theme.palette
                                                                .primary.main,
                                                            0.25
                                                        ),
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                        position: 'relative',
                                                        boxShadow: 'none',
                                                        transition:
                                                            'all 0.2s ease',
                                                        zIndex: 1,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontFamily:
                                                                "'Kalam', cursive",
                                                            fontSize: {
                                                                xs: '0.95rem',
                                                                sm: '1rem',
                                                            },
                                                            fontWeight: 600,
                                                            color: alpha(
                                                                theme.palette
                                                                    .primary
                                                                    .main,
                                                                0.75
                                                            ),
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        {currentStepNumber}
                                                    </Typography>
                                                </Box>

                                                {/* Timing Badge */}
                                                {hasTimer && (
                                                    <Box
                                                        sx={{
                                                            position:
                                                                'absolute',
                                                            top: {
                                                                xs: 20,
                                                                sm: 22,
                                                            },
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'center',
                                                            fontSize:
                                                                isLongRange
                                                                    ? '0.6rem'
                                                                    : '0.65rem',
                                                            fontWeight: 500,
                                                            color: alpha(
                                                                theme.palette
                                                                    .primary
                                                                    .dark,
                                                                0.75
                                                            ),
                                                            fontFamily:
                                                                "'Inter', sans-serif",
                                                            bgcolor: alpha(
                                                                theme.palette
                                                                    .background
                                                                    .paper,
                                                                0.95
                                                            ),
                                                            borderRadius: '8px',
                                                            padding: '2px 6px',
                                                            minWidth: {
                                                                xs: 36,
                                                                sm: 40,
                                                            },
                                                            maxWidth: {
                                                                xs: '120%',
                                                                sm: '130%',
                                                            },
                                                            whiteSpace:
                                                                'nowrap',
                                                            overflow: 'visible',
                                                            border: '1px solid',
                                                            borderColor: alpha(
                                                                theme.palette
                                                                    .primary
                                                                    .main,
                                                                0.15
                                                            ),
                                                            boxShadow: `0 1px 2px ${alpha(
                                                                theme.palette
                                                                    .common
                                                                    .black,
                                                                0.03
                                                            )}`,
                                                            letterSpacing:
                                                                isLongRange
                                                                    ? '-0.01em'
                                                                    : 'normal',
                                                            zIndex: 2,
                                                            transition:
                                                                'all 0.2s ease',
                                                        }}
                                                    >
                                                        <AccessTimeIcon
                                                            sx={{
                                                                fontSize:
                                                                    isLongRange
                                                                        ? '0.6rem'
                                                                        : '0.65rem',
                                                                mr: 0.5,
                                                                opacity: 0.6,
                                                                flexShrink: 0,
                                                                color: alpha(
                                                                    theme
                                                                        .palette
                                                                        .primary
                                                                        .main,
                                                                    0.85
                                                                ),
                                                            }}
                                                        />
                                                        <span>{timeText}</span>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Tooltip>

                                        <Typography
                                            component="div"
                                            sx={{
                                                color: 'text.primary',
                                                fontSize: {
                                                    xs: '0.95rem',
                                                    sm: '1.05rem',
                                                },
                                                lineHeight: 1.8,
                                                flex: 1,
                                                fontFamily:
                                                    "'Inter', sans-serif",
                                                pt: 0.5,
                                            }}
                                        >
                                            <HighlightedInstruction
                                                text={parseIngredientReferences(
                                                    step.text,
                                                    recipe,
                                                    servings
                                                )}
                                                ingredients={recipe.ingredients}
                                                servings={servings}
                                                originalServings={
                                                    recipe.servings
                                                }
                                            />
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

export default CookingInstructions;
