// src/pages/recipe/components/RecipeGallery.tsx
// This component is responsible for displaying a gallery of recipe images.
// It supports navigation between multiple images if provided, or displays a single image.
// For the "magazine" redesign, it focuses on a large hero image presentation without thumbnails.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
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
    const theme = useTheme();
    // Consider true mobile devices only for always-visible indicators
    const isTrueMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const touchStartX = useRef<number | null>(null);
    const [direction, setDirection] = useState<number>(0);
    const [showControls, setShowControls] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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

    const handleNext = useCallback(() => {
        setDirection(1);
        const nextIndex = (currentIndex + 1) % images.length;
        setCurrentIndex(nextIndex);
        notifyParentOfChange(nextIndex);
    }, [currentIndex, images.length, notifyParentOfChange]);

    const handlePrev = useCallback(() => {
        setDirection(-1);
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        setCurrentIndex(prevIndex);
        notifyParentOfChange(prevIndex);
    }, [currentIndex, images.length, notifyParentOfChange]);

    // Touch handlers for swipe navigation
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;

        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;

        // Require a minimum swipe distance to trigger navigation
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                // Swipe left, go to next
                handleNext();
            } else {
                // Swipe right, go to previous
                handlePrev();
            }
        }

        touchStartX.current = null;
    };

    const handleSelectImage = (index: number) => {
        if (index === currentIndex) return;
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
        notifyParentOfChange(index);
    };

    // Add keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle keyboard events when gallery is visible in viewport
            if (
                containerRef.current &&
                isElementInViewport(containerRef.current)
            ) {
                if (e.key === 'ArrowRight') {
                    handleNext();
                } else if (e.key === 'ArrowLeft') {
                    handlePrev();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleNext, handlePrev]);

    // Helper function to check if element is in viewport
    const isElementInViewport = (el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <=
                (window.innerWidth || document.documentElement.clientWidth)
        );
    };

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
                    borderRadius: 0,
                    display: 'block',
                }}
            />
        );
    }

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0.5,
        }),
        center: {
            x: 0,
            opacity: 1,
            transition: {
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
            },
        },
        exit: (direction: number) => ({
            x: direction > 0 ? '-100%' : '100%',
            opacity: 0.5,
            transition: {
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
            },
        }),
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                height: heroHeight,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'transparent',
            }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Main Image with touch handlers - enabled for ALL devices */}
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <AnimatePresence
                    initial={false}
                    custom={direction}
                    mode="popLayout"
                >
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            willChange: 'transform, opacity',
                        }}
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                    >
                        <Box
                            component="img"
                            src={images[currentIndex]}
                            alt={`Recipe view ${currentIndex + 1}`}
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 0,
                                display: 'block',
                            }}
                        />
                    </motion.div>
                </AnimatePresence>
            </Box>

            {/* Navigation areas - visible on ALL screen sizes on hover */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '20%',
                    height: '100%',
                    cursor: 'pointer',
                    zIndex: 4,
                    display: { xs: 'block' }, // Always block, visible on all screen sizes
                    pointerEvents: showControls ? 'auto' : 'none', // Only clickable when controls are visible
                    '&:hover': {
                        background:
                            'linear-gradient(to right, rgba(0,0,0,0.1), transparent)',
                    },
                }}
                onClick={handlePrev}
            >
                {showControls && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '40%',
                            left: theme.spacing(2),
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 },
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            backdropFilter: 'blur(4px)',
                            color: 'white',
                            transition: 'all 0.2s ease',
                            opacity: 0.8,
                            '&:hover': {
                                opacity: 1,
                                backgroundColor: 'rgba(0,0,0,0.4)',
                            },
                        }}
                    >
                        <NavigateBeforeIcon
                            sx={{ fontSize: { xs: 18, sm: 24 } }}
                        />
                    </Box>
                )}
            </Box>

            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '20%',
                    height: '100%',
                    cursor: 'pointer',
                    zIndex: 4,
                    display: { xs: 'block' }, // Always block, visible on all screen sizes
                    pointerEvents: showControls ? 'auto' : 'none', // Only clickable when controls are visible
                    '&:hover': {
                        background:
                            'linear-gradient(to left, rgba(0,0,0,0.1), transparent)',
                    },
                }}
                onClick={handleNext}
            >
                {showControls && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '40%',
                            right: theme.spacing(2),
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 },
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            backdropFilter: 'blur(4px)',
                            color: 'white',
                            transition: 'all 0.2s ease',
                            opacity: 0.8,
                            '&:hover': {
                                opacity: 1,
                                backgroundColor: 'rgba(0,0,0,0.4)',
                            },
                        }}
                    >
                        <NavigateNextIcon
                            sx={{ fontSize: { xs: 18, sm: 24 } }}
                        />
                    </Box>
                )}
            </Box>

            {/* Dot indicators - always visible on mobile, only on hover for ALL desktop sizes */}
            <Box
                sx={{
                    position: 'absolute',
                    top: { xs: theme.spacing(2), sm: theme.spacing(3) },
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: isTrueMobile || showControls ? 'flex' : 'none',
                    gap: 1,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(3px)',
                    padding: '4px 8px',
                    borderRadius: 20,
                    zIndex: 5,
                    transition: 'opacity 0.3s ease',
                    opacity: isTrueMobile ? 1 : showControls ? 0.9 : 0,
                }}
            >
                {images.map((_, index) => (
                    <Box
                        key={index}
                        onClick={() => handleSelectImage(index)}
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor:
                                index === currentIndex
                                    ? 'white'
                                    : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default RecipeGallery;
