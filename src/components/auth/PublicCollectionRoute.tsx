import { FC, ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import CatalogPage from '../../pages/catalog/CatalogPage';
import PublicCollectionPage from '../../pages/catalog/PublicCollectionPage';

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

    // Check collection access rights
    useEffect(() => {
        if (authLoading) return; // Wait for auth to finish loading
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
    }, [collectionId, user, authLoading, accessStatus]);

    // Show loading spinner while checking access
    if (accessStatus === 'loading' || authLoading) {
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

    // Render based on access status
    switch (accessStatus) {
        case 'owner':
        case 'shared':
            // Full edit access for owners and users with explicit share access
            return <CatalogPage />;
        case 'public-only':
            // Read-only access for users who can only see it because it's public
            return <PublicCollectionPage />;
        case 'no-access':
        default:
            // No access, redirect to login
            return <Navigate to="/login" state={{ from: location }} replace />;
    }
};

export default PublicCollectionRoute;
