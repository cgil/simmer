import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { RecipeService } from '../../services/RecipeService';

interface PublicRecipeRouteProps {
    children: ReactNode;
}

/**
 * A route component that checks if a recipe is public before enforcing authentication.
 * - If the recipe is public, allows access without authentication
 * - If the recipe is private or doesn't exist, requires authentication
 * - If loading, shows a loading spinner
 */
const PublicRecipeRoute = ({ children }: PublicRecipeRouteProps) => {
    const { user, isLoading: authLoading } = useAuth();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

    const [isPublicRecipe, setIsPublicRecipe] = useState<boolean | null>(null);
    const [isCheckingRecipe, setIsCheckingRecipe] = useState(true);

    // Check if this recipe is public
    useEffect(() => {
        const checkRecipePublicStatus = async () => {
            if (!id) {
                setIsPublicRecipe(false);
                setIsCheckingRecipe(false);
                return;
            }

            try {
                // Try to fetch the recipe without a user ID first to check if it's public
                const recipe = await RecipeService.getRecipeById(id);
                setIsPublicRecipe(!!recipe); // If recipe is returned, it's public
            } catch (error) {
                console.error('Error checking recipe public status:', error);
                setIsPublicRecipe(false);
            } finally {
                setIsCheckingRecipe(false);
            }
        };

        checkRecipePublicStatus();
    }, [id]);

    // Show loading spinner while checking authentication or recipe public status
    if (authLoading || isCheckingRecipe) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: '#F8F7FA',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    // If user is authenticated, always allow access
    if (user) {
        return <>{children}</>;
    }

    // If recipe is public, allow access even without authentication
    if (isPublicRecipe) {
        return <>{children}</>;
    }

    // If recipe is not public and user is not authenticated, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
};

export default PublicRecipeRoute;
