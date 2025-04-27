import React, { FC } from 'react';
import { Box, Typography, Button } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import { motion } from 'framer-motion';

// Add new props interface
interface ImageSectionProps {
    customDirection: number;
    getVariants: (direction: number) => any; // Use 'any' or a more specific type
}

const ImageSectionComponent: FC<ImageSectionProps> = ({
    // Update FC type
    customDirection,
    getVariants,
}) => (
    <motion.div
        key="image"
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
                opacity: 0.6,
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
                Create from Image (Coming Soon!)
            </Typography>
            <ImageIcon sx={{ fontSize: 60, color: 'text.secondary', my: 2 }} />
            <Typography
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 400, fontFamily: "'Inter', sans-serif" }}
            >
                Soon you'll be able to upload a photo of a meal, and our AI Chef
                will try to create a recipe for it.
            </Typography>
            <Button
                variant="outlined"
                size="large"
                disabled
                sx={{
                    height: 48,
                    fontFamily: "'Kalam', cursive",
                    fontSize: '1.1rem',
                }}
                startIcon={<ImageIcon />}
            >
                Upload Image
            </Button>
        </Box>
    </motion.div>
);

const ImageSection = React.memo(ImageSectionComponent);
export default ImageSection;
