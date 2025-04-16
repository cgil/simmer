import { FC, useState, ReactNode, useRef, useEffect, useMemo } from 'react';
import {
    Drawer,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Typography,
    Button,
    useTheme,
    Tooltip,
    alpha,
    Zoom,
    Fade,
    TextField,
    Paper,
    Slide,
    Portal,
    Grow,
    Popover,
    Skeleton,
    Collapse,
    useMediaQuery,
    Backdrop,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
// Import emoji mart components
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// Move the interface up so we can use it in props
interface CollectionItem {
    id: string;
    name: string;
    count: number;
    icon?: ReactNode;
    emoji?: string; // Support for emoji icons
}

interface CollectionsDrawerProps {
    selectedCollection?: string;
    onCollectionSelect?: (id: string) => void;
    width?: number;
    collapsedWidth?: number;
    onDrawerStateChange?: (isOpen: boolean) => void;
    collections?: CollectionItem[]; // New prop to receive collections from parent
    isLoading?: boolean; // New prop to show loading state
    onCreateCollection?: () => void; // New prop for collection creation
    onUpdateCollection?: (
        collectionId: string,
        name: string,
        emoji?: string
    ) => void; // New prop for collection updates
    onDeleteCollection?: (collectionId: string) => void; // New prop for collection deletion
    collectionsBeingRemoved?: string[]; // New prop to track collections being removed with animation
    isOpen?: boolean; // External control of open state
}

// Define a constant for the consistent height
const COLLECTION_ITEM_HEIGHT = '50px'; // Standard height for ListItemButton

// Add a utility function to check if a collection is new
const isNewCollection = (id: string) => id.startsWith('temp-');

const CollectionsDrawer: FC<CollectionsDrawerProps> = ({
    selectedCollection = 'all',
    onCollectionSelect = () => {},
    width = 240,
    collapsedWidth = 72,
    onDrawerStateChange,
    collections = [], // Default to empty array if not provided
    isLoading = false, // Default to not loading
    onCreateCollection,
    onUpdateCollection,
    onDeleteCollection,
    collectionsBeingRemoved = [], // Default to empty array
    isOpen = false, // Default to closed
}) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [hoveredCollection, setHoveredCollection] = useState<string | null>(
        null
    );
    const [editingCollection, setEditingCollection] = useState<string | null>(
        null
    );
    const [editingName, setEditingName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<ReactNode | null>(null);
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
    const [emojiPickerAnchorEl, setEmojiPickerAnchorEl] =
        useState<HTMLElement | null>(null);
    const [deletingCollection, setDeletingCollection] = useState<string | null>(
        null
    );
    const collectionItemRef = useRef<HTMLDivElement>(null);

    // Sort collections: All Recipes first, then alphabetically by name
    const sortedCollections = useMemo(() => {
        // First separate "All Recipes" from other collections
        const allRecipes = collections.find((c) => c.id === 'all');
        const otherCollections = collections.filter((c) => c.id !== 'all');

        // Sort other collections alphabetically by name
        const sortedOthers = [...otherCollections].sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        // Return with All Recipes first, followed by sorted collections
        return allRecipes ? [allRecipes, ...sortedOthers] : sortedOthers;
    }, [collections]);

    // Create a map to store collection element positions
    const [buttonPositions, setButtonPositions] = useState<
        Record<string, { left: number; top: number }>
    >({});
    const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Update positions of buttons when collections change or when drawer opens/closes
    useEffect(() => {
        const updateButtonPositions = () => {
            const newPositions: Record<string, { left: number; top: number }> =
                {};

            // Calculate positions for each collection item
            Object.entries(listItemRefs.current).forEach(([id, element]) => {
                if (element) {
                    const rect = element.getBoundingClientRect();
                    newPositions[id] = {
                        left: rect.right - 16,
                        top: rect.top + rect.height / 2,
                    };
                }
            });

            setButtonPositions(newPositions);
        };

        // Calculate initial positions
        updateButtonPositions();

        // Add resize listener to recalculate on window resize
        window.addEventListener('resize', updateButtonPositions);

        // Clean up listener
        return () => {
            window.removeEventListener('resize', updateButtonPositions);
        };
    }, [collections, isOpen, hoveredCollection, editingCollection]);

    const handleToggleDrawer = () => {
        // Notify parent component about drawer state change
        if (onDrawerStateChange) {
            onDrawerStateChange(!isOpen);
        }
    };

    // Format the recipe count for display
    const formatRecipeCount = (count: number) => {
        if (count === 0) return 'Empty';
        return count === 1 ? '1 recipe' : `${count} recipes`;
    };

    const handleEditCollection = (collectionId: string) => {
        // Don't allow editing the "All Recipes" option
        if (collectionId === 'all') return;

        const collection = collections.find((c) => c.id === collectionId);
        if (collection) {
            setEditingCollection(collectionId);
            setEditingName(collection.name);

            // Prefer emoji over icon if available
            if (collection.emoji) {
                setSelectedEmoji(collection.emoji);
                setSelectedIcon(null);
            } else {
                setSelectedIcon(collection.icon || null);
                setSelectedEmoji(null);
            }
        }
    };

    const handleSaveCollection = (collectionId: string) => {
        // Don't save if name is empty
        if (!editingName.trim()) return;

        // Call parent update method if provided
        if (onUpdateCollection) {
            onUpdateCollection(
                collectionId,
                editingName,
                selectedEmoji || undefined
            );
        }

        // Reset editing state
        setEditingCollection(null);
        setEditingName('');
        setSelectedIcon(null);
        setSelectedEmoji(null);
    };

    const handleCancelEdit = () => {
        setEditingCollection(null);
        setEditingName('');
        setSelectedIcon(null);
        setSelectedEmoji(null);
    };

    const handleOpenEmojiPicker = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setEmojiPickerAnchorEl(event.currentTarget);
    };

    const handleCloseEmojiPicker = () => {
        setEmojiPickerAnchorEl(null);
    };

    // New handler for emoji selection
    const handleSelectEmoji = (emoji: { native: string }) => {
        setSelectedEmoji(emoji.native);
        setSelectedIcon(null);
        handleCloseEmojiPicker();
    };

    const handleConfirmDelete = (collectionId: string) => {
        // Don't allow deleting the "All Recipes" option
        if (collectionId === 'all') return;

        setDeletingCollection(collectionId);
    };

    const handleDeleteCollection = (collectionId: string) => {
        // Call parent delete method if provided
        if (onDeleteCollection) {
            onDeleteCollection(collectionId);
        }

        // Reset deleting state
        setDeletingCollection(null);
    };

    const handleCancelDelete = () => {
        setDeletingCollection(null);
    };

    // Determine what to display as the icon
    const getCollectionIcon = (collection: CollectionItem) => {
        if (collection.id === editingCollection) {
            // For the collection being edited
            if (selectedEmoji)
                return (
                    <span style={{ fontSize: '1.4rem' }}>{selectedEmoji}</span>
                );
            return selectedIcon || collection.icon;
        } else {
            // For regular collections
            if (collection.emoji)
                return (
                    <span style={{ fontSize: '1.4rem' }}>
                        {collection.emoji}
                    </span>
                );
            return collection.icon;
        }
    };

    return (
        <>
            {/* Add backdrop for small screens when drawer is open */}
            {isSmallScreen && isOpen && (
                <Backdrop
                    open={true}
                    sx={{
                        zIndex: theme.zIndex.drawer + 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onClick={handleToggleDrawer}
                />
            )}
            <Drawer
                id="collections-drawer"
                variant={isSmallScreen ? 'temporary' : 'permanent'}
                open={isSmallScreen ? isOpen : undefined}
                onClose={isSmallScreen ? handleToggleDrawer : undefined}
                ModalProps={{
                    keepMounted: true, // Better performance on mobile
                }}
                sx={{
                    width: isOpen ? width : collapsedWidth,
                    flexShrink: 0,
                    position: 'fixed',
                    display: isSmallScreen && !isOpen ? 'none' : 'block',
                    '& .MuiDrawer-paper': {
                        width: isOpen ? width : collapsedWidth,
                        boxSizing: 'border-box',
                        bgcolor: 'paper.main',
                        transition: theme.transitions.create(['width'], {
                            easing: theme.transitions.easing.easeInOut,
                            duration: theme.transitions.duration.standard,
                        }),
                        borderRadius: 0,
                        overflowX: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100vh',
                        borderRight: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.08),
                        backgroundSize: '20px 20px',
                        top: 0,
                        left: 0,
                        position: 'fixed',
                        zIndex: isSmallScreen
                            ? theme.zIndex.modal
                            : theme.zIndex.drawer,
                    },
                    // Ensure overlay stays on top for small screens
                    ...(isSmallScreen && {
                        zIndex: theme.zIndex.modal,
                    }),
                }}
                // Fix for accessibility - hide content properly from screen readers when closed on small screens
                slotProps={{
                    backdrop: {
                        sx: { zIndex: theme.zIndex.drawer },
                    },
                }}
                // Don't keep elements in DOM when hidden on small screens
                keepMounted={!isSmallScreen}
            >
                {/* Fixed header with expand/collapse button */}
                <Box
                    sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        bgcolor: alpha(theme.palette.paper.main, 0.9),
                        backdropFilter: 'blur(8px)',
                        p: 2,
                        pr: isOpen ? 1 : 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isOpen ? 'space-between' : 'center',
                        height: { xs: 57, sm: 65 }, // Match header height
                    }}
                >
                    {isOpen && (
                        <Typography
                            variant="h6"
                            sx={{
                                fontFamily: "'Kalam', cursive",
                                color: 'primary.main',
                                pl: 1,
                                fontSize: '1.3rem',
                                fontWeight: 700,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Collections
                        </Typography>
                    )}
                    <Tooltip title="">
                        <IconButton
                            onClick={handleToggleDrawer}
                            color="primary"
                            aria-label={
                                isOpen
                                    ? 'collapse collections'
                                    : 'expand collections'
                            }
                            aria-expanded={isOpen}
                            aria-controls="collections-drawer"
                            sx={{
                                '&:hover': {
                                    bgcolor: alpha(
                                        theme.palette.primary.main,
                                        0.08
                                    ),
                                    borderRadius: 2,
                                },
                            }}
                        >
                            {isOpen ? (
                                <MenuOpenRoundedIcon />
                            ) : (
                                <MenuRoundedIcon />
                            )}
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Scrollable collections list */}
                <Box
                    sx={{
                        overflow: 'auto',
                        flexGrow: 1,
                    }}
                >
                    {isLoading ? (
                        <List sx={{ px: 1, pt: 1 }}>
                            {[0, 1, 2, 3, 4].map((index) => (
                                <ListItem
                                    key={index}
                                    disablePadding
                                    sx={{ mb: 0.5 }}
                                >
                                    <Box
                                        sx={{
                                            width: '100%',
                                            position: 'relative',
                                        }}
                                    >
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                width: '100%',
                                                height: COLLECTION_ITEM_HEIGHT,
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                bgcolor: alpha(
                                                    theme.palette.primary.light,
                                                    0.04
                                                ),
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                    px: 2,
                                                }}
                                            >
                                                <Skeleton
                                                    variant="circular"
                                                    width={24}
                                                    height={24}
                                                    animation="pulse"
                                                    sx={{
                                                        mr: 2,
                                                        bgcolor: alpha(
                                                            theme.palette
                                                                .primary.light,
                                                            0.1
                                                        ),
                                                    }}
                                                />
                                                <Box sx={{ width: '100%' }}>
                                                    <Skeleton
                                                        variant="text"
                                                        width="60%"
                                                        height={20}
                                                        animation="wave"
                                                        sx={{
                                                            bgcolor: alpha(
                                                                theme.palette
                                                                    .primary
                                                                    .light,
                                                                0.1
                                                            ),
                                                        }}
                                                    />
                                                    <Skeleton
                                                        variant="text"
                                                        width="40%"
                                                        height={16}
                                                        animation="wave"
                                                        sx={{
                                                            bgcolor: alpha(
                                                                theme.palette
                                                                    .primary
                                                                    .light,
                                                                0.07
                                                            ),
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        </Paper>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <List sx={{ px: 1, pt: 1 }}>
                            {sortedCollections.map((collection) => (
                                <Collapse
                                    key={collection.id}
                                    in={
                                        !collectionsBeingRemoved.includes(
                                            collection.id
                                        )
                                    }
                                    appear={true}
                                    timeout={{
                                        enter: 400,
                                        exit: 300,
                                    }}
                                    unmountOnExit
                                    sx={{
                                        transformOrigin: 'top center',
                                        animation: isNewCollection(
                                            collection.id
                                        )
                                            ? 'highlight-new-collection 1.5s ease-out'
                                            : 'none',
                                        '@keyframes highlight-new-collection': {
                                            '0%': {
                                                transform: 'scale(0.95)',
                                                boxShadow:
                                                    '0 0 0 0 rgba(44, 62, 80, 0.1)',
                                            },
                                            '20%': {
                                                transform: 'scale(1.02)',
                                                boxShadow:
                                                    '0 0 0 6px rgba(44, 62, 80, 0)',
                                            },
                                            '100%': {
                                                transform: 'scale(1)',
                                                boxShadow:
                                                    '0 0 0 0 rgba(44, 62, 80, 0)',
                                            },
                                        },
                                    }}
                                    onMouseEnter={() =>
                                        setHoveredCollection(collection.id)
                                    }
                                    onMouseLeave={() =>
                                        setHoveredCollection(null)
                                    }
                                    ref={(el: HTMLLIElement | null) => {
                                        if (el) {
                                            listItemRefs.current[
                                                collection.id
                                            ] = el as unknown as HTMLDivElement;
                                        } else {
                                            listItemRefs.current[
                                                collection.id
                                            ] = null;
                                        }
                                    }}
                                >
                                    <ListItem
                                        disablePadding
                                        sx={{
                                            mb: 0.5,
                                            position: 'relative',
                                            overflow: 'visible', // Important but not enough for buttons that break out
                                        }}
                                    >
                                        {/* Wrapper div with ref for Slide transitions */}
                                        <Box
                                            ref={
                                                collection.id ===
                                                    editingCollection ||
                                                collection.id ===
                                                    deletingCollection
                                                    ? collectionItemRef
                                                    : null
                                            }
                                            sx={{
                                                width: '100%',
                                                position: 'relative',
                                                transform: 'translateZ(0)', // Force hardware acceleration for smoother animations
                                                bgcolor: isNewCollection(
                                                    collection.id
                                                )
                                                    ? alpha(
                                                          theme.palette.primary
                                                              .light,
                                                          0.2
                                                      )
                                                    : 'transparent',
                                                borderRadius: 2,
                                                transition:
                                                    'background-color 1.5s ease-out',
                                            }}
                                        >
                                            {/* Delete confirmation slide-in panel */}
                                            <Slide
                                                direction="left"
                                                in={
                                                    deletingCollection ===
                                                    collection.id
                                                }
                                                timeout={300}
                                                mountOnEnter
                                                unmountOnExit
                                                container={
                                                    collectionItemRef.current
                                                }
                                            >
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        zIndex: 5,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        pr: 0,
                                                    }}
                                                >
                                                    <Paper
                                                        elevation={2}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'space-between',
                                                            width: '100%',
                                                            height: COLLECTION_ITEM_HEIGHT,
                                                            p: 1,
                                                            backgroundColor:
                                                                '#ffebee',
                                                            border: '1px solid',
                                                            borderColor:
                                                                '#ef9a9a',
                                                            borderRadius: 2,
                                                            animation:
                                                                'pulse 1.5s ease-in-out',
                                                            '@keyframes pulse':
                                                                {
                                                                    '0%': {
                                                                        boxShadow:
                                                                            '0 0 0 0 rgba(239, 154, 154, 0.4)',
                                                                    },
                                                                    '70%': {
                                                                        boxShadow:
                                                                            '0 0 0 6px rgba(239, 154, 154, 0)',
                                                                    },
                                                                    '100%': {
                                                                        boxShadow:
                                                                            '0 0 0 0 rgba(239, 154, 154, 0)',
                                                                    },
                                                                },
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                pl: 1,
                                                                color: '#d32f2f',
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            Delete collection
                                                            and recipes?
                                                        </Typography>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                gap: 0,
                                                            }}
                                                        >
                                                            <Zoom
                                                                in={true}
                                                                timeout={200}
                                                                style={{
                                                                    transitionDelay:
                                                                        '150ms',
                                                                }}
                                                            >
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleDeleteCollection(
                                                                            collection.id
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        color: alpha(
                                                                            theme
                                                                                .palette
                                                                                .primary
                                                                                .light,
                                                                            0.8
                                                                        ),
                                                                        transition:
                                                                            'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                        '&:hover':
                                                                            {
                                                                                bgcolor:
                                                                                    alpha(
                                                                                        theme
                                                                                            .palette
                                                                                            .primary
                                                                                            .light,
                                                                                        0.05
                                                                                    ),
                                                                                transform:
                                                                                    'scale(1.1)',
                                                                            },
                                                                    }}
                                                                >
                                                                    <CheckRoundedIcon fontSize="small" />
                                                                </IconButton>
                                                            </Zoom>
                                                            <Zoom
                                                                in={true}
                                                                timeout={200}
                                                                style={{
                                                                    transitionDelay:
                                                                        '250ms',
                                                                }}
                                                            >
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={
                                                                        handleCancelDelete
                                                                    }
                                                                    sx={{
                                                                        color: alpha(
                                                                            theme
                                                                                .palette
                                                                                .primary
                                                                                .light,
                                                                            0.8
                                                                        ),
                                                                        transition:
                                                                            'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                        '&:hover':
                                                                            {
                                                                                bgcolor:
                                                                                    alpha(
                                                                                        theme
                                                                                            .palette
                                                                                            .primary
                                                                                            .light,
                                                                                        0.05
                                                                                    ),
                                                                                transform:
                                                                                    'scale(1.1)',
                                                                            },
                                                                    }}
                                                                >
                                                                    <CloseRoundedIcon fontSize="small" />
                                                                </IconButton>
                                                            </Zoom>
                                                        </Box>
                                                    </Paper>
                                                </Box>
                                            </Slide>

                                            {/* Normal or Editing view */}
                                            {editingCollection ===
                                            collection.id ? (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        p: 1,
                                                        width: '100%',
                                                        height: COLLECTION_ITEM_HEIGHT,
                                                        borderRadius: 2,
                                                        bgcolor: alpha(
                                                            theme.palette
                                                                .primary.light,
                                                            0.05
                                                        ),
                                                        border: '1px solid',
                                                        borderColor: alpha(
                                                            theme.palette
                                                                .primary.main,
                                                            0.1
                                                        ),
                                                    }}
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={
                                                            handleOpenEmojiPicker
                                                        }
                                                        sx={{ mr: 1 }}
                                                    >
                                                        {getCollectionIcon(
                                                            collection
                                                        )}
                                                    </IconButton>
                                                    <TextField
                                                        value={editingName}
                                                        onChange={(e) =>
                                                            setEditingName(
                                                                e.target.value
                                                            )
                                                        }
                                                        variant="standard"
                                                        size="small"
                                                        fullWidth
                                                        autoFocus
                                                        InputProps={{
                                                            disableUnderline:
                                                                true,
                                                            sx: {
                                                                fontSize:
                                                                    '0.95rem',
                                                                fontWeight: 500,
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            ) : (
                                                <ListItemButton
                                                    selected={
                                                        selectedCollection ===
                                                        collection.id
                                                    }
                                                    onClick={() =>
                                                        onCollectionSelect(
                                                            collection.id
                                                        )
                                                    }
                                                    sx={{
                                                        borderRadius: 2,
                                                        height: COLLECTION_ITEM_HEIGHT,
                                                        transition:
                                                            'all 0.2s ease',
                                                        position: 'relative',
                                                        '&:hover': {
                                                            bgcolor: alpha(
                                                                theme.palette
                                                                    .primary
                                                                    .main,
                                                                0.06
                                                            ),
                                                        },
                                                        '&.Mui-selected': {
                                                            bgcolor: alpha(
                                                                theme.palette
                                                                    .primary
                                                                    .light,
                                                                0.1
                                                            ),
                                                            color: 'primary.dark',
                                                            boxShadow: `0 1px 3px ${alpha(
                                                                theme.palette
                                                                    .primary
                                                                    .main,
                                                                0.1
                                                            )}`,
                                                            '&:hover': {
                                                                bgcolor: alpha(
                                                                    theme
                                                                        .palette
                                                                        .primary
                                                                        .light,
                                                                    0.3
                                                                ),
                                                            },
                                                            '& .MuiListItemIcon-root':
                                                                {
                                                                    color: 'primary.main',
                                                                },
                                                            '& .MuiListItemText-secondary':
                                                                {
                                                                    color: alpha(
                                                                        theme
                                                                            .palette
                                                                            .primary
                                                                            .main,
                                                                        0.7
                                                                    ),
                                                                },
                                                        },
                                                    }}
                                                >
                                                    <ListItemIcon
                                                        sx={{
                                                            minWidth: isOpen
                                                                ? 36
                                                                : 0,
                                                            color:
                                                                selectedCollection ===
                                                                collection.id
                                                                    ? 'primary.main'
                                                                    : 'primary.main',
                                                            fontSize: '1.2rem',
                                                        }}
                                                    >
                                                        {getCollectionIcon(
                                                            collection
                                                        )}
                                                    </ListItemIcon>
                                                    {isOpen && (
                                                        <ListItemText
                                                            primary={
                                                                collection.name
                                                            }
                                                            secondary={formatRecipeCount(
                                                                collection.count
                                                            )}
                                                            primaryTypographyProps={{
                                                                noWrap: true,
                                                                sx: {
                                                                    fontWeight:
                                                                        selectedCollection ===
                                                                        collection.id
                                                                            ? 600
                                                                            : 500,
                                                                    color:
                                                                        selectedCollection ===
                                                                        collection.id
                                                                            ? 'primary.dark'
                                                                            : 'text.primary',
                                                                },
                                                            }}
                                                            secondaryTypographyProps={{
                                                                noWrap: true,
                                                                sx: {
                                                                    fontSize:
                                                                        '0.75rem',
                                                                    color:
                                                                        selectedCollection ===
                                                                        collection.id
                                                                            ? alpha(
                                                                                  theme
                                                                                      .palette
                                                                                      .primary
                                                                                      .main,
                                                                                  0.7
                                                                              )
                                                                            : 'text.secondary',
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                </ListItemButton>
                                            )}
                                        </Box>

                                        {/* Edit pencil icon that appears on hover - using Portal to break out */}
                                        {isOpen &&
                                            hoveredCollection ===
                                                collection.id &&
                                            !editingCollection &&
                                            !deletingCollection &&
                                            buttonPositions[collection.id] &&
                                            collection.id !== 'all' && ( // Don't show edit button for "All Recipes"
                                                <Portal>
                                                    <Grow
                                                        in={true}
                                                        timeout={{
                                                            enter: 200,
                                                            exit: 150,
                                                        }}
                                                        style={{
                                                            transformOrigin:
                                                                'center right',
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                position:
                                                                    'fixed',
                                                                left: `${
                                                                    buttonPositions[
                                                                        collection
                                                                            .id
                                                                    ].left
                                                                }px`,
                                                                top: `${
                                                                    buttonPositions[
                                                                        collection
                                                                            .id
                                                                    ].top - 16
                                                                }px`,
                                                                zIndex:
                                                                    theme.zIndex
                                                                        .drawer +
                                                                    1,
                                                            }}
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    handleEditCollection(
                                                                        collection.id
                                                                    )
                                                                }
                                                                sx={{
                                                                    bgcolor:
                                                                        alpha(
                                                                            theme
                                                                                .palette
                                                                                .background
                                                                                .paper,
                                                                            0.7
                                                                        ),
                                                                    boxShadow: 1,
                                                                    width: 28,
                                                                    height: 28,
                                                                    transition:
                                                                        'all 0.15s ease',
                                                                    '&:hover': {
                                                                        bgcolor:
                                                                            alpha(
                                                                                theme
                                                                                    .palette
                                                                                    .background
                                                                                    .paper,
                                                                                0.9
                                                                            ),
                                                                        transform:
                                                                            'scale(1.02)',
                                                                    },
                                                                }}
                                                            >
                                                                <EditRoundedIcon
                                                                    fontSize="small"
                                                                    sx={{
                                                                        fontSize:
                                                                            '0.9rem',
                                                                        color: alpha(
                                                                            theme
                                                                                .palette
                                                                                .text
                                                                                .secondary,
                                                                            0.8
                                                                        ),
                                                                    }}
                                                                />
                                                            </IconButton>
                                                        </Box>
                                                    </Grow>
                                                </Portal>
                                            )}

                                        {/* Edit mode controls - using Portal to break out */}
                                        {isOpen &&
                                            editingCollection ===
                                                collection.id &&
                                            buttonPositions[collection.id] &&
                                            deletingCollection !==
                                                collection.id && (
                                                <Portal>
                                                    <Box
                                                        sx={{
                                                            position: 'fixed',
                                                            left: `${
                                                                buttonPositions[
                                                                    collection
                                                                        .id
                                                                ].left
                                                            }px`,
                                                            top: `${
                                                                buttonPositions[
                                                                    collection
                                                                        .id
                                                                ].top - 48
                                                            }px`,
                                                            display: 'flex',
                                                            flexDirection:
                                                                'column',
                                                            gap: 0.5,
                                                            zIndex:
                                                                theme.zIndex
                                                                    .drawer + 1,
                                                        }}
                                                    >
                                                        {/* The save button */}
                                                        <Grow
                                                            in={
                                                                editingCollection ===
                                                                collection.id
                                                            }
                                                            timeout={{
                                                                enter: 300,
                                                                exit: 200,
                                                            }}
                                                            style={{
                                                                transformOrigin:
                                                                    'center left',
                                                                transitionDelay:
                                                                    editingCollection ===
                                                                    collection.id
                                                                        ? '0ms'
                                                                        : '0ms',
                                                            }}
                                                            unmountOnExit
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() =>
                                                                    handleSaveCollection(
                                                                        collection.id
                                                                    )
                                                                }
                                                                sx={{
                                                                    bgcolor:
                                                                        'background.paper',
                                                                    boxShadow: 1,
                                                                    width: 28,
                                                                    height: 28,
                                                                    '&:hover': {
                                                                        bgcolor:
                                                                            '#f5f5f5',
                                                                        transform:
                                                                            'scale(1.02)',
                                                                    },
                                                                }}
                                                            >
                                                                <CheckRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Grow>

                                                        {/* The delete button */}
                                                        <Grow
                                                            in={
                                                                editingCollection ===
                                                                collection.id
                                                            }
                                                            timeout={{
                                                                enter: 300,
                                                                exit: 200,
                                                            }}
                                                            style={{
                                                                transformOrigin:
                                                                    'center left',
                                                                transitionDelay:
                                                                    editingCollection ===
                                                                    collection.id
                                                                        ? '75ms'
                                                                        : '0ms',
                                                            }}
                                                            unmountOnExit
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    handleConfirmDelete(
                                                                        collection.id
                                                                    )
                                                                }
                                                                sx={{
                                                                    bgcolor:
                                                                        'background.paper',
                                                                    boxShadow: 1,
                                                                    width: 28,
                                                                    height: 28,
                                                                    color: '#ef9a9a',
                                                                    '&:hover': {
                                                                        bgcolor:
                                                                            '#fff8f8',
                                                                        transform:
                                                                            'scale(1.02)',
                                                                    },
                                                                }}
                                                            >
                                                                <DeleteRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Grow>

                                                        {/* The cancel button */}
                                                        <Grow
                                                            in={
                                                                editingCollection ===
                                                                collection.id
                                                            }
                                                            timeout={{
                                                                enter: 300,
                                                                exit: 200,
                                                            }}
                                                            style={{
                                                                transformOrigin:
                                                                    'center left',
                                                                transitionDelay:
                                                                    editingCollection ===
                                                                    collection.id
                                                                        ? '150ms'
                                                                        : '0ms',
                                                            }}
                                                            unmountOnExit
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                onClick={
                                                                    handleCancelEdit
                                                                }
                                                                sx={{
                                                                    bgcolor:
                                                                        'background.paper',
                                                                    boxShadow: 1,
                                                                    width: 28,
                                                                    height: 28,
                                                                    '&:hover': {
                                                                        bgcolor:
                                                                            '#f5f5f5',
                                                                        transform:
                                                                            'scale(1.02)',
                                                                    },
                                                                }}
                                                            >
                                                                <CloseRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Grow>
                                                    </Box>
                                                </Portal>
                                            )}
                                    </ListItem>
                                </Collapse>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Fixed footer with "New Collection" button */}
                <Box
                    sx={{
                        position: 'sticky',
                        bottom: 0,
                        borderTop: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.08),
                        p: isOpen ? 1.5 : 1,
                        bgcolor: alpha(theme.palette.paper.main, 0.9),
                        backdropFilter: 'blur(8px)',
                        zIndex: 1,
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: theme.transitions.create(['padding'], {
                            easing: theme.transitions.easing.easeInOut,
                            duration: theme.transitions.duration.standard,
                        }),
                    }}
                >
                    <Box
                        sx={{
                            width: '100%',
                            height: '36px',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.8,
                        }}
                    >
                        <Fade
                            in={isOpen}
                            timeout={{ enter: 400, exit: 200 }}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                transitionDelay: isOpen ? '100ms' : '0ms',
                            }}
                            unmountOnExit
                        >
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<AddRoundedIcon fontSize="small" />}
                                fullWidth
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    height: '36px',
                                    py: 0.5,
                                    border: '1px dashed',
                                    borderColor: 'primary.light',
                                    boxShadow: 'none',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontSize: '0.9rem',
                                    '&:hover': {
                                        border: '1px dashed',
                                        borderColor: 'primary.dark',
                                        bgcolor: alpha(
                                            theme.palette.primary.main,
                                            0.04
                                        ),
                                    },
                                    '& .MuiButton-startIcon': {
                                        marginRight: 0.5,
                                        transform: 'scale(0.9)',
                                    },
                                }}
                                onClick={onCreateCollection}
                            >
                                New Collection
                            </Button>
                        </Fade>

                        <Zoom
                            in={!isOpen}
                            timeout={{ enter: 300, exit: 200 }}
                            style={{
                                transitionDelay: !isOpen ? '75ms' : '0ms',
                            }}
                            unmountOnExit
                        >
                            <Tooltip title="">
                                <IconButton
                                    color="primary"
                                    size="medium"
                                    sx={{
                                        width: '36px',
                                        height: '36px',
                                        border: '1px dashed',
                                        borderColor: 'primary.light',
                                        padding: 0.75,
                                        '&:hover': {
                                            bgcolor: alpha(
                                                theme.palette.primary.main,
                                                0.04
                                            ),
                                            borderColor: 'primary.dark',
                                        },
                                        '& .MuiSvgIcon-root': {
                                            fontSize: '1.25rem',
                                        },
                                    }}
                                    onClick={onCreateCollection}
                                >
                                    <AddRoundedIcon fontSize="inherit" />
                                </IconButton>
                            </Tooltip>
                        </Zoom>
                    </Box>
                </Box>

                {/* Emoji picker popover */}
                <Popover
                    anchorEl={emojiPickerAnchorEl}
                    open={Boolean(emojiPickerAnchorEl)}
                    onClose={handleCloseEmojiPicker}
                    anchorOrigin={{
                        vertical: 'center',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'center',
                        horizontal: 'left',
                    }}
                    sx={{
                        '.MuiPopover-paper': {
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: alpha(theme.palette.divider, 0.2),
                        },
                    }}
                >
                    <Picker
                        data={data}
                        onEmojiSelect={handleSelectEmoji}
                        previewPosition="none"
                        skinTonePosition="none"
                        theme={theme.palette.mode === 'dark' ? 'dark' : 'light'}
                        set="native"
                        navPosition="top"
                        categories={[
                            'foods',
                            'places',
                            'activities',
                            'nature',
                            'flags',
                            'objects',
                            'symbols',
                        ]}
                        perLine={7}
                        maxFrequentRows={0}
                        emojiSize={24}
                        emojiButtonSize={36}
                        searchPosition="sticky"
                        autoFocus={false}
                    />
                </Popover>
            </Drawer>
        </>
    );
};

export default CollectionsDrawer;
