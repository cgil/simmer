// src/pages/recipe/components/RecipeGallery.tsx
// This component is responsible for displaying a gallery of recipe images.
// It supports navigation between multiple images if provided, or displays a single image.
// For the "magazine" redesign, it focuses on a large hero image presentation without thumbnails.

import React, { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, useTheme } from '@mui/material'; // Removed Paper and useMediaQuery
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

interface RecipeGalleryProps {
    images: string[];
    // Optional prop to suggest a height for the hero image
    heroHeight?:
        | string
        | {
              xs?: string | number;
              sm?: string | number;
              md?: string | number;
              lg?: string | number;
              xl?: string | number;
          };
    // New prop to notify parent of current image index changes
    onImageChange?: (index: number, imageUrl: string) => void;
}

const RecipeGallery: React.FC<RecipeGalleryProps> = ({
    images,
    heroHeight = { xs: 300, sm: 400, md: 500 },
    onImageChange,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const theme = useTheme(); // theme might be used for button styling later

    // Use useCallback to create stable function references for event handlers
    const notifyParentOfChange = useCallback(
        (index: number) => {
            if (
                onImageChange &&
                images &&
                images.length > 0 &&
                index >= 0 &&
                index < images.length
            ) {
                onImageChange(index, images[index]);
            }
        },
        [onImageChange, images]
    );

    // Notify parent component when active image changes
    useEffect(() => {
        notifyParentOfChange(currentIndex);
    }, [currentIndex, notifyParentOfChange]);

    // Also notify on initial mount to ensure parent has the initial image
    useEffect(() => {
        notifyParentOfChange(currentIndex);
    }, [notifyParentOfChange, currentIndex]);

    if (!images || !images.length) {
        // Return a placeholder or null if no images, ensures graceful failure
        return (
            <Box
                sx={{
                    height: heroHeight,
                    backgroundColor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Optional: Add a placeholder icon or text */}
            </Box>
        );
    }

    // If only one image, display it directly without navigation
    if (images.length === 1) {
        return (
            <Box
                component="img"
                src={images[0]}
                alt="Recipe"
                sx={{
                    width: '100%',
                    height: heroHeight,
                    objectFit: 'cover',
                    borderRadius: 0, // Ensure no border radius for full bleed
                    display: 'block', // Fixes potential bottom space under img
                }}
            />
        );
    }

    const handleNext = () => {
        const nextIndex = (currentIndex + 1) % images.length;
        setCurrentIndex(nextIndex);
        // Directly notify parent to ensure callback happens
        notifyParentOfChange(nextIndex);
    };

    const handlePrev = () => {
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        setCurrentIndex(prevIndex);
        // Directly notify parent to ensure callback happens
        notifyParentOfChange(prevIndex);
    };

    return (
        <Box // Changed from Paper to Box for simpler full-bleed integration
            sx={{
                width: '100%', // Ensure it takes full width of its container
                height: heroHeight, // Use the heroHeight prop
                position: 'relative',
                overflow: 'hidden', // Important if image somehow exceeds bounds
                bgcolor: 'transparent', // Ensure no background from Paper interferes
            }}
        >
            {/* Main Image */}
            <Box
                component="img"
                src={images[currentIndex]}
                alt={`Recipe view ${currentIndex + 1}`}
                sx={{
                    width: '100%',
                    height: '100%', // Make image fill the Box container
                    objectFit: 'cover',
                    borderRadius: 0, // Ensure no border radius for full bleed
                    display: 'block', // Fixes potential bottom space under img
                }}
            />

            {/* Navigation Buttons */}
            <IconButton
                onClick={handlePrev}
                aria-label="Previous image"
                sx={{
                    position: 'absolute',
                    left: { xs: theme.spacing(1), sm: theme.spacing(2) },
                    top: '45%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0, 0, 0, 0.1)', // Darker, more subtle background
                    color: 'white',
                    backdropFilter: 'blur(4px)',
                    width: { xs: 36, sm: 48 },
                    height: { xs: 36, sm: 48 },
                    '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.5)', // Slightly darker on hover
                    },
                }}
            >
                <NavigateBeforeIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
            <IconButton
                onClick={handleNext}
                aria-label="Next image"
                sx={{
                    position: 'absolute',
                    right: { xs: theme.spacing(1), sm: theme.spacing(2) },
                    top: '45%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0, 0, 0, 0.1)', // Darker, more subtle background
                    color: 'white',
                    backdropFilter: 'blur(4px)',
                    width: { xs: 36, sm: 48 },
                    height: { xs: 36, sm: 48 },
                    '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.5)', // Slightly darker on hover
                    },
                }}
            >
                <NavigateNextIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
        </Box>
    );
};

export default RecipeGallery;
