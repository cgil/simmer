import { FC, useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    List,
    ListItem,
    ListItemAvatar,
    IconButton,
    Typography,
    Chip,
    Menu,
    MenuItem,
    Divider,
    CircularProgress,
    alpha,
    Tooltip,
    Select,
    FormControl,
    InputLabel,
    SelectChangeEvent,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import UserAvatar from '../common/UserAvatar';

// Type for shared user access level
type AccessLevel = 'view' | 'edit' | 'owner';

// Interface for user with access
interface SharedUser {
    id: string;
    email: string;
    avatarUrl?: string;
    access: AccessLevel;
    isCurrentUser?: boolean;
}

interface ShareDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    itemType: 'recipe' | 'collection';
    itemTitle: string;
    // For now, these would just be mock props since we're not connecting
    // to the actual functionality yet
    onInvite?: (email: string, access: AccessLevel) => Promise<void>;
    onRemoveAccess?: (userId: string) => Promise<void>;
    onUpdateAccess?: (userId: string, newAccess: AccessLevel) => Promise<void>;
    // Mock shared users for testing UI
    sharedUsers?: SharedUser[];
    // Owner info
    ownerEmail?: string;
    ownerAvatarUrl?: string;
    ownerId?: string;
    // Current user info
    currentUserId?: string;
    // Public sharing
    isPublic?: boolean;
    onPublicChange?: (isPublic: boolean) => void;
}

// Extract invite form into a separate memoized component
const InviteForm = memo(
    ({
        onInvite,
        isSubmitting,
        errorMessage,
    }: {
        onInvite: (email: string, access: AccessLevel) => Promise<void>;
        isSubmitting: boolean;
        errorMessage: string;
    }) => {
        const [email, setEmail] = useState('');
        const [accessLevel, setAccessLevel] = useState<AccessLevel>('view');

        // Handle invite submission
        const handleInvite = useCallback(async () => {
            if (!email.trim()) {
                return;
            }

            try {
                await onInvite(email, accessLevel);
                // Clear form after successful submission
                setEmail('');
            } catch (error) {
                console.error('Error sending invitation:', error);
            }
        }, [email, accessLevel, onInvite]);

        // Handle access level change in dropdown
        const handleAccessLevelChange = useCallback(
            (event: SelectChangeEvent<AccessLevel>) => {
                setAccessLevel(event.target.value as AccessLevel);
            },
            []
        );

        return (
            <Box sx={{ mb: 3 }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-start',
                        mb: 3,
                    }}
                >
                    <TextField
                        label="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: alpha('#FFF', 0.9),
                            },
                        }}
                        error={!!errorMessage}
                        helperText={errorMessage}
                        disabled={isSubmitting}
                    />

                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel id="access-level-select-label">
                            Permission
                        </InputLabel>
                        <Select
                            labelId="access-level-select-label"
                            id="access-level-select"
                            value={accessLevel}
                            label="Permission"
                            onChange={handleAccessLevelChange}
                            size="medium"
                            disabled={isSubmitting}
                        >
                            <MenuItem value="view">Viewer</MenuItem>
                            <MenuItem value="edit">Editor</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleInvite}
                    disabled={isSubmitting || !email.trim()}
                    sx={{
                        height: 42,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: '0.01em',
                        textTransform: 'none',
                        boxShadow: `
                        0 1px 2px rgba(0,0,0,0.03),
                        0 4px 20px rgba(0,0,0,0.06),
                        inset 0 0 0 1px rgba(255,255,255,0.9)
                    `,
                        '&:hover': {
                            bgcolor: 'primary.dark',
                            transform: 'translateY(-1px)',
                            boxShadow: `
                            0 2px 4px rgba(0,0,0,0.05),
                            0 6px 24px rgba(0,0,0,0.08),
                            inset 0 0 0 1px rgba(255,255,255,0.9)
                        `,
                        },
                    }}
                >
                    {isSubmitting ? (
                        <CircularProgress size={24} color="inherit" />
                    ) : (
                        'Invite'
                    )}
                </Button>
            </Box>
        );
    }
);

// Extract user list into a memoized component
const UserList = memo(
    ({
        userList,
        handleOpenAccessMenu,
        isRemoving,
        handleUpdateAccess,
        handleRemoveAccess,
        menuAnchorEl,
        handleCloseAccessMenu,
        selectedUserId,
    }: {
        userList: SharedUser[];
        handleOpenAccessMenu: (
            event: React.MouseEvent<HTMLElement>,
            userId: string
        ) => void;
        isRemoving: boolean;
        handleUpdateAccess: (newAccess: AccessLevel) => Promise<void>;
        handleRemoveAccess: () => Promise<void>;
        menuAnchorEl: HTMLElement | null;
        handleCloseAccessMenu: () => void;
        selectedUserId: string | null;
    }) => {
        // Find the user object corresponding to the selectedUserId
        const selectedUser = useMemo(
            () =>
                selectedUserId
                    ? userList.find((u) => u.id === selectedUserId)
                    : null,
            [userList, selectedUserId]
        );

        if (userList.length === 0) return null;

        return (
            <>
                <Divider sx={{ my: 2 }} />

                <Typography
                    variant="subtitle2"
                    sx={{
                        mb: 1,
                        fontFamily: "'Inter', sans-serif",
                        color: 'text.secondary',
                    }}
                >
                    People with access
                </Typography>

                <List
                    sx={{
                        width: '100%',
                        bgcolor: 'transparent',
                        maxHeight: 240, // Set max height to enable scrolling
                        overflow: 'auto', // Enable scrolling
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: alpha('#FFF', 0.1),
                            borderRadius: '8px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: alpha('#000', 0.1),
                            borderRadius: '8px',
                            '&:hover': {
                                backgroundColor: alpha('#000', 0.2),
                            },
                        },
                        marginRight: '-8px',
                    }}
                >
                    {userList.map((user) => (
                        <ListItem key={user.id} disablePadding sx={{ mb: 1 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    gap: 1.5,
                                }}
                            >
                                <ListItemAvatar sx={{ minWidth: 'auto' }}>
                                    <UserAvatar
                                        avatarUrl={user.avatarUrl}
                                        email={user.email}
                                        size={32}
                                    />
                                </ListItemAvatar>
                                <Box
                                    sx={{
                                        flexGrow: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Tooltip title={user.email} placement="top">
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            sx={{
                                                fontFamily:
                                                    "'Inter', sans-serif",
                                                fontWeight: 500,
                                                color: 'text.primary',
                                                display: 'inline',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {user.email}
                                        </Typography>
                                    </Tooltip>
                                    {user.isCurrentUser && (
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            sx={{
                                                ml: 0.5,
                                                color: 'text.secondary',
                                                fontFamily:
                                                    "'Inter', sans-serif",
                                                display: 'inline',
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0, // Prevent the (you) label from shrinking
                                            }}
                                        >
                                            (you)
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ flexShrink: 0, ml: 'auto' }}>
                                    {user.access === 'owner' ? (
                                        <Chip
                                            label="Owner"
                                            size="small"
                                            disabled
                                            sx={{
                                                fontFamily:
                                                    "'Inter', sans-serif",
                                                fontWeight: 500,
                                            }}
                                        />
                                    ) : (
                                        <Chip
                                            label={
                                                user.access === 'view'
                                                    ? 'Viewer'
                                                    : 'Editor'
                                            }
                                            size="small"
                                            onClick={(event) =>
                                                handleOpenAccessMenu(
                                                    event,
                                                    user.id
                                                )
                                            }
                                            sx={{
                                                fontFamily:
                                                    "'Inter', sans-serif",
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                        </ListItem>
                    ))}
                </List>

                {/* Access Level Menu with Remove Access option */}
                <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleCloseAccessMenu}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
                            mt: 1,
                            borderRadius: 1,
                            minWidth: 140,
                            bgcolor: 'paper.light',
                        },
                    }}
                >
                    <MenuItem
                        onClick={() => handleUpdateAccess('view')}
                        selected={selectedUser?.access === 'view'}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Viewer
                        </Typography>
                    </MenuItem>
                    <MenuItem
                        onClick={() => handleUpdateAccess('edit')}
                        selected={selectedUser?.access === 'edit'}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Editor
                        </Typography>
                    </MenuItem>

                    {/* Divider and Remove option */}
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem
                        onClick={handleRemoveAccess}
                        sx={{
                            color: 'error.main',
                            '&:hover': {
                                bgcolor: alpha('#F44336', 0.08),
                            },
                        }}
                    >
                        {isRemoving ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.875rem',
                                }}
                            >
                                <CircularProgress size={14} color="inherit" />
                                <span>Removing...</span>
                            </Box>
                        ) : (
                            <Typography
                                variant="body2"
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                Remove access
                            </Typography>
                        )}
                    </MenuItem>
                </Menu>
            </>
        );
    }
);

// Extract visibility controls into a memoized component
const VisibilityControl = memo(
    ({
        isPublic,
        handleOpenVisibilityMenu,
        handleCloseVisibilityMenu,
        handleVisibilityChange,
        visibilityMenuAnchorEl,
    }: {
        isPublic: boolean;
        handleOpenVisibilityMenu: (
            event: React.MouseEvent<HTMLElement>
        ) => void;
        handleCloseVisibilityMenu: () => void;
        handleVisibilityChange: (
            event: React.MouseEvent<HTMLElement> | null,
            newVisibility: string
        ) => void;
        visibilityMenuAnchorEl: HTMLElement | null;
    }) => {
        return (
            <>
                <Tooltip
                    title={
                        isPublic
                            ? 'Public - Anyone with the link can view'
                            : 'Private - Only invited people can view'
                    }
                >
                    <IconButton
                        onClick={handleOpenVisibilityMenu}
                        size="small"
                        aria-label={isPublic ? 'Public' : 'Private'}
                        sx={{
                            color: 'text.secondary',
                            '&:hover': {
                                bgcolor: alpha('#000', 0.04),
                            },
                        }}
                    >
                        {isPublic ? <PublicIcon /> : <LockIcon />}
                    </IconButton>
                </Tooltip>

                {/* Visibility Menu */}
                <Menu
                    anchorEl={visibilityMenuAnchorEl}
                    open={Boolean(visibilityMenuAnchorEl)}
                    onClose={handleCloseVisibilityMenu}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
                            mt: 1,
                            borderRadius: 1,
                            minWidth: 180,
                            bgcolor: 'paper.light',
                        },
                    }}
                >
                    <MenuItem
                        onClick={(e) => handleVisibilityChange(e, 'public')}
                        selected={isPublic}
                        sx={{
                            px: 2,
                            py: 1.5,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PublicIcon
                                sx={{
                                    mr: 1.5,
                                    fontSize: '1.25rem',
                                    color: 'text.secondary',
                                }}
                            />
                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 500,
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    Public
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        fontFamily: "'Inter', sans-serif",
                                        color: 'text.secondary',
                                        mt: 0.25,
                                    }}
                                >
                                    Anyone with the link can view
                                </Typography>
                            </Box>
                        </Box>
                    </MenuItem>
                    <MenuItem
                        onClick={(e) => handleVisibilityChange(e, 'private')}
                        selected={!isPublic}
                        sx={{
                            px: 2,
                            py: 1.5,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LockIcon
                                sx={{
                                    mr: 1.5,
                                    fontSize: '1.25rem',
                                    color: 'text.secondary',
                                }}
                            />
                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 500,
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    Private
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        fontFamily: "'Inter', sans-serif",
                                        color: 'text.secondary',
                                        mt: 0.25,
                                    }}
                                >
                                    Only people you invite can view
                                </Typography>
                            </Box>
                        </Box>
                    </MenuItem>
                </Menu>
            </>
        );
    }
);

const ShareDialog: FC<ShareDialogProps> = memo(
    ({
        open,
        onClose,
        title,
        itemType,
        itemTitle,
        onInvite,
        onRemoveAccess,
        onUpdateAccess,
        sharedUsers = [], // Default to empty array for UI testing
        ownerEmail,
        ownerAvatarUrl,
        ownerId,
        currentUserId,
        isPublic: initialIsPublic = true, // Default to public as requested
        onPublicChange,
    }) => {
        // State for invite form - only use one loading state for the invite form
        const [isInviteLoading, setIsInviteLoading] = useState(false);
        const [errorMessage, setErrorMessage] = useState('');

        // State for public sharing
        const [isPublic, setIsPublic] = useState(initialIsPublic);

        // Effect to sync state when prop changes
        useEffect(() => {
            if (isPublic !== initialIsPublic) {
                setIsPublic(initialIsPublic);
            }
        }, [initialIsPublic]);

        const [visibilityMenuAnchorEl, setVisibilityMenuAnchorEl] =
            useState<null | HTMLElement>(null);

        // State for access level menu for existing users
        const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(
            null
        );
        const [selectedUserId, setSelectedUserId] = useState<string | null>(
            null
        );
        const [isRemoving, setIsRemoving] = useState(false);

        // Use title if provided, otherwise generate from itemType and itemTitle
        const shareDialogTitle =
            title ||
            `Share ${
                itemType.charAt(0).toUpperCase() + itemType.slice(1)
            }: ${itemTitle}`;

        // Handle invite submission (mock for now)
        const handleInvite = useCallback(
            async (email: string, access: AccessLevel) => {
                if (!email.trim()) {
                    setErrorMessage('Please enter a valid email address');
                    return;
                }

                setIsInviteLoading(true);
                setErrorMessage('');

                try {
                    if (onInvite) {
                        await onInvite(email, access);
                    }
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : 'Failed to send invitation. Please try again.';
                    setErrorMessage(errorMessage);
                    console.error('Error sending invitation:', error);
                } finally {
                    setIsInviteLoading(false);
                }
            },
            [onInvite]
        );

        // Handle opening the access level menu
        const handleOpenAccessMenu = useCallback(
            (event: React.MouseEvent<HTMLElement>, userId: string) => {
                setMenuAnchorEl(event.currentTarget);
                setSelectedUserId(userId);
            },
            []
        );

        // Handle closing the access level menu
        const handleCloseAccessMenu = useCallback(() => {
            setMenuAnchorEl(null);
            setSelectedUserId(null);
        }, []);

        // Handle updating access level
        const handleUpdateAccess = useCallback(
            async (newAccess: AccessLevel) => {
                if (!selectedUserId) return;

                try {
                    if (onUpdateAccess) {
                        await onUpdateAccess(selectedUserId, newAccess);
                    }
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : 'Error updating access.';
                    console.error('Error updating access:', errorMessage);
                } finally {
                    handleCloseAccessMenu();
                }
            },
            [selectedUserId, onUpdateAccess, handleCloseAccessMenu]
        );

        // Handle removing access
        const handleRemoveAccess = useCallback(async () => {
            if (!selectedUserId) return;

            setIsRemoving(true);

            try {
                if (onRemoveAccess) {
                    await onRemoveAccess(selectedUserId);
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Error removing access.';
                console.error('Error removing access:', errorMessage);
            } finally {
                setIsRemoving(false);
                handleCloseAccessMenu();
            }
        }, [selectedUserId, onRemoveAccess, handleCloseAccessMenu]);

        // Handle opening the visibility menu
        const handleOpenVisibilityMenu = useCallback(
            (event: React.MouseEvent<HTMLElement>) => {
                setVisibilityMenuAnchorEl(event.currentTarget);
            },
            []
        );

        // Handle closing the visibility menu
        const handleCloseVisibilityMenu = useCallback(() => {
            setVisibilityMenuAnchorEl(null);
        }, []);

        // Handle changing visibility - DON'T SET isInviteLoading here to prevent form flicker
        const handleVisibilityChange = useCallback(
            async (
                _event: React.MouseEvent<HTMLElement> | null,
                newVisibility: string
            ) => {
                // Only act if there's a real change and we have a handler
                const newIsPublic = newVisibility === 'public';

                if (isPublic !== newIsPublic && onPublicChange) {
                    try {
                        await onPublicChange(newIsPublic);
                        // Note that we don't need to setIsPublic here because the parent
                        // component will update initialIsPublic which will trigger the useEffect
                    } catch (error) {
                        console.error(`Error updating visibility:`, error);
                    }
                }
                handleCloseVisibilityMenu();
            },
            [isPublic, onPublicChange, handleCloseVisibilityMenu]
        );

        // Prepare the list of users with access including owner if provided
        const userList = useMemo(() => {
            const list: SharedUser[] = [];

            // Add owner at the top if provided
            if (ownerEmail) {
                list.push({
                    id: ownerId || 'owner',
                    email: ownerEmail,
                    avatarUrl: ownerAvatarUrl,
                    access: 'owner',
                    isCurrentUser: ownerId === currentUserId,
                });
            }

            // Add other users
            sharedUsers.forEach((user) => {
                // Skip if user is already added as owner
                if (user.id === ownerId) return;

                // Mark current user
                const modifiedUser = { ...user };
                if (user.id === currentUserId) {
                    modifiedUser.isCurrentUser = true;
                }

                list.push(modifiedUser);
            });

            return list;
        }, [sharedUsers, ownerEmail, ownerAvatarUrl, ownerId, currentUserId]);

        return (
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                disableEnforceFocus
                disableRestoreFocus
                PaperProps={{
                    sx: {
                        borderRadius: 1,
                        bgcolor: 'paper.main',
                        position: 'relative',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            boxShadow: 'inset 0 0 30px rgba(62, 28, 0, 0.05)',
                            pointerEvents: 'none',
                        },
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            opacity: 0.8,
                            pointerEvents: 'none',
                            backgroundImage: `
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.05) 0.5px, transparent 0.5px),
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.03) 1px, transparent 1px)
                        `,
                            backgroundSize: '6px 6px, 14px 14px',
                            backgroundPosition: '0 0',
                            mixBlendMode: 'multiply',
                            filter: 'opacity(1)',
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: "'Kalam', cursive",
                        color: 'primary.main',
                        fontWeight: 600,
                        fontSize: '1.5rem',
                        pb: 1,
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {shareDialogTitle}
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'text.secondary',
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            mb: 2,
                            fontFamily: "'Inter', sans-serif",
                            color: 'text.secondary',
                        }}
                    >
                        Share "{itemTitle}" with others
                    </Typography>

                    {/* Memoized InviteForm component */}
                    <InviteForm
                        onInvite={handleInvite}
                        isSubmitting={isInviteLoading}
                        errorMessage={errorMessage}
                    />

                    {/* Memoized UserList component - only render if there are users */}
                    {userList.length > 0 && (
                        <UserList
                            userList={userList}
                            handleOpenAccessMenu={handleOpenAccessMenu}
                            isRemoving={isRemoving}
                            handleUpdateAccess={handleUpdateAccess}
                            handleRemoveAccess={handleRemoveAccess}
                            menuAnchorEl={menuAnchorEl}
                            handleCloseAccessMenu={handleCloseAccessMenu}
                            selectedUserId={selectedUserId}
                        />
                    )}
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 3,
                        pb: 3,
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* Memoized VisibilityControl component */}
                        <VisibilityControl
                            isPublic={isPublic}
                            handleOpenVisibilityMenu={handleOpenVisibilityMenu}
                            handleCloseVisibilityMenu={
                                handleCloseVisibilityMenu
                            }
                            handleVisibilityChange={handleVisibilityChange}
                            visibilityMenuAnchorEl={visibilityMenuAnchorEl}
                        />
                    </Box>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        sx={{
                            borderRadius: 1,
                            textTransform: 'none',
                            fontFamily: "'Inter', sans-serif",
                            borderColor: 'divider',
                            color: 'text.primary',
                            '&:hover': {
                                borderColor: 'divider',
                                bgcolor: 'rgba(44, 62, 80, 0.04)',
                            },
                        }}
                    >
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
);

export default ShareDialog;
