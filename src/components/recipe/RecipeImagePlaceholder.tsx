import { FC } from 'react';
import { Paper, Typography } from '@mui/material';
import RecipePlaceholder from '../icons/RecipePlaceholder';

interface RecipeImagePlaceholderProps {
    title?: string;
    height?: string | number;
}

const RecipeImagePlaceholder: FC<RecipeImagePlaceholderProps> = ({
    title,
    height = '180px',
}) => {
    return (
        <Paper
            elevation={0}
            sx={{
                height,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                bgcolor: '#f8f5f0', // Warm paper-like color
                borderBottom: '1px dashed rgba(0,0,0,0.1)',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                        'radial-gradient(circle, transparent 85%, rgba(0,0,0,0.03) 100%)',
                    opacity: 0.5,
                    pointerEvents: 'none',
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                        radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                        radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px',
                    opacity: 0.4,
                    pointerEvents: 'none',
                },
            }}
        >
            <RecipePlaceholder
                sx={{
                    fontSize: '72px',
                    color: 'primary.main',
                    opacity: 0.7,
                    mb: 1,
                    position: 'relative',
                    zIndex: 1,
                }}
            />

            {title && (
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        fontFamily: "'Kalam', cursive",
                        fontStyle: 'italic',
                        textAlign: 'center',
                        maxWidth: '80%',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {title}
                </Typography>
            )}
        </Paper>
    );
};

export default RecipeImagePlaceholder;
