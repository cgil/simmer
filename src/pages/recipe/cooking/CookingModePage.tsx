import { FC, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    IconButton,
    Typography,
    useTheme,
    useMediaQuery,
    Paper,
    Stack,
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TimerIcon from '@mui/icons-material/Timer';
import { MOCK_RECIPES } from '../../../mocks/recipes';
import StepNavigation from './components/StepNavigation';
import StepContent from './components/StepContent';

interface ActiveTimer {
    sectionIndex: number;
    stepIndex: number;
    startTime: number;
    duration: number;
    isRunning: boolean;
    hasFinished: boolean;
}

const CookingModePage: FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const recipe = MOCK_RECIPES.find((r) => r.id === id);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [servings] = useState(location.state?.servings || 2);
    const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);

    // Calculate total steps and current overall step
    const { totalSteps, currentOverallStep } = useMemo(() => {
        if (!recipe) return { totalSteps: 0, currentOverallStep: 0 };

        let total = 0;
        let current = 0;

        // Count steps before current section
        for (let i = 0; i < currentSectionIndex; i++) {
            total += recipe.instructions[i].steps.length;
            current += recipe.instructions[i].steps.length;
        }

        // Add steps in current section
        total += recipe.instructions[currentSectionIndex].steps.length;
        current += currentStep;

        // Add remaining sections' steps
        for (
            let i = currentSectionIndex + 1;
            i < recipe.instructions.length;
            i++
        ) {
            total += recipe.instructions[i].steps.length;
        }

        return { totalSteps: total, currentOverallStep: current };
    }, [recipe, currentSectionIndex, currentStep]);

    // Timer management functions
    const startTimer = (
        sectionIndex: number,
        stepIndex: number,
        duration: number
    ) => {
        setActiveTimers((prev) => [
            ...prev,
            {
                sectionIndex,
                stepIndex,
                startTime: Date.now(),
                duration: duration * 1000, // Convert to milliseconds
                isRunning: true,
                hasFinished: false,
            },
        ]);
    };

    const pauseTimer = (sectionIndex: number, stepIndex: number) => {
        setActiveTimers((prev) =>
            prev.map((timer) =>
                timer.sectionIndex === sectionIndex &&
                timer.stepIndex === stepIndex
                    ? { ...timer, isRunning: false }
                    : timer
            )
        );
    };

    const resumeTimer = (sectionIndex: number, stepIndex: number) => {
        setActiveTimers((prev) =>
            prev.map((timer) =>
                timer.sectionIndex === sectionIndex &&
                timer.stepIndex === stepIndex
                    ? { ...timer, isRunning: true }
                    : timer
            )
        );
    };

    const resetTimer = (sectionIndex: number, stepIndex: number) => {
        setActiveTimers((prev) =>
            prev.filter(
                (timer) =>
                    !(
                        timer.sectionIndex === sectionIndex &&
                        timer.stepIndex === stepIndex
                    )
            )
        );
    };

    // Update timer states
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTimers((prev) =>
                prev.map((timer) => {
                    if (!timer.isRunning || timer.hasFinished) return timer;

                    const elapsed = Date.now() - timer.startTime;
                    const hasFinished = elapsed >= timer.duration;

                    return {
                        ...timer,
                        hasFinished,
                        isRunning: !hasFinished,
                    };
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Keep screen on
    useEffect(() => {
        const wakeLock = async () => {
            try {
                await navigator.wakeLock?.request('screen');
            } catch (err) {
                console.log('Wake Lock not supported or failed:', err);
            }
        };
        wakeLock();
    }, []);

    if (!recipe) {
        navigate('/');
        return null;
    }

    const handleNext = () => {
        const currentSectionSteps =
            recipe.instructions[currentSectionIndex].steps.length;
        if (currentStep < currentSectionSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else if (currentSectionIndex < recipe.instructions.length - 1) {
            setCurrentSectionIndex(currentSectionIndex + 1);
            setCurrentStep(0);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else if (currentSectionIndex > 0) {
            setCurrentSectionIndex(currentSectionIndex - 1);
            setCurrentStep(
                recipe.instructions[currentSectionIndex - 1].steps.length - 1
            );
        }
    };

    return (
        <Box
            sx={{
                height: '100vh',
                width: '100vw',
                bgcolor: 'background.default',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 1200,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'background.paper',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
            >
                <Typography
                    variant={isMobile ? 'h6' : 'h5'}
                    sx={{
                        fontFamily: "'Kalam', cursive",
                        color: 'primary.main',
                    }}
                >
                    {recipe.title}
                </Typography>
                <IconButton
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            color: 'primary.main',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Active Timers Bar */}
            {activeTimers.length > 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        px: { xs: 2, sm: 3 },
                        py: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(255,255,255,0.5)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 0,
                        },
                    }}
                >
                    <Stack spacing={1.5}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: 'primary.dark',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                position: 'relative',
                                zIndex: 1,
                                fontFamily: "'Kalam', cursive",
                                fontSize: { xs: '1rem', sm: '1.1rem' },
                            }}
                        >
                            <TimerIcon
                                sx={{
                                    fontSize: { xs: 20, sm: 22 },
                                    color: 'primary.main',
                                }}
                            />
                            Active Timers ({activeTimers.length})
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                flexWrap: 'wrap',
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            {activeTimers.map((timer, index) => {
                                const section =
                                    recipe.instructions[timer.sectionIndex];
                                const stepNumber =
                                    recipe.instructions
                                        .slice(0, timer.sectionIndex)
                                        .reduce(
                                            (acc, section) =>
                                                acc + section.steps.length,
                                            0
                                        ) +
                                    timer.stepIndex +
                                    1;
                                const elapsed = Math.floor(
                                    (Date.now() - timer.startTime) / 1000
                                );
                                const timeLeft = Math.max(
                                    0,
                                    Math.floor(timer.duration / 1000) - elapsed
                                );
                                const minutes = Math.floor(timeLeft / 60);
                                const seconds = timeLeft % 60;

                                return (
                                    <Chip
                                        key={index}
                                        label={
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    component="span"
                                                >
                                                    {section.section_title} -
                                                    Step {stepNumber}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    component="span"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: timer.hasFinished
                                                            ? 'success.main'
                                                            : timer.isRunning
                                                            ? 'primary.main'
                                                            : 'text.primary',
                                                    }}
                                                >
                                                    {minutes}:
                                                    {seconds
                                                        .toString()
                                                        .padStart(2, '0')}
                                                </Typography>
                                            </Box>
                                        }
                                        onClick={() => {
                                            setCurrentSectionIndex(
                                                timer.sectionIndex
                                            );
                                            setCurrentStep(timer.stepIndex);
                                        }}
                                        onDelete={() =>
                                            resetTimer(
                                                timer.sectionIndex,
                                                timer.stepIndex
                                            )
                                        }
                                        color={
                                            timer.hasFinished
                                                ? 'success'
                                                : timer.isRunning
                                                ? 'primary'
                                                : 'default'
                                        }
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2,
                                            '& .MuiChip-label': {
                                                px: 1,
                                            },
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow:
                                                    '0 2px 4px rgba(0,0,0,0.1)',
                                            },
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </Stack>
                </Paper>
            )}

            {/* Main Content Area */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    bgcolor: 'background.default',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        boxShadow: 'inset 0 0 100px rgba(62, 28, 0, 0.03)',
                        pointerEvents: 'none',
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.3,
                        pointerEvents: 'none',
                        backgroundImage: `
                            linear-gradient(rgba(62, 28, 0, 0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(62, 28, 0, 0.03) 1px, transparent 1px),
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '24px 24px, 24px 24px, 12px 12px',
                        backgroundPosition: '-1px -1px, -1px -1px, -1px -1px',
                        mixBlendMode: 'multiply',
                    },
                }}
            >
                <StepContent
                    recipe={recipe}
                    currentStep={currentStep}
                    currentSectionIndex={currentSectionIndex}
                    servings={servings}
                    activeTimers={activeTimers}
                    onStartTimer={startTimer}
                    onPauseTimer={pauseTimer}
                    onResumeTimer={resumeTimer}
                    onResetTimer={resetTimer}
                />
            </Box>

            {/* Navigation */}
            <StepNavigation
                currentStep={currentOverallStep}
                totalSteps={totalSteps}
                onPrevious={handlePrevious}
                onNext={handleNext}
            />
        </Box>
    );
};

export default CookingModePage;
