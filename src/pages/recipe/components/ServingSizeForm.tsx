import { FC } from 'react';
import {
    Box,
    TextField,
    Typography,
    Paper,
    InputAdornment,
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';

interface ServingSizeFormProps {
    servings: number;
    onChange: (servings: number) => void;
}

const ServingSizeForm: FC<ServingSizeFormProps> = ({
    servings = 2,
    onChange,
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;
        const value =
            rawValue === '' ? 1 : parseInt(rawValue.replace(/^0+/, '')) || 1;

        // Ensure servings is at least 1
        if (value >= 1) {
            onChange(value);
        }
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
                    <PeopleAltIcon />
                    Serving Size
                </Typography>

                <Box>
                    <Box
                        sx={{
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.secondary',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <RestaurantMenuIcon fontSize="small" />
                            Number of servings
                        </Typography>
                    </Box>
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={servings}
                        onChange={handleChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    {servings === 1 ? 'serving' : 'servings'}
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{
                            min: 1,
                            max: 99,
                            step: 1,
                        }}
                    />
                </Box>
            </Box>
        </Paper>
    );
};

export default ServingSizeForm;
