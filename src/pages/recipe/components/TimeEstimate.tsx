// src/pages/recipe/components/TimeEstimate.tsx
// This component displays the prep, rest, cook, and total times for a recipe.
// For the "magazine" redesign, it's styled as a banner to be overlaid on the hero image,
// adapting its text and icon colors based on the hero image's dominant colors.

import React from 'react';
import { Box, Typography, Stack, alpha, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import KitchenIcon from '@mui/icons-material/Kitchen';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { TimeEstimate as TimeEstimateType } from '../../../types';
import { formatTimeDisplay } from '../../../utils/time';

interface TimeEstimateProps {
    timeEstimate: TimeEstimateType | undefined;
    baseTextColor?: string; // To be provided from RecipePage (heroTextColor)
}

const TimeEstimate: React.FC<TimeEstimateProps> = ({
    timeEstimate,
    baseTextColor,
}) => {
    const theme = useTheme();
    // Fallback to theme's text primary if baseTextColor is not provided
    const textColor = baseTextColor || theme.palette.text.primary;
    // Use the same text color for icons to ensure consistency
    const iconColor = textColor;

    if (!timeEstimate) return null;

    const timeItems = [
        {
            label: 'Prep Time',
            value: timeEstimate.prep,
            icon: (
                <RestaurantIcon
                    sx={{
                        color: iconColor,
                        fontSize: { xs: '1.2rem', sm: '1.4rem' },
                    }}
                />
            ),
            show: timeEstimate.prep > 0, // Only show if prep time is explicitly set
        },
        {
            label: 'Rest Time',
            value: timeEstimate.rest,
            icon: (
                <AccessTimeIcon
                    sx={{
                        color: iconColor,
                        fontSize: { xs: '1.2rem', sm: '1.4rem' },
                    }}
                />
            ),
            show: timeEstimate.rest > 0,
        },
        {
            label: 'Cook Time',
            value: timeEstimate.cook,
            icon: (
                <KitchenIcon
                    sx={{
                        color: iconColor,
                        fontSize: { xs: '1.2rem', sm: '1.4rem' },
                    }}
                />
            ),
            show: timeEstimate.cook > 0, // Only show if cook time is explicitly set
        },
        {
            label: 'Total Time',
            value: timeEstimate.total,
            icon: (
                <TimerOutlinedIcon
                    sx={{
                        color: iconColor,
                        fontSize: { xs: '1.2rem', sm: '1.4rem' },
                    }}
                />
            ),
            show: true, // Always show total time
        },
    ].filter((item) => item.show);

    // If no time items are visible (e.g. only total time which might be 0 if others are 0)
    // or if total time is 0 and other times are not shown, render nothing or a minimal message.
    if (
        timeItems.length === 0 ||
        (timeItems.length === 1 &&
            timeItems[0].label === 'Total Time' &&
            timeItems[0].value === 0)
    ) {
        return null;
    }

    return (
        <Box
            sx={{
                py: { xs: 1.5, sm: 2 },
                px: { xs: 2, sm: 3 },
                backdropFilter: 'blur(5px)',
                backgroundColor: alpha('#FFFFFF', 0.05), // Subtle white overlay
                borderRadius: '12px',
                width: '100%',
            }}
        >
            <Stack
                direction="row"
                spacing={{ xs: 2, sm: 3 }}
                sx={{
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                }}
            >
                {timeItems.map((item) => (
                    <Box
                        key={item.label}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 0.5,
                            flex: {
                                sm: '0 0 auto', // Auto width on larger screens
                            },
                        }}
                    >
                        {item.icon}
                        <Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: alpha(textColor, 0.85), // Slightly less prominent label
                                    display: 'block',
                                    fontSize: { xs: '0.65rem', sm: '0.75rem' }, // Smaller for magazine style
                                    lineHeight: 1.2,
                                    textTransform: 'uppercase', // Magazine style for labels
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {item.label}
                            </Typography>
                            <Typography
                                sx={{
                                    fontWeight:
                                        item.label === 'Total Time' ? 700 : 500, // Bolder total time
                                    fontSize: { xs: '0.85rem', sm: '1rem' }, // Clean, readable size
                                    color: textColor,
                                    lineHeight: 1.3,
                                }}
                            >
                                {formatTimeDisplay(item.value)}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};

export default TimeEstimate;
