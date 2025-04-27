import React, { FC } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import { motion } from 'framer-motion';

// Remove static variants definition
// const motionVariants = { ... };

interface BlankSectionProps {
    isLoading: boolean;
    handleCreateFromScratch: () => void;
    // Add new props
    customDirection: number;
    getVariants: (direction: number) => any; // Use 'any' or a more specific type
}

const BlankSectionComponent: FC<BlankSectionProps> = ({
    isLoading,
    handleCreateFromScratch,
    customDirection,
    getVariants,
}) => (
    <motion.div
        key="blank"
        custom={customDirection} // Pass custom prop
        variants={getVariants(customDirection)} // Call getVariants
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: '100%' }}
    >
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '100%',
                py: 4,
            }}
        >
            <Typography
                variant="h6"
                sx={{
                    mb: 1,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: 'text.primary',
                }}
            >
                Start from Scratch
            </Typography>
            <Typography
                color="text.secondary"
                sx={{
                    mb: 3,
                    maxWidth: 400,
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                Start with a blank page to create your own recipe.
            </Typography>
            <Button
                variant="contained"
                size="large"
                onClick={handleCreateFromScratch}
                disabled={isLoading}
                sx={{
                    height: 48,
                    fontFamily: "'Kalam', cursive",
                    fontSize: '1.1rem',
                }}
                startIcon={
                    isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        <CreateIcon />
                    )
                }
            >
                Create Blank Recipe
            </Button>
        </Box>
    </motion.div>
);

const BlankSection = React.memo(BlankSectionComponent);
export default BlankSection;
