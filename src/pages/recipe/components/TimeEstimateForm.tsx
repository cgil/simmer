import { FC } from 'react';
import { Box, TextField, Typography, Paper } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import KitchenIcon from '@mui/icons-material/Kitchen';
import { TimeEstimate } from '../../../types';

interface TimeEstimateFormProps {
    timeEstimate: TimeEstimate | undefined;
    onChange: (timeEstimate: TimeEstimate) => void;
}

const TimeEstimateForm: FC<TimeEstimateFormProps> = ({
    timeEstimate = { prep: 0, cook: 0, total: 0 },
    onChange,
}) => {
    const handleChange =
        (field: keyof TimeEstimate) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = event.target.value;
            // If empty string, use empty string (don't convert to 0)
            // If number, remove leading zeros and convert to number
            const value =
                rawValue === ''
                    ? 0
                    : parseInt(rawValue.replace(/^0+/, '')) || 0;

            const newTimeEstimate = { ...timeEstimate, [field]: value };

            // Auto-calculate total time
            if (field !== 'total') {
                newTimeEstimate.total =
                    newTimeEstimate.prep + newTimeEstimate.cook;
            }

            onChange(newTimeEstimate);
        };

    const getDisplayValue = (value: number) => {
        return value === 0 ? '' : value.toString();
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 1,
                boxShadow: `
                    0 1px 2px rgba(0,0,0,0.05),
                    0 3px 6px rgba(0,0,0,0.02),
                    0 1px 8px rgba(0,0,0,0.02)
                `,
                height: '100%',
                position: 'relative',
                bgcolor: 'background.paper',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 1,
                    zIndex: 0,
                },
                '& > *': {
                    position: 'relative',
                    zIndex: 1,
                },
            }}
        >
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: 'text.primary',
                        mb: 3,
                        fontFamily: "'Kalam', cursive",
                    }}
                >
                    <AccessTimeIcon />
                    Time Estimates
                </Typography>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(3, 1fr)',
                        },
                        gap: 3,
                        flex: 1,
                    }}
                >
                    <Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1,
                            }}
                        >
                            <KitchenIcon color="primary" />
                            <Typography
                                variant="subtitle2"
                                color="text.secondary"
                            >
                                Prep Time
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            variant="standard"
                            type="number"
                            value={getDisplayValue(timeEstimate.prep)}
                            onChange={handleChange('prep')}
                            InputProps={{
                                endAdornment: (
                                    <Typography color="text.secondary">
                                        mins
                                    </Typography>
                                ),
                            }}
                        />
                    </Box>
                    <Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1,
                            }}
                        >
                            <RestaurantIcon color="primary" />
                            <Typography
                                variant="subtitle2"
                                color="text.secondary"
                            >
                                Cook Time
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            variant="standard"
                            type="number"
                            value={getDisplayValue(timeEstimate.cook)}
                            onChange={handleChange('cook')}
                            InputProps={{
                                endAdornment: (
                                    <Typography color="text.secondary">
                                        mins
                                    </Typography>
                                ),
                            }}
                        />
                    </Box>
                    <Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1,
                            }}
                        >
                            <AccessTimeIcon color="primary" />
                            <Typography
                                variant="subtitle2"
                                color="text.secondary"
                            >
                                Total Time
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            variant="standard"
                            type="number"
                            value={getDisplayValue(timeEstimate.total)}
                            disabled
                            InputProps={{
                                endAdornment: (
                                    <Typography color="text.secondary">
                                        mins
                                    </Typography>
                                ),
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};

export default TimeEstimateForm;
