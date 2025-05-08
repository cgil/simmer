// src/pages/recipe/components/RecipeNotes.tsx
// This component displays any additional notes for a recipe.
// It's styled as a floating card with a modern magazine aesthetic for the recipe page redesign.

import { FC } from 'react';
import { Typography, Stack, Paper, useTheme, Box } from '@mui/material';
import { Recipe } from '../../../types';

interface RecipeNotesProps {
    recipe: Recipe;
}

const RecipeNotes: FC<RecipeNotesProps> = ({ recipe }) => {
    const theme = useTheme();

    if (!recipe.notes || recipe.notes.length === 0) {
        return null;
    }

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
                Chef's Notes
            </Typography>
            <Stack spacing={2} sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
                {recipe.notes.map((note, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            position: 'relative',
                            pl: '28px',
                            '&::before': {
                                content: '"•"',
                                position: 'absolute',
                                left: '8px',
                                top: '2px',
                                color: theme.palette.primary.main,
                                fontSize: '1.4rem',
                                lineHeight: 1.5,
                                fontWeight: 'bold',
                            },
                        }}
                    >
                        <Typography
                            variant="body1"
                            sx={{
                                color: 'text.secondary',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: { xs: '1rem', sm: '1.05rem' },
                                lineHeight: 1.7,
                            }}
                        >
                            {note}
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
};

export default RecipeNotes;
