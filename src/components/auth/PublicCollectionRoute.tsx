import { FC, ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import CatalogPage from '../../pages/catalog/CatalogPage';
import PublicCollectionPage from '../../pages/catalog/PublicCollectionPage';
import { ALL_RECIPES_ID } from '../../types/collection';

interface PublicCollectionRouteProps {
    children?: ReactNode; // Not used but kept for flexibility
}

/**
 * A route component that checks collection access rights and renders the appropriate view:
 * 1. If user is owner or has explicit share → CatalogPage (editable)
 * 2. If collection is public → PublicCollectionPage (read-only)
 * 3. Otherwise → Redirect to login
 */
const PublicCollectionRoute: FC<PublicCollectionRouteProps> = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { collectionId } = useParams<{ collectionId: string }>();
    const location = useLocation();

    // Access state
    const [accessStatus, setAccessStatus] = useState<
        'loading' | 'owner' | 'shared' | 'public-only' | 'no-access'
    >('loading');

    const isAllRecipes = collectionId === ALL_RECIPES_ID;

    // Check collection access rights
    useEffect(() => {
        if (authLoading) return; // Wait for auth to finish loading

        // Handle the special "All Recipes" case early
        if (isAllRecipes) {
            if (user) {
                setAccessStatus('owner'); // Treat as owner for main view
            } else {
                setAccessStatus('no-access'); // Require login for All Recipes
            }
            return;
        }

        if (!collectionId) {
            setAccessStatus('no-access');
            return;
        }

        // Skip if already determined (not loading), prevents re-renders and flicker
        if (accessStatus !== 'loading') return;

        const checkAccess = async () => {
            try {
                // Always ensure we're in loading state at start of check
                setAccessStatus('loading');

                // First check if user is owner
                if (user) {
                    const { data: ownerData, error: ownerError } =
                        await supabase
                            .from('collections')
                            .select('user_id')
                            .eq('id', collectionId)
                            .single();

                    if (
                        !ownerError &&
                        ownerData &&
                        ownerData.user_id === user.id
                    ) {
                        setAccessStatus('owner');
                        return;
                    }

                    // If not owner, check for explicit share access
                    const { data: sharedData, error: sharedError } =
                        await supabase
                            .from('shared_collections')
                            .select('id')
                            .eq('collection_id', collectionId)
                            .eq('shared_with_user_id', user.id)
                            .maybeSingle();

                    if (!sharedError && sharedData) {
                        setAccessStatus('shared');
                        return;
                    }
                }

                // If user not owner or shared, check if collection is public
                const { data: publicData, error: publicError } = await supabase
                    .from('collections')
                    .select('is_public')
                    .eq('id', collectionId)
                    .eq('is_public', true)
                    .maybeSingle();

                if (!publicError && publicData) {
                    setAccessStatus('public-only');
                    return;
                }

                // None of the above, no access
                setAccessStatus('no-access');
            } catch (error) {
                console.error('Error checking collection access:', error);
                setAccessStatus('no-access');
            }
        };

        checkAccess();
    }, [collectionId, user, authLoading, accessStatus, isAllRecipes]);

    // Show loading spinner while checking access
    if (accessStatus === 'loading' || authLoading) {
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

    // Render based on access status with special case for All Recipes already handled
    if (accessStatus === 'owner' || accessStatus === 'shared') {
        return <CatalogPage />;
    }

    if (accessStatus === 'public-only') {
        return <PublicCollectionPage />;
    }

    // Fallback: no access
    return <Navigate to="/login" state={{ from: location }} replace />;
};

export default PublicCollectionRoute;
