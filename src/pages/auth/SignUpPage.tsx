import { useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    CircularProgress,
    Alert,
    InputAdornment,
    IconButton,
    Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../../context/AuthContext';

// Custom styled components to match the paper notebook aesthetic
const StyledPaper = styled(Paper)(({ theme }) => ({
    position: 'relative',
    padding: theme.spacing(5),
    maxWidth: 500,
    width: 'calc(100% - 32px)',
    margin: '0 auto',
    backgroundColor: theme.palette.background.paper,
    backgroundImage: 'none',
    backgroundSize: 'cover',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    borderRadius: theme.spacing(1),
    '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        zIndex: 0,
        borderRadius: 'inherit',
        border: '1px solid',
        borderColor: theme.palette.divider,
    },
}));

const ContentBox = styled(Box)({
    position: 'relative',
    zIndex: 1,
});

const StyledButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(2),
    borderRadius: theme.spacing(0.75),
    padding: theme.spacing(1.25, 2),
    textTransform: 'none',
    boxShadow: 'none',
    fontFamily: '"Kalam", cursive',
    fontWeight: 'bold',
    '&:focus': {
        outline: 'none',
        boxShadow: 'none',
    },
    '&.MuiButtonBase-root:focus-visible': {
        outline: 'none',
    },
}));

const SignUpPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const { user, signUp, signInWithGoogle } = useAuth();

    // If user is already logged in, redirect to home page
    if (user) {
        return <Navigate to="/" replace />;
    }

    const validatePassword = (password: string): boolean => {
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            setError(
                'Your password needs to be between 6-30 characters. Please try again!'
            );
            return false;
        }

        if (password.length > 30) {
            setPasswordError('Password must be less than 30 characters');
            setError(
                'Your password needs to be between 6-30 characters. Please try again!'
            );
            return false;
        }

        setPasswordError(null);
        setError(null);
        return true;
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Validate password length
        if (!validatePassword(password)) {
            setIsLoading(false);
            return;
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            setError(
                'Passwords do not match. Please make sure both entries are the same.'
            );
            setIsLoading(false);
            return;
        }

        try {
            const { error, data } = await signUp(email, password);
            if (error) {
                setError(error.message);
            } else if (data) {
                setSuccessMessage(
                    'Success! Please check your email to confirm your account.'
                );
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err) {
            setError('An unexpected error occurred with Google signup.');
            console.error(err);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                width: '100vw',
                maxWidth: '100%',
                margin: 0,
                padding: 0,
                backgroundColor: '#F8F7FA',
                backgroundImage: 'none',
                backgroundSize: 'cover',
                position: 'relative',
                overflow: 'hidden',
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
            <StyledPaper elevation={3}>
                <ContentBox>
                    <Typography
                        variant="h4"
                        align="center"
                        gutterBottom
                        sx={{
                            fontFamily: '"Kalam", cursive',
                            fontWeight: 'bold',
                            color: 'primary.main',
                            mb: 3,
                        }}
                    >
                        Create an Account
                    </Typography>

                    <Typography
                        variant="body1"
                        align="center"
                        sx={{ mb: 4, color: 'text.secondary' }}
                    >
                        Sign up to start your recipe journey
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 2,
                                backgroundColor: (theme) =>
                                    theme.palette.error.light,
                                border: (theme) =>
                                    `1px solid ${theme.palette.error.main}`,
                                '& .MuiAlert-icon': {
                                    color: (theme) =>
                                        theme.palette.error.contrastText,
                                },
                                '& .MuiAlert-message': {
                                    color: (theme) =>
                                        theme.palette.error.contrastText,
                                    fontWeight: 500,
                                },
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {successMessage}
                        </Alert>
                    )}

                    <form onSubmit={handleSignUp}>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading || !!successMessage}
                            required
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                },
                            }}
                        />
                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (e.target.value) {
                                    validatePassword(e.target.value);
                                } else {
                                    setPasswordError(null);
                                    setError(null);
                                }
                            }}
                            disabled={isLoading || !!successMessage}
                            required
                            error={!!passwordError}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            edge="end"
                                            aria-label={
                                                showPassword
                                                    ? 'Hide password'
                                                    : 'Show password'
                                            }
                                        >
                                            {showPassword ? (
                                                <VisibilityOffIcon />
                                            ) : (
                                                <VisibilityIcon />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                },
                            }}
                        />
                        <TextField
                            label="Confirm Password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading || !!successMessage}
                            required
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                },
                            }}
                        />
                        <StyledButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            disabled={isLoading || !!successMessage}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} />
                            ) : (
                                'Sign Up'
                            )}
                        </StyledButton>
                    </form>

                    <Divider sx={{ my: 3, color: 'text.secondary' }}>
                        or
                    </Divider>

                    <StyledButton
                        fullWidth
                        onClick={handleGoogleSignUp}
                        startIcon={<GoogleIcon />}
                        sx={{
                            backgroundColor: '#fff',
                            color: (theme) => theme.palette.text.primary,
                            border: (theme) =>
                                `1px solid ${theme.palette.divider}`,
                            '&:hover': {
                                backgroundColor: (theme) =>
                                    theme.palette.grey[100],
                                border: (theme) =>
                                    `1px solid ${theme.palette.divider}`,
                                boxShadow: 'none',
                            },
                        }}
                    >
                        Continue with Google
                    </StyledButton>

                    <Box
                        sx={{
                            mt: 3,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            Already have an account?{' '}
                            <RouterLink
                                to="/login"
                                style={{
                                    color: '#F1C40F',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                }}
                            >
                                Sign in
                            </RouterLink>
                        </Typography>
                    </Box>
                </ContentBox>
            </StyledPaper>
        </Box>
    );
};

export default SignUpPage;
