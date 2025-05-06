import { FC } from 'react';
import { Typography, Stack, Paper } from '@mui/material';
import { Recipe } from '../../../types';

interface RecipeNotesProps {
    recipe: Recipe;
}

const RecipeNotes: FC<RecipeNotesProps> = ({ recipe }) => {
    if (!recipe.notes || recipe.notes.length === 0) {
        return null;
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2.5, sm: 3.5 },
                height: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'paper.main',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 0,
                },
                '& > *': {
                    position: 'relative',
                    zIndex: 1,
                },
            }}
        >
            <Typography
                variant="h5"
                component="h2"
                sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    mb: 3,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    fontFamily: "'Kalam', cursive",
                }}
            >
                Notes
            </Typography>
            <Stack spacing={2}>
                {recipe.notes.map((note, index) => (
                    <Typography
                        key={index}
                        variant="body1"
                        sx={{
                            color: 'text.secondary',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            display: 'flex',
                            alignItems: 'flex-start',
                            position: 'relative',
                            pl: 4,
                            '&::before': {
                                content: '"•"',
                                position: 'absolute',
                                left: '12px',
                                color: 'primary.main',
                                fontSize: '1.2rem',
                                lineHeight: 1.6,
                            },
                        }}
                    >
                        {note}
                    </Typography>
                ))}
            </Stack>
        </Paper>
    );
};

export default RecipeNotes;
