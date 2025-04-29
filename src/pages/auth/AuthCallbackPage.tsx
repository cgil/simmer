import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { supabase } from '../../lib/supabase';

const AuthCallbackPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [redirectTo, setRedirectTo] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the URL hash (for magic link and OAuth provider redirects)
                const hash = window.location.hash;
                const query = new URLSearchParams(window.location.search);

                if (hash || query.has('code')) {
                    // Get previously stored redirect path or default to home
                    const redirectPath =
                        sessionStorage.getItem('redirectAfterAuth') ||
                        '/collection/all';

                    // Process the auth callback
                    const { error } = await supabase.auth.getSession();

                    if (error) {
                        setError(error.message);
                    } else {
                        setRedirectTo(redirectPath);
                    }
                } else {
                    // No auth callback parameters found
                    setRedirectTo('/login');
                }
            } catch (err) {
                console.error('Error processing auth callback:', err);
                setError('Failed to process authentication. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        handleCallback();
    }, []);

    // Show loading state
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: '#F8F7FA',
                }}
            >
                <CircularProgress sx={{ mb: 3 }} />
                <Typography variant="body1">
                    Processing your login...
                </Typography>
            </Box>
        );
    }

    // Show error message
    if (error) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: '#F8F7FA',
                    p: 3,
                    textAlign: 'center',
                }}
            >
                <Typography variant="h6" color="error" gutterBottom>
                    Authentication Error
                </Typography>
                <Typography variant="body1">{error}</Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                    <a href="/login" style={{ color: '#F1C40F' }}>
                        Return to login
                    </a>
                </Typography>
            </Box>
        );
    }

    // Redirect to appropriate page
    return <Navigate to={redirectTo || '/'} replace />;
};

export default AuthCallbackPage;
