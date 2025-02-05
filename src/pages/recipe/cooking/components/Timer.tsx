import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Typography,
    IconButton,
    CircularProgress,
    Paper,
    Slider,
    Fade,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface TimerProps {
    duration: number;
    maxDuration?: number;
    units: string;
    label?: string;
    activeTimer?: {
        startTime: number;
        duration: number;
        isRunning: boolean;
        hasFinished: boolean;
    };
    onStart: (duration: number) => void;
    onPause: () => void;
    onResume: () => void;
    onReset: () => void;
}

const Timer: FC<TimerProps> = ({
    duration,
    maxDuration,
    units,
    label,
    activeTimer,
    onStart,
    onPause,
    onResume,
    onReset,
}) => {
    // Convert to seconds based on units
    const getSecondsFromDuration = (time: number) => {
        switch (units) {
            case 'minutes':
                return time * 60;
            case 'hours':
                return time * 3600;
            default:
                return time;
        }
    };

    const minSeconds = getSecondsFromDuration(duration);
    const maxSeconds = maxDuration
        ? getSecondsFromDuration(maxDuration)
        : minSeconds;

    // Initialize with middle value if there's a range
    const initialDuration = maxDuration
        ? Math.round((minSeconds + maxSeconds) / 2)
        : minSeconds;

    const [selectedDuration, setSelectedDuration] = useState(initialDuration);
    const [showNotification, setShowNotification] = useState(false);

    // Calculate time left and progress based on active timer
    const timeLeft = useMemo(() => {
        if (!activeTimer) return selectedDuration;
        const elapsed = Math.floor((Date.now() - activeTimer.startTime) / 1000);
        return Math.max(0, Math.floor(activeTimer.duration / 1000) - elapsed);
    }, [activeTimer, selectedDuration]);

    const progress = useMemo(() => {
        if (!activeTimer) return 0;
        const total = activeTimer.duration / 1000;
        return ((total - timeLeft) / total) * 100;
    }, [activeTimer, timeLeft]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
                .toString()
                .padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const formatEndTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const playNotification = useCallback(() => {
        setShowNotification(true);
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        const audio = new Audio('/notification.mp3');
        audio.play().catch(console.error);

        if (Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
                body: `Your ${label || 'timer'} has finished`,
                icon: '/timer-icon.png',
                badge: '/timer-badge.png',
            });
        }

        setTimeout(() => setShowNotification(false), 5000);
    }, [label]);

    // Handle timer completion
    useEffect(() => {
        if (activeTimer?.hasFinished) {
            playNotification();
        }
    }, [activeTimer?.hasFinished, playNotification]);

    const handleStart = () => {
        onStart(selectedDuration);
    };

    const handleSliderChange = (_event: Event, value: number | number[]) => {
        if (!activeTimer) {
            const newDuration = value as number;
            setSelectedDuration(newDuration);
        }
    };

    const getStatusText = () => {
        if (activeTimer?.hasFinished) {
            return 'Timer complete!';
        }
        if (activeTimer?.isRunning) {
            const endTime = new Date(
                activeTimer.startTime + activeTimer.duration
            );
            return `Ends at ${formatEndTime(endTime)}`;
        }
        return '';
    };

    return (
        <Paper
            elevation={0}
            sx={{
                position: 'relative',
                p: { xs: 1.5, sm: 2 },
                borderRadius: 4,
                bgcolor: activeTimer?.hasFinished
                    ? 'success.lighter'
                    : activeTimer?.isRunning
                    ? 'primary.lighter'
                    : 'background.default',
                transition: 'all 0.3s ease',
                border: '1px solid',
                borderColor: activeTimer?.hasFinished
                    ? 'success.light'
                    : activeTimer?.isRunning
                    ? 'primary.light'
                    : 'divider',
                overflow: 'hidden',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
                maxWidth: { sm: 480, md: 560 },
                margin: '0 auto',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1.5, sm: 2.5 },
                    height: { xs: 80, sm: 96 },
                }}
            >
                {/* Play/Pause/Reset Buttons */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        height: '100%',
                    }}
                >
                    <IconButton
                        onClick={
                            activeTimer
                                ? activeTimer.isRunning
                                    ? onPause
                                    : onResume
                                : handleStart
                        }
                        sx={{
                            width: { xs: 48, sm: 56 },
                            height: { xs: 48, sm: 56 },
                            bgcolor: activeTimer?.isRunning
                                ? 'primary.main'
                                : 'success.main',
                            color: 'white',
                            '&:hover': {
                                bgcolor: activeTimer?.isRunning
                                    ? 'primary.dark'
                                    : 'success.dark',
                            },
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transition: 'all 0.2s ease',
                            '&:active': {
                                transform: 'scale(0.96)',
                            },
                        }}
                    >
                        {activeTimer?.isRunning ? (
                            <PauseIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                        ) : (
                            <PlayArrowIcon
                                sx={{ fontSize: { xs: 28, sm: 32 } }}
                            />
                        )}
                    </IconButton>
                    {activeTimer && (
                        <IconButton
                            onClick={onReset}
                            sx={{
                                width: { xs: 36, sm: 42 },
                                height: { xs: 36, sm: 42 },
                                bgcolor: 'background.paper',
                                color: 'text.secondary',
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': {
                                    bgcolor: 'background.default',
                                    color: 'primary.main',
                                },
                            }}
                        >
                            <RestartAltIcon
                                sx={{ fontSize: { xs: 20, sm: 24 } }}
                            />
                        </IconButton>
                    )}
                </Box>

                {/* Middle section with slider and status */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        px: { xs: 2, sm: 3 },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            alignItems: 'center',
                        }}
                    >
                        {getStatusText() && (
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                    lineHeight: 1,
                                }}
                            >
                                {getStatusText()}
                            </Typography>
                        )}

                        {minSeconds !== maxSeconds && !activeTimer && (
                            <Box sx={{ width: '100%', maxWidth: 180 }}>
                                <Slider
                                    value={selectedDuration}
                                    onChange={handleSliderChange}
                                    min={minSeconds}
                                    max={maxSeconds}
                                    step={30}
                                    sx={{
                                        '& .MuiSlider-thumb': {
                                            width: { xs: 24, sm: 28 },
                                            height: { xs: 24, sm: 28 },
                                            backgroundColor: 'background.paper',
                                            boxShadow:
                                                '0 2px 4px rgba(0,0,0,0.1)',
                                            '&:hover, &.Mui-focusVisible': {
                                                boxShadow:
                                                    '0 0 0 8px rgba(25, 118, 210, 0.16)',
                                            },
                                        },
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Timer Display */}
                <Box
                    sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: { xs: 80, sm: 96 },
                        height: { xs: 80, sm: 96 },
                        flexShrink: 0,
                        bgcolor: 'background.paper',
                        borderRadius: '50%',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    <CircularProgress
                        variant="determinate"
                        value={progress}
                        size="100%"
                        thickness={3}
                        sx={{
                            position: 'absolute',
                            color: activeTimer?.hasFinished
                                ? 'success.main'
                                : activeTimer?.isRunning
                                ? 'primary.main'
                                : 'grey.200',
                            opacity: 0.8,
                        }}
                    />
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 600,
                            fontSize: { xs: '1.5rem', sm: '1.75rem' },
                            color: activeTimer?.hasFinished
                                ? 'success.dark'
                                : activeTimer?.isRunning
                                ? 'primary.dark'
                                : 'text.primary',
                            textAlign: 'center',
                            letterSpacing: -0.5,
                        }}
                    >
                        {formatTime(timeLeft)}
                    </Typography>
                </Box>
            </Box>

            {/* Notification Overlay */}
            <Fade in={showNotification}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'success.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 1.5,
                        color: 'white',
                        zIndex: 10,
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <NotificationsActiveIcon
                        sx={{
                            fontSize: { xs: 36, sm: 48 },
                            animation: 'pulse 1s infinite',
                            '@keyframes pulse': {
                                '0%': {
                                    transform: 'scale(1)',
                                },
                                '50%': {
                                    transform: 'scale(1.2)',
                                },
                                '100%': {
                                    transform: 'scale(1)',
                                },
                            },
                        }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            fontWeight: 600,
                            color: 'primary.contrastText',
                        }}
                    >
                        Timer complete!
                    </Typography>
                </Box>
            </Fade>
        </Paper>
    );
};

export default Timer;
