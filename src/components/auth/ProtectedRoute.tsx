import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    width: '100vw',
                    maxWidth: '100%',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bgcolor: 'background.default',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    // If user is not authenticated, redirect to login page
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user is authenticated, render the protected component
    return <>{children}</>;
};

export default ProtectedRoute;
