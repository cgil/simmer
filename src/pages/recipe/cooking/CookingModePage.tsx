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
import StepNavigation from './components/StepNavigation';
import StepContent from './components/StepContent';
import { RecipeService } from '../../../services/RecipeService';
import { Recipe } from '../../../types/recipe';
import { useAuth } from '../../../context/AuthContext';
import { alpha } from '@mui/material/styles';
import logger from '../../../utils/logger';

interface ActiveTimer {
    sectionIndex: number;
    stepIndex: number;
    startTime: number;
    duration: number;
    isRunning: boolean;
    hasFinished: boolean;
    pausedAt: number | null;
    totalPausedTime: number;
}

const CookingModePage: FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [servings] = useState(location.state?.servings || 2);
    const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);

    // Fetch recipe data
    useEffect(() => {
        const fetchRecipe = async () => {
            if (!id) {
                navigate('/');
                return;
            }

            try {
                // Pass user ID if available, but don't require it for public recipes
                const fetchedRecipe = await RecipeService.getRecipeById(
                    id,
                    user?.id
                );

                if (fetchedRecipe) {
                    setRecipe(fetchedRecipe);
                } else {
                    // Recipe not found
                    navigate('/');
                }
            } catch (error) {
                logger.error('Error fetching recipe:', error);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [id, navigate, user?.id]);

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
                pausedAt: null,
                totalPausedTime: 0,
            },
        ]);
    };

    const pauseTimer = (sectionIndex: number, stepIndex: number) => {
        setActiveTimers((prev) =>
            prev.map((timer) =>
                timer.sectionIndex === sectionIndex &&
                timer.stepIndex === stepIndex
                    ? { ...timer, isRunning: false, pausedAt: Date.now() }
                    : timer
            )
        );
    };

    const resumeTimer = (sectionIndex: number, stepIndex: number) => {
        setActiveTimers((prev) =>
            prev.map((timer) => {
                if (
                    timer.sectionIndex === sectionIndex &&
                    timer.stepIndex === stepIndex &&
                    timer.pausedAt
                ) {
                    const additionalPausedTime = Date.now() - timer.pausedAt;
                    return {
                        ...timer,
                        isRunning: true,
                        pausedAt: null,
                        totalPausedTime:
                            timer.totalPausedTime + additionalPausedTime,
                    };
                }
                return timer;
            })
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

                    const elapsed =
                        Date.now() - timer.startTime - timer.totalPausedTime;
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
                logger.log('Wake Lock not supported or failed:', err);
            }
        };
        wakeLock();
    }, []);

    // Handle navigation if recipe is not found
    useEffect(() => {
        if (!recipe && !loading) {
            navigate('/');
        }
    }, [recipe, navigate, loading]);

    // Early return if recipe is not found or still loading
    if (loading) {
        return (
            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh',
                }}
            >
                <Typography variant="h5" sx={{ mb: 2 }}>
                    Loading recipe...
                </Typography>
                <Typography variant="body1">
                    Preparing your cooking mode experience
                </Typography>
            </Box>
        );
    }

    if (!recipe) {
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
                bgcolor: 'background.paper',
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
                    bgcolor: 'paper.light',
                    boxShadow: 'none',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: alpha(theme.palette.paper.light, 0.9),
                        boxShadow: 'inset 0 0 30px rgba(62, 28, 0, 0.05)',
                        pointerEvents: 'none',
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.8,
                        pointerEvents: 'none',
                        backgroundImage: `
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.05) 0.5px, transparent 0.5px),
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '6px 6px, 14px 14px',
                        backgroundPosition: '0 0',
                        mixBlendMode: 'multiply',
                        filter: 'opacity(1)',
                    },
                    '& > *': {
                        position: 'relative',
                        zIndex: 1,
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {!user ? (
                        // For non-authenticated users, show Simmer logo link
                        <Box
                            onClick={() => navigate('/login')}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                mr: 2,
                            }}
                        >
                            <Typography
                                variant={isMobile ? 'h6' : 'h5'}
                                sx={{
                                    fontFamily: "'Kalam', cursive",
                                    color: 'primary.main',
                                }}
                            >
                                Simmer
                            </Typography>
                        </Box>
                    ) : null}
                    <Typography
                        variant={isMobile ? 'h6' : 'h5'}
                        sx={{
                            fontFamily: "'Kalam', cursive",
                            color: 'primary.main',
                        }}
                    >
                        {recipe.title}
                    </Typography>
                </Box>
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
                        bgcolor: 'paper.light',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            boxShadow: 'inset 0 0 30px rgba(62, 28, 0, 0.05)',
                            pointerEvents: 'none',
                        },
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            opacity: 0.8,
                            pointerEvents: 'none',
                            backgroundImage: `
                                radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.05) 0.5px, transparent 0.5px),
                                radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.03) 1px, transparent 1px)
                            `,
                            backgroundSize: '6px 6px, 14px 14px',
                            backgroundPosition: '0 0',
                            mixBlendMode: 'multiply',
                            filter: 'opacity(1)',
                        },
                        '& > *': {
                            position: 'relative',
                            zIndex: 1,
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
                                const currentPauseTime = timer.pausedAt
                                    ? Date.now() - timer.pausedAt
                                    : 0;
                                const totalPauseTime =
                                    timer.totalPausedTime +
                                    (timer.pausedAt ? currentPauseTime : 0);
                                const elapsed = Math.floor(
                                    (Date.now() -
                                        timer.startTime -
                                        totalPauseTime) /
                                        1000
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
                    bgcolor: 'paper.light',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        boxShadow: 'inset 0 0 30px rgba(62, 28, 0, 0.05)',
                        pointerEvents: 'none',
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.8,
                        pointerEvents: 'none',
                        backgroundImage: `
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.05) 0.5px, transparent 0.5px),
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '6px 6px, 14px 14px',
                        backgroundPosition: '0 0',
                        mixBlendMode: 'multiply',
                        filter: 'opacity(1)',
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
