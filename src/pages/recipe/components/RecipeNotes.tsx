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
                p: { xs: 2.5, sm: 4 },
                height: '100%',
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
        >
            <Typography
                variant="h4"
                sx={{
                    color: 'primary.main',
                    fontFamily: "'Kalam', cursive",
                    mb: 3,
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
