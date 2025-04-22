import { FC, useState } from 'react';
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
    ListItemText,
    ListItemSecondaryAction,
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
import PersonIcon from '@mui/icons-material/Person';
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

const ShareDialog: FC<ShareDialogProps> = ({
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
    // State for invite form
    const [email, setEmail] = useState('');
    const [accessLevel, setAccessLevel] = useState<AccessLevel>('view');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // State for public sharing
    const [isPublic, setIsPublic] = useState(initialIsPublic);
    const [visibilityMenuAnchorEl, setVisibilityMenuAnchorEl] =
        useState<null | HTMLElement>(null);

    // State for access level menu for existing users
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    // Use title if provided, otherwise generate from itemType and itemTitle
    const shareDialogTitle =
        title ||
        `Share ${
            itemType.charAt(0).toUpperCase() + itemType.slice(1)
        }: ${itemTitle}`;

    // Handle invite submission (mock for now)
    const handleInvite = async () => {
        if (!email.trim()) {
            setErrorMessage('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            // For now just simulate a delay
            await new Promise((resolve) => setTimeout(resolve, 500));

            // This would be connected to real functionality later
            if (onInvite) {
                await onInvite(email, accessLevel);
            }

            // Clear form after successful submission
            setEmail('');
        } catch (error) {
            setErrorMessage('Failed to send invitation. Please try again.');
            console.error('Error sending invitation:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle opening the access level menu
    const handleOpenAccessMenu = (
        event: React.MouseEvent<HTMLElement>,
        userId: string
    ) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedUserId(userId);
    };

    // Handle closing the access level menu
    const handleCloseAccessMenu = () => {
        setMenuAnchorEl(null);
        setSelectedUserId(null);
    };

    // Handle updating access level (mock for now)
    const handleUpdateAccess = async (newAccess: AccessLevel) => {
        if (!selectedUserId) return;

        try {
            // This would be connected to real functionality later
            if (onUpdateAccess) {
                await onUpdateAccess(selectedUserId, newAccess);
            }
        } catch (error) {
            console.error('Error updating access:', error);
        } finally {
            handleCloseAccessMenu();
        }
    };

    // Handle access level change in dropdown
    const handleAccessLevelChange = (event: SelectChangeEvent<AccessLevel>) => {
        setAccessLevel(event.target.value as AccessLevel);
    };

    // Handle removing access
    const handleRemoveAccess = async () => {
        if (!selectedUserId) return;

        setIsRemoving(true);

        try {
            // This would be connected to real functionality later
            if (onRemoveAccess) {
                await onRemoveAccess(selectedUserId);
            }

            // Simulate delay
            await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error removing access:', error);
        } finally {
            setIsRemoving(false);
            handleCloseAccessMenu();
        }
    };

    // Handle opening the visibility menu
    const handleOpenVisibilityMenu = (event: React.MouseEvent<HTMLElement>) => {
        setVisibilityMenuAnchorEl(event.currentTarget);
    };

    // Handle closing the visibility menu
    const handleCloseVisibilityMenu = () => {
        setVisibilityMenuAnchorEl(null);
    };

    // Handle changing visibility
    const handleVisibilityChange = (newValue: boolean) => {
        setIsPublic(newValue);

        // Notify parent component if callback is provided
        if (onPublicChange) {
            onPublicChange(newValue);
        }

        handleCloseVisibilityMenu();
    };

    // Prepare the list of users with access including owner if provided
    const prepareUserList = () => {
        const usersList: SharedUser[] = [];

        // Add owner at the top if provided
        if (ownerEmail) {
            usersList.push({
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
            if (user.id === currentUserId) {
                user.isCurrentUser = true;
            }

            usersList.push(user);
        });

        return usersList;
    };

    const userList = prepareUserList();

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
                <Box sx={{ mb: 3 }}>
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

                {userList.length > 0 && (
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
                                        backgroundColor: alpha('#000', 0.15),
                                    },
                                },
                            }}
                        >
                            {userList.map((user) => (
                                <ListItem
                                    key={user.id}
                                    sx={{
                                        px: 1,
                                        borderRadius: 1,
                                        '&:hover': {
                                            bgcolor: alpha('#000', 0.02),
                                        },
                                    }}
                                >
                                    <ListItemAvatar>
                                        <UserAvatar
                                            email={user.email}
                                            avatarUrl={user.avatarUrl}
                                        />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    maxWidth: '100%',
                                                }}
                                            >
                                                <Tooltip title={user.email}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 500,
                                                            fontFamily:
                                                                "'Inter', sans-serif",
                                                            overflow: 'hidden',
                                                            textOverflow:
                                                                'ellipsis',
                                                            whiteSpace:
                                                                'nowrap',
                                                            maxWidth:
                                                                user.isCurrentUser
                                                                    ? 'calc(100% - 45px)'
                                                                    : '100%',
                                                        }}
                                                    >
                                                        {user.email}
                                                    </Typography>
                                                </Tooltip>
                                                {user.isCurrentUser && (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontFamily:
                                                                "'Inter', sans-serif",
                                                            color: 'text.secondary',
                                                            ml: 0.5,
                                                            whiteSpace:
                                                                'nowrap',
                                                        }}
                                                    >
                                                        (you)
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        {user.access === 'owner' ? (
                                            // Owner chip - styled to look disabled/non-clickable
                                            <Chip
                                                label="Owner"
                                                size="small"
                                                icon={
                                                    <PersonIcon
                                                        sx={{
                                                            fontSize:
                                                                '16px !important',
                                                        }}
                                                    />
                                                }
                                                sx={{
                                                    height: 24,
                                                    fontSize: '0.75rem',
                                                    bgcolor: alpha(
                                                        '#E0E0E0',
                                                        0.5
                                                    ),
                                                    color: alpha(
                                                        '#666666',
                                                        0.8
                                                    ),
                                                    fontFamily:
                                                        "'Inter', sans-serif",
                                                    fontWeight: 500,
                                                    border: '1px solid',
                                                    borderColor: alpha(
                                                        '#E0E0E0',
                                                        0.6
                                                    ),
                                                    opacity: 0.8,
                                                    cursor: 'default',
                                                    '& .MuiChip-icon': {
                                                        color: 'inherit',
                                                    },
                                                }}
                                            />
                                        ) : (
                                            // Access control chip for non-owners
                                            <Chip
                                                label={
                                                    user.access === 'edit'
                                                        ? 'Editor'
                                                        : 'Viewer'
                                                }
                                                size="small"
                                                onClick={(e) =>
                                                    handleOpenAccessMenu(
                                                        e,
                                                        user.id
                                                    )
                                                }
                                                sx={{
                                                    height: 24,
                                                    fontSize: '0.75rem',
                                                    bgcolor:
                                                        user.access === 'edit'
                                                            ? alpha(
                                                                  '#2C3E50',
                                                                  0.08
                                                              )
                                                            : alpha(
                                                                  '#2C3E50',
                                                                  0.05
                                                              ),
                                                    color: 'text.primary',
                                                    fontFamily:
                                                        "'Inter', sans-serif",
                                                    fontWeight: 500,
                                                    '&:hover': {
                                                        bgcolor:
                                                            user.access ===
                                                            'edit'
                                                                ? alpha(
                                                                      '#2C3E50',
                                                                      0.12
                                                                  )
                                                                : alpha(
                                                                      '#2C3E50',
                                                                      0.08
                                                                  ),
                                                    },
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        )}
                                    </ListItemSecondaryAction>
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
                                selected={
                                    selectedUserId
                                        ? userList.find(
                                              (u) => u.id === selectedUserId
                                          )?.access === 'view'
                                        : false
                                }
                            >
                                <Typography
                                    variant="body2"
                                    sx={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                    Viewer
                                </Typography>
                            </MenuItem>
                            <MenuItem
                                onClick={() => handleUpdateAccess('edit')}
                                selected={
                                    selectedUserId
                                        ? userList.find(
                                              (u) => u.id === selectedUserId
                                          )?.access === 'edit'
                                        : false
                                }
                            >
                                <Typography
                                    variant="body2"
                                    sx={{ fontFamily: "'Inter', sans-serif" }}
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
                                <Typography
                                    variant="body2"
                                    sx={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                    {isRemoving ? (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                            }}
                                        >
                                            <CircularProgress
                                                size={14}
                                                color="inherit"
                                            />
                                            Removing...
                                        </Box>
                                    ) : (
                                        'Remove access'
                                    )}
                                </Typography>
                            </MenuItem>
                        </Menu>
                    </>
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
                        onClick={() => handleVisibilityChange(true)}
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
                        onClick={() => handleVisibilityChange(false)}
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
            </DialogActions>
        </Dialog>
    );
};

export default ShareDialog;
