import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import ShareDialog from './ShareDialog';
import { SharingService } from '../../services/SharingService';

// Define types for the share details
interface SharedUser {
    id: string;
    email: string;
    avatarUrl?: string;
    access: 'view' | 'edit' | 'owner';
    shareId?: string;
}

interface ShareDetailsType {
    sharedUsers: SharedUser[];
    owner?: {
        id: string;
        email: string;
        avatarUrl?: string;
    };
    isPublic: boolean;
    itemTitle?: string;
}

interface ShareDialogContainerProps {
    open: boolean;
    onClose: () => void;
    itemId: string;
    itemType: 'recipe' | 'collection';
    itemTitle: string;
    title?: string;
}

// Define the component using React.memo for optimization
const ShareDialogContainer: React.FC<ShareDialogContainerProps> = React.memo(
    ({ open, onClose, itemId, itemType, itemTitle, title }) => {
        const { user } = useAuth();
        const [shareDetails, setShareDetails] =
            useState<ShareDetailsType | null>(null);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);

        // Fetch share details when dialog is opened
        const fetchShareDetails = useCallback(async () => {
            if (!open || !itemId) return;

            setIsLoading(true);
            setError(null);

            try {
                const details = await SharingService.getShareDetails(
                    itemId,
                    itemType
                );
                if (details) {
                    setShareDetails(details);
                }
            } catch (err) {
                console.error('Error fetching share details:', err);
                setError('Failed to load sharing information');
            } finally {
                setIsLoading(false);
            }
        }, [open, itemId, itemType]);

        useEffect(() => {
            if (open) {
                fetchShareDetails();
            }
        }, [open, fetchShareDetails]);

        // Handle inviting a user
        const handleInvite = useCallback(
            async (email: string, access: 'view' | 'edit' | 'owner') => {
                try {
                    // Convert the access level if 'owner' is selected (which is not actually allowed)
                    const serviceAccess = access === 'owner' ? 'edit' : access;

                    await SharingService.shareWithUser(
                        itemId,
                        itemType,
                        email,
                        serviceAccess
                    );
                    // Refresh share details after invite
                    fetchShareDetails();
                } catch (err) {
                    console.error('Error inviting user:', err);
                    throw new Error('Failed to invite user');
                }
            },
            [itemId, itemType, fetchShareDetails]
        );

        // Handle updating a user's access level
        const handleUpdateAccess = useCallback(
            async (userId: string, newAccess: 'view' | 'edit' | 'owner') => {
                // Find the specific share record for this user
                const share = shareDetails?.sharedUsers.find(
                    (u) => u.id === userId
                );
                if (!share || !share.shareId) {
                    throw new Error(
                        'Could not find share information for this user.'
                    );
                }

                try {
                    // We only allow updating to 'view' or 'edit', not to 'owner'
                    if (newAccess !== 'owner') {
                        await SharingService.updateAccessLevel(
                            share.shareId,
                            itemType,
                            newAccess
                        );
                        // Refresh share details after update
                        fetchShareDetails();
                    } else {
                        throw new Error('Cannot change a user to owner');
                    }
                } catch (err) {
                    console.error('Error updating access:', err);
                    throw new Error('Failed to update access');
                }
            },
            [itemType, fetchShareDetails, shareDetails]
        );

        // Handle removing a user's access
        const handleRemoveAccess = useCallback(
            async (userId: string) => {
                // Find the specific share record for this user
                const share = shareDetails?.sharedUsers.find(
                    (u) => u.id === userId
                );
                if (!share || !share.shareId) {
                    throw new Error(
                        'Could not find share information for this user.'
                    );
                }

                try {
                    await SharingService.removeAccess(share.shareId, itemType);
                    // Refresh share details after removal
                    fetchShareDetails();
                } catch (err) {
                    console.error('Error removing access:', err);
                    throw new Error('Failed to remove access');
                }
            },
            [itemType, fetchShareDetails, shareDetails]
        );

        // Handle changing public/private status
        const handlePublicChange = useCallback(
            async (isPublic: boolean) => {
                if (!shareDetails) {
                    return;
                }

                // Only proceed if there's an actual change
                if (shareDetails.isPublic === isPublic) {
                    return;
                }

                try {
                    // Update the state immediately for better UX
                    setShareDetails((prev) => {
                        if (!prev) return prev;
                        return { ...prev, isPublic };
                    });

                    // Then update the backend
                    await SharingService.updatePublicStatus(
                        itemId,
                        itemType,
                        isPublic
                    );

                    // No need to fetch again as we've already updated the state
                    // This prevents unnecessary rerenders
                } catch (err) {
                    console.error('Error updating visibility:', err);

                    // Revert to previous state on error
                    setShareDetails((prev) => {
                        if (!prev) return prev;
                        return { ...prev, isPublic: !isPublic };
                    });

                    throw new Error('Failed to update visibility');
                }
            },
            [itemId, itemType, shareDetails]
        );

        // Determine dialog title based on item type
        const dialogTitle = useMemo(() => {
            return (
                title ||
                `Share ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`
            );
        }, [itemType, title]);

        // Memoize the ShareDialog props to prevent unnecessary rerenders
        const dialogProps = useMemo(
            () => ({
                open,
                onClose,
                title: dialogTitle,
                itemType,
                itemTitle: shareDetails?.itemTitle || itemTitle,
                onInvite: handleInvite,
                onUpdateAccess: handleUpdateAccess,
                onRemoveAccess: handleRemoveAccess,
                sharedUsers: shareDetails?.sharedUsers || [],
                ownerEmail: shareDetails?.owner?.email,
                ownerAvatarUrl: shareDetails?.owner?.avatarUrl,
                ownerId: shareDetails?.owner?.id,
                currentUserId: user?.id,
                isPublic: shareDetails?.isPublic,
                onPublicChange: handlePublicChange,
            }),
            [
                open,
                onClose,
                dialogTitle,
                itemType,
                shareDetails,
                itemTitle,
                handleInvite,
                handleUpdateAccess,
                handleRemoveAccess,
                user?.id,
                handlePublicChange,
            ]
        );

        if (isLoading && !shareDetails) {
            return <div>Loading share details...</div>;
        }

        if (error && !shareDetails) {
            return <div>Error: {error}</div>;
        }

        return <ShareDialog {...dialogProps} />;
    }
);

export default ShareDialogContainer;
