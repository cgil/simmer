import React, { FC } from 'react';
import { Box, Paper } from '@mui/material';

const RecipeIdeaLoadingCardComponent: FC = () => (
    <Paper
        elevation={0}
        sx={{
            p: 2.5,
            height: 220,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            position: 'relative',
            bgcolor: 'background.paper',
            overflow: 'hidden',
        }}
    >
        {/* Title placeholder */}
        <Box
            sx={{
                height: 32,
                width: '75%',
                mb: 2,
                borderRadius: 0.5,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'grey.200',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                    animation: 'shimmer 1.5s infinite',
                },
                '@keyframes shimmer': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
            }}
        />
        {/* Description placeholder lines */}
        {[...Array(4)].map((_, i) => (
            <Box
                key={i}
                sx={{
                    height: 16,
                    width: `${Math.random() * 30 + 65}%`,
                    mb: 1.5,
                    borderRadius: 0.5,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: 'grey.200',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                            'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                        animation: 'shimmer 1.5s infinite',
                        animationDelay: `${i * 0.15}s`,
                    },
                }}
            />
        ))}
        {/* Button placeholder */}
        <Box
            sx={{
                height: 40,
                width: '100%',
                mt: 'auto',
                mb: 0.5,
                borderRadius: 1,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'grey.200',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                    animation: 'shimmer 1.5s infinite',
                },
            }}
        />
    </Paper>
);

const RecipeIdeaLoadingCard = React.memo(RecipeIdeaLoadingCardComponent);
export default RecipeIdeaLoadingCard;
