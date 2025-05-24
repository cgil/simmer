import { FC } from 'react';
import { Box, Chip, alpha, useTheme } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import TimerIcon from '@mui/icons-material/Timer';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

interface SuggestionPillsProps {
    onSelect: (suggestion: string) => void;
}

const suggestions = [
    {
        label: 'Healthier',
        icon: <FavoriteBorderIcon sx={{ fontSize: 14 }} />,
        query: 'Make this recipe healthier',
    },
    {
        label: 'Quicker',
        icon: <TimerIcon sx={{ fontSize: 14 }} />,
        query: 'Make this recipe quicker to prepare',
    },
    {
        label: 'Easier',
        icon: <AutoFixHighIcon sx={{ fontSize: 14 }} />,
        query: 'Simplify this recipe',
    },
    {
        label: 'Spicier',
        icon: <LocalFireDepartmentIcon sx={{ fontSize: 14 }} />,
        query: 'Make this recipe spicier',
    },
    {
        label: 'Vegetarian',
        icon: <LocalDiningIcon sx={{ fontSize: 14 }} />,
        query: 'Convert this to a vegetarian recipe',
    },
    {
        label: 'Gourmet',
        icon: <RestaurantMenuIcon sx={{ fontSize: 14 }} />,
        query: 'Make this recipe more gourmet',
    },
];

const SuggestionPills: FC<SuggestionPillsProps> = ({ onSelect }) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                overflowX: 'auto',
                gap: 1,
                py: 1,
                px: 1,
                '&::-webkit-scrollbar': {
                    display: 'none',
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
            }}
        >
            {suggestions.map((suggestion) => (
                <Chip
                    key={suggestion.label}
                    label={suggestion.label}
                    icon={suggestion.icon}
                    onClick={() => onSelect(suggestion.query)}
                    sx={{
                        backgroundColor: alpha(theme.palette.paper.main, 0.7),
                        backdropFilter: 'blur(4px)',
                        borderRadius: '16px',
                        height: '30px',
                        fontSize: '0.75rem',
                        color: theme.palette.primary.main,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        '&:hover': {
                            backgroundColor: alpha(
                                theme.palette.secondary.main,
                                0.2
                            ),
                            borderColor: alpha(theme.palette.primary.main, 0.2),
                        },
                        '& .MuiChip-label': {
                            padding: '0 8px',
                        },
                        '& .MuiChip-icon': {
                            marginLeft: '5px',
                        },
                    }}
                />
            ))}
        </Box>
    );
};

export default SuggestionPills;
