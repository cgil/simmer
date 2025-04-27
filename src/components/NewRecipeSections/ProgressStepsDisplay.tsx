import React, { FC } from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';

interface ProgressStepsDisplayProps {
    steps: string[];
    activeStep: number;
    isFinalizing?: boolean;
}

const ProgressStepsDisplayComponent: FC<ProgressStepsDisplayProps> = ({
    steps,
    activeStep,
    isFinalizing = false,
}) => {
    const progressValue = isFinalizing
        ? 100
        : (activeStep / (steps.length - 1)) * 100;
    const progressVariant = isFinalizing ? 'indeterminate' : 'determinate';

    return (
        <Box sx={{ width: '100%' }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 3 },
                    mb: 3,
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: { xs: 0, sm: 'calc(20px + 1rem)' },
                        left: { xs: 'calc(20px + 1rem)', sm: 0 },
                        right: { xs: 'calc(20px + 1rem)', sm: 0 },
                        height: { xs: '100%', sm: '1px' },
                        width: { xs: '1px', sm: '100%' },
                        background:
                            'repeating-linear-gradient(to right, #ddd 0, #ddd 4px, transparent 4px, transparent 8px)',
                        transform: {
                            xs: 'translateX(-50%)',
                            sm: 'translateY(-50%)',
                        },
                        zIndex: 0,
                    },
                }}
            >
                {steps.map((label, index) => (
                    <Paper
                        key={label}
                        elevation={0}
                        sx={{
                            flex: 1,
                            p: 2,
                            position: 'relative',
                            zIndex: 1,
                            bgcolor:
                                index === activeStep
                                    ? 'primary.lighter'
                                    : index < activeStep
                                    ? 'success.lighter'
                                    : 'background.paper',
                            border: '1px solid',
                            borderColor:
                                index === activeStep
                                    ? 'primary.light'
                                    : index < activeStep
                                    ? 'success.light'
                                    : 'divider',
                            borderRadius: 2,
                            transform:
                                index === activeStep ? 'rotate(-1deg)' : 'none',
                            transition: 'all 0.3s ease',
                            boxShadow:
                                index === activeStep
                                    ? '0 4px 12px rgba(0,0,0,0.1)'
                                    : '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            minHeight: { xs: 'auto', sm: 140 },
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(255,255,255,0.7)',
                                backdropFilter: 'blur(2px)',
                                borderRadius: 2,
                                zIndex: 0,
                            },
                            ...(isFinalizing &&
                                index === steps.length - 1 &&
                                {
                                    // Optional: add subtle indication on the last paper
                                }),
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor:
                                    index === activeStep
                                        ? 'primary.main'
                                        : index < activeStep
                                        ? 'success.main'
                                        : 'grey.300',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: "'Kalam', cursive",
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            {index < activeStep ||
                            (isFinalizing && index === activeStep)
                                ? '✓'
                                : index + 1}
                        </Box>
                        <Typography
                            sx={{
                                fontFamily: "'Kalam', cursive",
                                fontSize: '1rem',
                                fontWeight: index === activeStep ? 700 : 500,
                                color:
                                    index === activeStep
                                        ? 'primary.main'
                                        : index < activeStep
                                        ? 'success.dark'
                                        : 'text.secondary',
                                textAlign: 'center',
                                position: 'relative',
                                zIndex: 1,
                                maxWidth: 160,
                                mx: 'auto',
                            }}
                        >
                            {label}
                        </Typography>
                    </Paper>
                ))}
            </Box>
            <LinearProgress
                variant={progressVariant}
                value={
                    progressVariant === 'determinate'
                        ? progressValue
                        : undefined
                }
                sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                    },
                }}
            />
        </Box>
    );
};

const ProgressStepsDisplay = React.memo(ProgressStepsDisplayComponent);
export default ProgressStepsDisplay;
