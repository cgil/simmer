// src/pages/recipe/components/RecipeNotes.tsx
// This component displays any additional notes for a recipe.
// It's styled as a floating card with a modern magazine aesthetic for the recipe page redesign.

import { FC } from 'react';
import { Typography, Stack, Paper, useTheme, Box, alpha } from '@mui/material';
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
                    '&:after': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        bottom: -8,
                        width: '80px',
                        height: '2px',
                        background: `linear-gradient(90deg, ${
                            theme.palette.primary.main
                        } 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
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
