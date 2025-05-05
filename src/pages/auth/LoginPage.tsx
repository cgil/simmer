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
    Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../context/AuthContext';

// Custom styled components with enhanced paper notebook aesthetic
const NotebookPaper = styled(Paper)({
    position: 'relative',
    padding: '48px 40px',
    maxWidth: 480,
    width: 'calc(100% - 32px)',
    margin: '0 auto',
    backgroundColor: '#FFFDF9',
    boxShadow:
        '0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07)',
    borderRadius: '3px',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 36,
        height: '100%',
        width: '1px',
        backgroundColor: 'rgba(216, 134, 90, 0.15)',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        backgroundImage:
            'linear-gradient(rgba(240, 238, 230, 0.5) 1px, transparent 1px)',
        backgroundSize: '100% 25px',
        pointerEvents: 'none',
        zIndex: 1,
    },
});

const PaperEdge = styled(Box)({
    position: 'absolute',
    top: 0,
    right: 0,
    width: '15px',
    height: '100%',
    background:
        'linear-gradient(to right, transparent, rgba(0, 0, 0, 0.03) 40%, rgba(0, 0, 0, 0.05))',
    borderTopRightRadius: '3px',
    borderBottomRightRadius: '3px',
    zIndex: 3,
});

const NotebookHole = styled(Box)<{ top: number }>((props) => ({
    position: 'absolute',
    left: '18px',
    top: `${props.top}px`,
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    boxShadow: 'inset 0 0 4px rgba(0, 0, 0, 0.15)',
    zIndex: 2,
}));

const ContentBox = styled(Box)({
    position: 'relative',
    zIndex: 3,
    marginLeft: '30px',
});

const HandwrittenTitle = styled(Typography)(({ theme }) => ({
    fontFamily: '"Kalam", cursive',
    fontWeight: 'bold',
    color: theme.palette.primary.main,
    position: 'relative',
    display: 'inline-block',
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '2px',
        left: '0',
        width: '100%',
        height: '6px',
        background: 'rgba(241, 196, 15, 0.3)',
        zIndex: -1,
        transformOrigin: 'bottom left',
    },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    marginTop: theme.spacing(2.5),
    marginBottom: theme.spacing(0.5),
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '2px',
        transition: '0.3s',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: 'none',

        '&:hover': {
            border: '1px solid rgba(0, 0, 0, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
        },
        '&.Mui-focused': {
            border: '1px solid rgba(44, 62, 80, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 0 0 3px rgba(241, 196, 15, 0.15)',
        },
        '& fieldset': {
            borderColor: 'transparent',
            transition: 'border-color 0.2s',
        },
        '&:hover fieldset': {
            borderColor: 'transparent',
        },
        '&.Mui-focused fieldset': {
            borderColor: 'transparent',
            borderWidth: 0,
        },
    },
    '& .MuiInputLabel-root': {
        fontFamily: '"Inter", sans-serif',
        fontSize: '0.9rem',
        color: theme.palette.primary.main,
        opacity: 0.8,

        '&.Mui-focused': {
            color: theme.palette.primary.main,
            opacity: 1,
        },
    },
    '& .MuiInputBase-input': {
        padding: theme.spacing(1.5, 2),
    },
}));

const NotebookButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(3),
    padding: theme.spacing(1.25, 2),
    borderRadius: '2px',
    textTransform: 'none',
    fontFamily: '"Kalam", cursive',
    fontWeight: 'bold',
    fontSize: '1rem',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',

    '&:hover': {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-1px)',
    },
    '&:active': {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        transform: 'translateY(1px)',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background:
            'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.1) 100%)',
        pointerEvents: 'none',
    },
}));

const GoogleNotebookButton = styled(NotebookButton)(({ theme }) => ({
    backgroundColor: '#ffffff',
    color: theme.palette.primary.main,
    border: '1px solid rgba(0, 0, 0, 0.1)',
    '&:hover': {
        backgroundColor: '#f8f8f8',
        borderColor: 'rgba(0, 0, 0, 0.2)',
    },
}));

const PageDivider = styled(Divider)(({ theme }) => ({
    margin: theme.spacing(3, 0),
    '&::before, &::after': {
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    '& .MuiDivider-wrapper': {
        fontFamily: '"Kalam", cursive',
        fontSize: '0.875rem',
        color: theme.palette.text.secondary,
        paddingTop: '4px',
    },
}));

const StyledLink = styled(RouterLink)({
    color: '#F1C40F',
    textDecoration: 'none',
    fontWeight: 600,
    position: 'relative',
    display: 'inline-block',
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '-2px',
        left: 0,
        width: '100%',
        height: '2px',
        backgroundColor: '#F1C40F',
        transform: 'scaleX(0)',
        transformOrigin: 'bottom right',
        transition: 'transform 0.3s ease',
    },
    '&:hover::after': {
        transform: 'scaleX(1)',
        transformOrigin: 'bottom left',
    },
});

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
                backgroundColor: '#FBF6E8',
                backgroundImage: `url('https://storage.googleapis.com/simmer-recipe-images/public/simmer-login-background.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <NotebookPaper elevation={0}>
                {/* Notebook holes */}
                <NotebookHole top={60} />
                <NotebookHole top={140} />
                <NotebookHole top={220} />
                <NotebookHole top={300} />
                <NotebookHole top={380} />

                {/* Curved paper edge */}
                <PaperEdge />

                <ContentBox>
                    <Stack spacing={1} alignItems="center" mb={3}>
                        <HandwrittenTitle variant="h4">
                            Welcome to Simmer
                        </HandwrittenTitle>
                        <Typography
                            variant="body1"
                            align="center"
                            sx={{
                                color: 'text.secondary',
                                mt: 1,
                                fontFamily: '"Inter", sans-serif',
                                fontSize: '0.95rem',
                            }}
                        >
                            Your personal recipe notebook
                        </Typography>
                    </Stack>

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
                                    fontFamily: '"Inter", sans-serif',
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
                                backgroundColor: 'rgba(241, 196, 15, 0.1)',
                                border: '1px solid rgba(241, 196, 15, 0.3)',
                                '& .MuiAlert-icon': {
                                    color: 'rgba(44, 62, 80, 0.8)',
                                },
                                '& .MuiAlert-message': {
                                    color: 'rgba(44, 62, 80, 0.8)',
                                    fontWeight: 500,
                                    fontFamily: '"Inter", sans-serif',
                                },
                            }}
                        >
                            {infoMessage}
                        </Alert>
                    )}

                    <GoogleNotebookButton
                        fullWidth
                        variant="outlined"
                        startIcon={<GoogleIcon />}
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        Continue with Google
                    </GoogleNotebookButton>

                    <PageDivider>or sign in with email</PageDivider>

                    <form onSubmit={handleEmailLogin}>
                        <StyledTextField
                            label="Email"
                            type="email"
                            fullWidth
                            variant="outlined"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                        <StyledTextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            variant="outlined"
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
                        />
                        <NotebookButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Open Notebook'
                            )}
                        </NotebookButton>
                    </form>

                    <Box
                        sx={{
                            mt: 3,
                            display: 'flex',
                            justifyContent: 'center',
                            fontFamily: '"Inter", sans-serif',
                        }}
                    >
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontFamily: '"Inter", sans-serif' }}
                        >
                            Don't have an account?{' '}
                            <StyledLink to="/signup">Sign up</StyledLink>
                        </Typography>
                    </Box>
                </ContentBox>
            </NotebookPaper>
        </Box>
    );
};

export default LoginPage;
