import React, { useState } from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
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
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
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

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { user, signIn, signInWithGoogle } = useAuth();

    // If user is already logged in, redirect to home page
    if (user) {
        return <Navigate to={`/collection/all`} replace />;
    }

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setInfoMessage(null);

        try {
            const { error } = await signIn(email, password);
            if (error) {
                setError(error.message);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setInfoMessage(null);
        setIsLoading(true);
        try {
            const { error, isNewUser } = await signInWithGoogle();

            if (error) {
                if (isNewUser) {
                    // If it's a new user trying to sign in, show friendly message
                    setInfoMessage(
                        "We don't recognize that Google account. We're creating a new Simmer account for you now!"
                    );
                } else {
                    // Show the actual error for other issues
                    setError(error.message);
                }
            }
            // If no error, the OAuth flow will handle the redirect automatically
        } catch (err) {
            setError('An unexpected error occurred with Google login.');
            console.error(err);
        } finally {
            setIsLoading(false);
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
                backgroundColor: 'paper.light',
                backgroundImage: `url('https://storage.googleapis.com/simmer-recipe-images/public/simmer-login-background.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
                overflow: 'hidden',
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
                        Welcome to Simmer
                    </Typography>

                    <Typography
                        variant="body1"
                        align="center"
                        sx={{ mb: 4, color: 'text.secondary' }}
                    >
                        Your digital recipe notebook
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

                    {infoMessage && (
                        <Alert
                            severity="info"
                            sx={{
                                mb: 2,
                                backgroundColor: (theme) =>
                                    theme.palette.secondary.main,
                                border: (theme) =>
                                    `1px solid ${theme.palette.secondary.main}`,
                                '& .MuiAlert-icon': {
                                    color: (theme) =>
                                        theme.palette.secondary.contrastText,
                                },
                                '& .MuiAlert-message': {
                                    color: (theme) =>
                                        theme.palette.secondary.contrastText,
                                    fontWeight: 500,
                                },
                            }}
                        >
                            {infoMessage}
                        </Alert>
                    )}

                    <StyledButton
                        fullWidth
                        variant="contained"
                        color="primary"
                        startIcon={<GoogleIcon />}
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        sx={{ mb: 1 }}
                    >
                        Sign in with Google
                    </StyledButton>

                    <Divider sx={{ my: 3, color: 'text.secondary' }}>
                        or continue with email
                    </Divider>

                    <form onSubmit={handleEmailLogin}>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
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
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            required
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
                        <StyledButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} />
                            ) : (
                                'Sign In'
                            )}
                        </StyledButton>
                    </form>

                    <Box
                        sx={{
                            mt: 3,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            Don't have an account?{' '}
                            <RouterLink
                                to="/signup"
                                style={{
                                    color: '#F1C40F',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                }}
                            >
                                Sign up
                            </RouterLink>
                        </Typography>
                    </Box>
                </ContentBox>
            </StyledPaper>
        </Box>
    );
};

export default LoginPage;
