import { FC, ChangeEvent } from 'react';
import { Paper, InputBase, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    resultsCount?: number;
}

const SearchBar: FC<SearchBarProps> = ({
    value,
    onChange,
    placeholder = 'Search recipes...',
    resultsCount,
}) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value);
    };

    return (
        <Paper
            component="form"
            sx={{
                p: { xs: 1, sm: 2 },
                mb: { xs: 3, sm: 4 },
                borderRadius: 1,
                boxShadow: `
                    0 1px 2px rgba(0,0,0,0.05),
                    0 3px 6px rgba(0,0,0,0.02),
                    0 1px 8px rgba(0,0,0,0.02)
                `,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                border: '1px solid',
                borderColor: 'divider',
                width: '100%',
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
            elevation={0}
            onSubmit={(e) => e.preventDefault()}
        >
            <SearchIcon
                sx={{
                    ml: { xs: 1, sm: 1.5 },
                    fontSize: { xs: 20, sm: 22 },
                    color: value ? 'primary.main' : 'text.secondary',
                }}
            />
            <InputBase
                sx={{
                    flex: 1,
                    '& input': {
                        py: { xs: 1, sm: 1.25 },
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontFamily: "'Inter', sans-serif",
                        '&::placeholder': {
                            color: 'text.secondary',
                            opacity: 0.8,
                        },
                    },
                }}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                inputProps={{ 'aria-label': 'search recipes' }}
                fullWidth
            />
            {value && resultsCount !== undefined && (
                <Typography
                    variant="body2"
                    sx={{
                        px: { xs: 1.5, sm: 2 },
                        py: '2px',
                        bgcolor: 'secondary.light',
                        borderRadius: 1,
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        color: 'text.primary',
                        fontFamily: "'Inter', sans-serif",
                        userSelect: 'none',
                    }}
                >
                    {resultsCount} {resultsCount === 1 ? 'recipe' : 'recipes'}
                </Typography>
            )}
        </Paper>
    );
};

export default SearchBar;
