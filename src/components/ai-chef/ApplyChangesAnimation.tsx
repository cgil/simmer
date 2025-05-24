import { FC, useEffect } from 'react';
import { Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { GiSparkles } from 'react-icons/gi';

interface ApplyChangesAnimationProps {
    isAnimating: boolean;
    onAnimationComplete: () => void;
}

// Helper function to generate random sparkle positions
const generateSparkles = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // random x position (%)
        y: Math.random() * 100, // random y position (%)
        size: 8 + Math.random() * 14, // random size between 8-22px
        delay: Math.random() * 0.3, // random delay for animation
        duration: 0.6 + Math.random() * 0.5, // random duration
    }));
};

const ApplyChangesAnimation: FC<ApplyChangesAnimationProps> = ({
    isAnimating,
    onAnimationComplete,
}) => {
    // Generate 25 sparkles
    const sparkles = generateSparkles(25);

    // Auto-trigger onAnimationComplete when animation ends
    useEffect(() => {
        if (isAnimating) {
            const timer = setTimeout(() => {
                onAnimationComplete();
            }, 1000); // Match this with the total animation duration
            return () => clearTimeout(timer);
        }
    }, [isAnimating, onAnimationComplete]);

    return (
        <AnimatePresence>
            {isAnimating && (
                <Box
                    component={motion.div}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        overflow: 'hidden',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Golden Shimmer Overlay */}
                    <Box
                        component={motion.div}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            right: 0,
                            bottom: 0,
                            background:
                                'linear-gradient(90deg, rgba(255,249,196,0) 0%, rgba(255,236,96,0.4) 50%, rgba(255,249,196,0) 100%)',
                            zIndex: 1,
                        }}
                        initial={{ x: '0%' }}
                        animate={{ x: '200%' }}
                        transition={{
                            duration: 0.8,
                            ease: 'easeInOut',
                        }}
                    />

                    {/* Sparkles */}
                    {sparkles.map((sparkle) => (
                        <Box
                            component={motion.div}
                            key={sparkle.id}
                            sx={{
                                position: 'absolute',
                                left: `${sparkle.x}%`,
                                top: `${sparkle.y}%`,
                                color: '#FFD700',
                                zIndex: 2,
                            }}
                            initial={{
                                opacity: 0,
                                scale: 0,
                                rotate: -45,
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1.2, 0],
                                rotate: 45,
                            }}
                            transition={{
                                duration: sparkle.duration,
                                delay: sparkle.delay,
                                ease: 'easeOut',
                            }}
                        >
                            <GiSparkles size={sparkle.size} />
                        </Box>
                    ))}

                    {/* Central burst effect */}
                    <Box
                        component={motion.div}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            background:
                                'radial-gradient(circle, rgba(255,236,96,0.8) 0%, rgba(255,249,196,0) 70%)',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.5, 3], opacity: [0, 0.7, 0] }}
                        transition={{
                            duration: 0.8,
                            ease: 'easeOut',
                        }}
                    />
                </Box>
            )}
        </AnimatePresence>
    );
};

export default ApplyChangesAnimation;
