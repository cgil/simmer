import React, { useState } from 'react';
import { Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

interface RecipeGalleryProps {
    images: string[];
}

const RecipeGallery: React.FC<RecipeGalleryProps> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (!images.length) return null;
    if (images.length === 1) {
        return (
            <Box
                component="img"
                src={images[0]}
                alt="Recipe"
                sx={{
                    width: '100%',
                    height: { xs: 300, sm: 400, md: 500 },
                    objectFit: 'cover',
                    borderRadius: 0,
                    mb: 4,
                }}
            />
        );
    }

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <Box sx={{ position: 'relative', mb: 4 }}>
            {/* Main Image */}
            <Box
                component="img"
                src={images[currentIndex]}
                alt={`Recipe view ${currentIndex + 1}`}
                sx={{
                    width: '100%',
                    height: { xs: 300, sm: 400, md: 500 },
                    objectFit: 'cover',
                    borderRadius: 0,
                }}
            />

            {/* Navigation Buttons */}
            <IconButton
                onClick={handlePrev}
                sx={{
                    position: 'absolute',
                    left: { xs: 8, sm: 16 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    width: { xs: 36, sm: 48 },
                    height: { xs: 36, sm: 48 },
                    '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                    },
                }}
            >
                <NavigateBeforeIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
            <IconButton
                onClick={handleNext}
                sx={{
                    position: 'absolute',
                    right: { xs: 8, sm: 16 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    width: { xs: 36, sm: 48 },
                    height: { xs: 36, sm: 48 },
                    '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                    },
                }}
            >
                <NavigateNextIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>

            {/* Thumbnail Strip */}
            {!isMobile && (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        mt: 1,
                        px: 2,
                        py: 1,
                        justifyContent: 'center',
                        bgcolor: '#F8F7FA',
                    }}
                >
                    {images.map((image, index) => (
                        <Box
                            key={index}
                            component="img"
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            onClick={() => setCurrentIndex(index)}
                            sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                cursor: 'pointer',
                                opacity: index === currentIndex ? 1 : 0.5,
                                transition: 'all 0.2s ease-in-out',
                                outline:
                                    index === currentIndex
                                        ? '2px solid'
                                        : 'none',
                                outlineColor: 'primary.main',
                                '&:hover': {
                                    opacity: 0.8,
                                },
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default RecipeGallery;
