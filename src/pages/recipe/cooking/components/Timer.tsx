import { FC, useState, useEffect, useCallback } from 'react';
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

interface TimerProps {
    duration: number;
    maxDuration?: number;
    units: string;
    label?: string;
}

interface WakeLockSentinel {
    release(): Promise<void>;
}

interface WakeLock {
    request(type: 'screen'): Promise<WakeLockSentinel>;
}

function hasWakeLock(
    nav: Navigator
): nav is Navigator & { wakeLock: WakeLock } {
    return 'wakeLock' in nav;
}

const Timer: FC<TimerProps> = ({ duration, maxDuration, units, label }) => {
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

    const [timeLeft, setTimeLeft] = useState(initialDuration);
    const [isRunning, setIsRunning] = useState(false);
    const [hasFinished, setHasFinished] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(initialDuration);
    const [showNotification, setShowNotification] = useState(false);
    const [endTime, setEndTime] = useState<Date | null>(null);

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

    const progress = ((selectedDuration - timeLeft) / selectedDuration) * 100;

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

    useEffect(() => {
        let interval: number;
        let wakeLockSentinel: WakeLockSentinel | null = null;

        if (isRunning && timeLeft > 0) {
            try {
                if (hasWakeLock(navigator)) {
                    navigator.wakeLock
                        .request('screen')
                        .then((sentinel) => {
                            wakeLockSentinel = sentinel;
                        })
                        .catch(console.error);
                }
            } catch (err) {
                console.error('Wake Lock API not supported', err);
            }

            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        setHasFinished(true);
                        playNotification();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            clearInterval(interval);
            wakeLockSentinel?.release().catch(console.error);
        };
    }, [isRunning, timeLeft, playNotification]);

    useEffect(() => {
        if (isRunning) {
            const end = new Date();
            end.setSeconds(end.getSeconds() + timeLeft);
            setEndTime(end);
        } else {
            setEndTime(null);
        }
    }, [isRunning, timeLeft]);

    const handleStart = () => {
        setIsRunning(true);
        setHasFinished(false);
    };

    const handlePause = () => setIsRunning(false);

    const handleSliderChange = (_event: Event, value: number | number[]) => {
        if (!isRunning) {
            const newDuration = value as number;
            setSelectedDuration(newDuration);
            setTimeLeft(newDuration);
            setHasFinished(false);
        }
    };

    const getStatusText = () => {
        if (hasFinished) {
            return 'Timer complete!';
        }
        if (isRunning && endTime) {
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
                bgcolor: hasFinished
                    ? 'success.lighter'
                    : isRunning
                    ? 'primary.lighter'
                    : 'background.default',
                transition: 'all 0.3s ease',
                border: '1px solid',
                borderColor: hasFinished
                    ? 'success.light'
                    : isRunning
                    ? 'primary.light'
                    : 'divider',
                overflow: 'hidden',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
                maxWidth: { sm: 480, md: 560 },
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
                {/* Play/Pause Button Container */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                    }}
                >
                    <IconButton
                        onClick={isRunning ? handlePause : handleStart}
                        sx={{
                            width: { xs: 48, sm: 56 },
                            height: { xs: 48, sm: 56 },
                            bgcolor: isRunning
                                ? 'primary.main'
                                : 'success.main',
                            color: 'white',
                            '&:hover': {
                                bgcolor: isRunning
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
                        {isRunning ? (
                            <PauseIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                        ) : (
                            <PlayArrowIcon
                                sx={{ fontSize: { xs: 28, sm: 32 } }}
                            />
                        )}
                    </IconButton>
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
                        {/* Status Text - Only show if there's text to display */}
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

                        {/* Time Range Slider */}
                        {minSeconds !== maxSeconds &&
                            !isRunning &&
                            !hasFinished && (
                                <Box
                                    sx={{
                                        width: '100%',
                                        maxWidth: 180,
                                    }}
                                >
                                    <Slider
                                        value={selectedDuration}
                                        onChange={handleSliderChange}
                                        min={minSeconds}
                                        max={maxSeconds}
                                        step={30}
                                        sx={{
                                            '& .MuiSlider-markLabel': {
                                                fontSize: '0.75rem',
                                                color: 'text.secondary',
                                                mt: 0.5,
                                            },
                                            '& .MuiSlider-thumb': {
                                                width: { xs: 24, sm: 28 },
                                                height: { xs: 24, sm: 28 },
                                                backgroundColor:
                                                    'background.paper',
                                                boxShadow:
                                                    '0 2px 4px rgba(0,0,0,0.1)',
                                                '&:hover, &.Mui-focusVisible': {
                                                    boxShadow:
                                                        '0 0 0 8px rgba(25, 118, 210, 0.16)',
                                                },
                                            },
                                            '& .MuiSlider-track': {
                                                height: 6,
                                                border: 'none',
                                            },
                                            '& .MuiSlider-rail': {
                                                height: 6,
                                                opacity: 0.2,
                                            },
                                            '& .MuiSlider-mark': {
                                                display: 'none',
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
                            color: hasFinished
                                ? 'success.main'
                                : isRunning
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
                            color: hasFinished
                                ? 'success.dark'
                                : isRunning
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
