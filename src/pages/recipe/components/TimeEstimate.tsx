import React from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import KitchenIcon from '@mui/icons-material/Kitchen';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { TimeEstimate as TimeEstimateType } from '../../../types';
import { formatTimeDisplay } from '../../../utils/time';

interface TimeEstimateProps {
    timeEstimate: TimeEstimateType | undefined;
}

const TimeEstimate: React.FC<TimeEstimateProps> = ({ timeEstimate }) => {
    if (!timeEstimate) return null;

    const timeItems = [
        {
            label: 'Prep Time',
            value: timeEstimate.prep,
            icon: <RestaurantIcon color="primary" />,
            show: true,
        },
        {
            label: 'Rest Time',
            value: timeEstimate.rest,
            icon: <AccessTimeIcon color="primary" />,
            show: timeEstimate.rest > 0,
        },
        {
            label: 'Cook Time',
            value: timeEstimate.cook,
            icon: <KitchenIcon color="primary" />,
            show: true,
        },
        {
            label: 'Total Time',
            value: timeEstimate.total,
            icon: <TimerOutlinedIcon color="primary" />,
            show: true,
        },
    ].filter((item) => item.show);

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
        >
            <Stack
                direction="row"
                spacing={{ xs: 2, sm: 3, md: 4 }}
                justifyContent="space-around"
                alignItems="center"
                sx={{
                    flexWrap: { xs: 'wrap', md: 'nowrap' },
                    gap: { xs: 2, sm: 3 },
                }}
            >
                {timeItems.map((item) => (
                    <Box
                        key={item.label}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            ml: '0 !important',
                            flex: { xs: '1 1 40%', sm: '1 1 auto' },
                            justifyContent: 'center',
                        }}
                    >
                        {item.icon}
                        <Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'text.secondary',
                                    display: 'block',
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                }}
                            >
                                {item.label}
                            </Typography>
                            <Typography
                                sx={{
                                    fontWeight: 600,
                                    fontSize: { xs: '1rem', sm: '1.125rem' },
                                    color:
                                        item.label === 'Total Time'
                                            ? 'primary.main'
                                            : 'text.primary',
                                    // whiteSpace: 'nowrap',
                                }}
                            >
                                {formatTimeDisplay(item.value)}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
};

export default TimeEstimate;
