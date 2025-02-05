import { FC } from 'react';
import { Box, IconButton, Typography, LinearProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface StepNavigationProps {
    currentStep: number;
    totalSteps: number;
    onPrevious: () => void;
    onNext: () => void;
}

const StepNavigation: FC<StepNavigationProps> = ({
    currentStep,
    totalSteps,
    onPrevious,
    onNext,
}) => {
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
                px: { xs: 2, sm: 3 },
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                boxShadow: '0 -1px 2px rgba(0,0,0,0.05)',
                zIndex: 1200,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                }}
            >
                <IconButton
                    onClick={onPrevious}
                    disabled={currentStep === 0}
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            color: 'primary.main',
                        },
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography
                    sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        color: 'text.secondary',
                    }}
                >
                    Step {currentStep + 1} of {totalSteps}
                </Typography>
                <IconButton
                    onClick={onNext}
                    disabled={currentStep === totalSteps - 1}
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            color: 'primary.main',
                        },
                    }}
                >
                    <ArrowForwardIcon />
                </IconButton>
            </Box>
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    '& .MuiLinearProgress-bar': {
                        bgcolor: 'primary.main',
                        borderRadius: 2,
                    },
                }}
            />
        </Box>
    );
};

export default StepNavigation;
