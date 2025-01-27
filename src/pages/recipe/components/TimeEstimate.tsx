import React from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import KitchenIcon from '@mui/icons-material/Kitchen';
import { TimeEstimate as TimeEstimateType } from '../../../types';

interface TimeEstimateProps {
    timeEstimate: TimeEstimateType | undefined;
}

const TimeEstimate: React.FC<TimeEstimateProps> = ({ timeEstimate }) => {
    if (!timeEstimate) return null;

    const timeItems = [
        {
            label: 'Prep Time',
            value: timeEstimate.prep,
            icon: <KitchenIcon color="primary" />,
        },
        {
            label: 'Cook Time',
            value: timeEstimate.cook,
            icon: <RestaurantIcon color="primary" />,
        },
        {
            label: 'Total Time',
            value: timeEstimate.total,
            icon: <AccessTimeIcon color="primary" />,
        },
    ];

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                mb: 4,
            }}
        >
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 2, sm: 4 }}
                justifyContent="center"
                alignItems="center"
            >
                {timeItems.map((item) => (
                    <Box
                        key={item.label}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            minWidth: 140,
                        }}
                    >
                        {item.icon}
                        <Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'text.secondary',
                                    display: 'block',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {item.label}
                            </Typography>
                            <Typography
                                sx={{
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                }}
                            >
                                {item.value} mins
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
};

export default TimeEstimate;
