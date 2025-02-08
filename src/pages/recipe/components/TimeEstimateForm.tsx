import { FC } from 'react';
import {
    Box,
    TextField,
    Typography,
    Paper,
    Stack,
    InputAdornment,
    Divider,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import KitchenIcon from '@mui/icons-material/Kitchen';
import { TimeEstimate } from '../../../types';

interface TimeEstimateFormProps {
    timeEstimate?: TimeEstimate;
    onChange: (timeEstimate: TimeEstimate) => void;
}

const TimeEstimateForm: FC<TimeEstimateFormProps> = ({
    timeEstimate = { prep: 0, cook: 0, rest: 0, total: 0 },
    onChange,
}) => {
    const handleChange =
        (field: keyof TimeEstimate) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = event.target.value;
            const value =
                rawValue === ''
                    ? 0
                    : parseInt(rawValue.replace(/^0+/, '')) || 0;

            const newTimeEstimate = { ...timeEstimate, [field]: value };
            // Auto-calculate total time
            if (field !== 'total') {
                newTimeEstimate.total =
                    newTimeEstimate.prep +
                    newTimeEstimate.cook +
                    newTimeEstimate.rest;
            }

            onChange(newTimeEstimate);
        };

    const getDisplayValue = (value: number) => {
        return value.toString();
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
                        mb: 2,
                        fontFamily: "'Kalam', cursive",
                    }}
                >
                    <AccessTimeIcon />
                    Time Estimate
                </Typography>

                <Stack spacing={2}>
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{
                                mb: 1,
                                color: 'text.secondary',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <RestaurantIcon fontSize="small" />
                            Prep Time
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={getDisplayValue(timeEstimate.prep)}
                            onChange={handleChange('prep')}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        min
                                    </InputAdornment>
                                ),
                            }}
                            inputProps={{
                                min: 0,
                                step: 1,
                            }}
                        />
                    </Box>

                    <Box>
                        <Typography
                            variant="body2"
                            sx={{
                                mb: 1,
                                color: 'text.secondary',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <AccessTimeIcon fontSize="small" />
                            Resting Time
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={getDisplayValue(timeEstimate.rest)}
                            onChange={handleChange('rest')}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        min
                                    </InputAdornment>
                                ),
                            }}
                            inputProps={{
                                min: 0,
                                step: 1,
                            }}
                        />
                    </Box>

                    <Box>
                        <Typography
                            variant="body2"
                            sx={{
                                mb: 1,
                                color: 'text.secondary',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <KitchenIcon fontSize="small" />
                            Cook Time
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={getDisplayValue(timeEstimate.cook)}
                            onChange={handleChange('cook')}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        min
                                    </InputAdornment>
                                ),
                            }}
                            inputProps={{
                                min: 0,
                                step: 1,
                            }}
                        />
                    </Box>

                    <Divider />

                    <Box>
                        <Typography
                            variant="body2"
                            sx={{
                                mb: 1,
                                color: 'text.secondary',
                                fontWeight: 500,
                            }}
                        >
                            Total Time
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={getDisplayValue(timeEstimate.total)}
                            disabled
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        min
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Stack>
            </Box>
        </Paper>
    );
};

export default TimeEstimateForm;
