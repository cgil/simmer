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
    Theme,
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
// Import DnD hooks and types
import { useDrop, ConnectDropTarget } from 'react-dnd';
import { ItemTypes, RecipeDragItem } from '../../types/dnd';

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
    onDropRecipe?: (recipeId: string, collectionId: string) => void; // Handler for dropping recipes
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
    onDropRecipe, // Destructure the new prop
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
    const listItemRefs = useRef<Record<string, HTMLElement | null>>({});

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
                        <List sx={{ px: isOpen ? 1 : 0.75, pt: 1 }}>
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
                                                justifyContent: isOpen
                                                    ? 'flex-start'
                                                    : 'center',
                                                bgcolor: alpha(
                                                    theme.palette.primary.light,
                                                    0.04
                                                ),
                                            }}
                                        >
                                            {isOpen ? (
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
                                                                    .primary
                                                                    .light,
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
                                                                    theme
                                                                        .palette
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
                                                                    theme
                                                                        .palette
                                                                        .primary
                                                                        .light,
                                                                    0.07
                                                                ),
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Skeleton
                                                    variant="circular"
                                                    width={32}
                                                    height={32}
                                                    animation="pulse"
                                                    sx={{
                                                        bgcolor: alpha(
                                                            theme.palette
                                                                .primary.light,
                                                            0.1
                                                        ),
                                                    }}
                                                />
                                            )}
                                        </Paper>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <List sx={{ px: isOpen ? 1 : 0.75, pt: 1 }}>
                            {sortedCollections.map((collection) => (
                                <CollectionListItem
                                    key={collection.id}
                                    collection={collection}
                                    isOpen={isOpen}
                                    selectedCollection={selectedCollection}
                                    editingCollection={editingCollection}
                                    deletingCollection={deletingCollection}
                                    hoveredCollection={hoveredCollection}
                                    collectionsBeingRemoved={
                                        collectionsBeingRemoved
                                    }
                                    onCollectionSelect={onCollectionSelect}
                                    onEditCollection={handleEditCollection}
                                    onConfirmDelete={handleConfirmDelete}
                                    onSaveCollection={handleSaveCollection}
                                    onCancelEdit={handleCancelEdit}
                                    onDeleteCollection={handleDeleteCollection}
                                    onCancelDelete={handleCancelDelete}
                                    onOpenEmojiPicker={handleOpenEmojiPicker}
                                    setHoveredCollection={setHoveredCollection}
                                    getCollectionIcon={getCollectionIcon}
                                    formatRecipeCount={formatRecipeCount}
                                    collectionItemRef={collectionItemRef}
                                    listItemRefs={listItemRefs}
                                    buttonPositions={buttonPositions}
                                    onDropRecipe={onDropRecipe}
                                    editingName={editingName}
                                    setEditingName={setEditingName}
                                    theme={theme}
                                />
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
                        {isLoading ? (
                            <>
                                {/* Skeleton for open drawer */}
                                <Fade
                                    in={isOpen}
                                    timeout={{ enter: 400, exit: 200 }}
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        transitionDelay: isOpen
                                            ? '100ms'
                                            : '0ms',
                                    }}
                                    unmountOnExit
                                >
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            width: '100%',
                                            height: '36px',
                                            borderRadius: 2,
                                            border: '1px dashed',
                                            borderColor: alpha(
                                                theme.palette.primary.light,
                                                0.3
                                            ),
                                            display: 'flex',
                                            alignItems: 'center',
                                            pl: 1.5,
                                            bgcolor: alpha(
                                                theme.palette.primary.light,
                                                0.04
                                            ),
                                        }}
                                    >
                                        <Skeleton
                                            variant="circular"
                                            width={20}
                                            height={20}
                                            animation="pulse"
                                            sx={{
                                                mr: 1,
                                                bgcolor: alpha(
                                                    theme.palette.primary.light,
                                                    0.1
                                                ),
                                            }}
                                        />
                                        <Skeleton
                                            variant="text"
                                            width="60%"
                                            height={20}
                                            animation="wave"
                                            sx={{
                                                bgcolor: alpha(
                                                    theme.palette.primary.light,
                                                    0.1
                                                ),
                                            }}
                                        />
                                    </Paper>
                                </Fade>

                                {/* Skeleton for collapsed drawer */}
                                <Zoom
                                    in={!isOpen}
                                    timeout={{ enter: 300, exit: 200 }}
                                    style={{
                                        transitionDelay: !isOpen
                                            ? '75ms'
                                            : '0ms',
                                    }}
                                    unmountOnExit
                                >
                                    <Skeleton
                                        variant="circular"
                                        width={36}
                                        height={36}
                                        animation="pulse"
                                        sx={{
                                            bgcolor: alpha(
                                                theme.palette.primary.light,
                                                0.1
                                            ),
                                            border: '1px dashed',
                                            borderColor: alpha(
                                                theme.palette.primary.light,
                                                0.3
                                            ),
                                        }}
                                    />
                                </Zoom>
                            </>
                        ) : (
                            <>
                                <Fade
                                    in={isOpen}
                                    timeout={{ enter: 400, exit: 200 }}
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        transitionDelay: isOpen
                                            ? '100ms'
                                            : '0ms',
                                    }}
                                    unmountOnExit
                                >
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={
                                            <AddRoundedIcon fontSize="small" />
                                        }
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
                                        transitionDelay: !isOpen
                                            ? '75ms'
                                            : '0ms',
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
                                                        theme.palette.primary
                                                            .main,
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
                            </>
                        )}
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

// --- Internal Collection List Item Component ---
// Create a separate component to handle the logic for each item, including useDrop
interface CollectionListItemProps {
    collection: CollectionItem;
    isOpen: boolean;
    selectedCollection: string;
    editingCollection: string | null;
    deletingCollection: string | null;
    hoveredCollection: string | null;
    collectionsBeingRemoved: string[];
    onCollectionSelect: (id: string) => void;
    onEditCollection: (id: string) => void;
    onConfirmDelete: (id: string) => void;
    onSaveCollection: (id: string) => void;
    onCancelEdit: () => void;
    onDeleteCollection: (id: string) => void;
    onCancelDelete: () => void;
    onOpenEmojiPicker: (event: React.MouseEvent<HTMLButtonElement>) => void;
    setHoveredCollection: (id: string | null) => void;
    getCollectionIcon: (collection: CollectionItem) => ReactNode;
    formatRecipeCount: (count: number) => string;
    collectionItemRef: React.RefObject<HTMLDivElement>;
    listItemRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
    buttonPositions: Record<string, { left: number; top: number }>;
    onDropRecipe?: (recipeId: string, collectionId: string) => void;
    editingName: string;
    setEditingName: (name: string) => void;
    theme: Theme;
}

const ALL_RECIPES_ID = 'all'; // Defined locally

const CollectionListItem: FC<CollectionListItemProps> = ({
    collection,
    isOpen,
    selectedCollection,
    editingCollection,
    deletingCollection,
    hoveredCollection,
    collectionsBeingRemoved,
    onCollectionSelect,
    onEditCollection,
    onConfirmDelete,
    onSaveCollection,
    onCancelEdit,
    onDeleteCollection,
    onCancelDelete,
    onOpenEmojiPicker,
    setHoveredCollection,
    getCollectionIcon,
    formatRecipeCount,
    collectionItemRef,
    listItemRefs,
    buttonPositions,
    onDropRecipe,
    editingName,
    setEditingName,
    theme,
}) => {
    const [{ canDrop, isOver }, dropRef]: [
        { canDrop: boolean; isOver: boolean },
        ConnectDropTarget
    ] = useDrop(() => {
        // Determine if the item being dragged is from a specific collection
        const isItemFromSpecificCollection = (
            item: RecipeDragItem | null
        ): boolean => {
            return !!(
                item &&
                item.sourceCollectionId &&
                item.sourceCollectionId !== ALL_RECIPES_ID
            );
        };

        return {
            accept: ItemTypes.RECIPE_CARD,
            drop: (item: RecipeDragItem) => {
                // Prevent dropping if editing/deleting THIS item
                if (
                    editingCollection === collection.id ||
                    deletingCollection === collection.id
                ) {
                    return;
                }
                // Handle drop onto "All Recipes"
                if (collection.id === ALL_RECIPES_ID) {
                    if (isItemFromSpecificCollection(item) && onDropRecipe) {
                        console.log(
                            `Dropped recipe ${item.recipeId} from ${item.sourceCollectionId} onto All Recipes`
                        );
                        onDropRecipe(item.recipeId, ALL_RECIPES_ID);
                    }
                }
                // Handle drop onto a specific collection (different from source)
                else if (
                    item.sourceCollectionId !== collection.id &&
                    onDropRecipe
                ) {
                    console.log(
                        `Dropped recipe ${item.recipeId} onto collection ${collection.id}`
                    );
                    onDropRecipe(item.recipeId, collection.id);
                }
            },
            canDrop: (item: RecipeDragItem) => {
                // Basic conditions: Target is not being edited/deleted
                const basicCanDrop =
                    editingCollection !== collection.id &&
                    deletingCollection !== collection.id;
                if (!basicCanDrop) return false;

                // Allow drop if target is a specific collection (and not the source)
                if (collection.id !== ALL_RECIPES_ID) {
                    return item.sourceCollectionId !== collection.id;
                }

                // Allow drop if target is "All Recipes" AND item came from a specific collection
                if (collection.id === ALL_RECIPES_ID) {
                    return isItemFromSpecificCollection(item);
                }

                return false; // Default deny
            },
            collect: (monitor) => ({
                isOver: monitor.isOver(),
                // Ensure the final canDrop value is a boolean
                canDrop: !!monitor.canDrop(),
            }),
        };
    }, [onDropRecipe, collection.id, editingCollection, deletingCollection]);

    // Determine if visual drop indication should be shown (not for All Recipes)
    const showDropIndication =
        isOver && canDrop && collection.id !== ALL_RECIPES_ID;

    return (
        <Collapse
            in={!collectionsBeingRemoved.includes(collection.id)}
            appear={true}
            timeout={{ enter: 400, exit: 300 }}
            unmountOnExit
            sx={{
                transformOrigin: 'top center',
                animation: isNewCollection(collection.id)
                    ? 'highlight-new-collection 1.5s ease-out'
                    : 'none',
                '@keyframes highlight-new-collection': {
                    '0%': {
                        transform: 'scale(0.95)',
                        boxShadow: '0 0 0 0 rgba(44, 62, 80, 0.1)',
                    },
                    '20%': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 0 0 6px rgba(44, 62, 80, 0)',
                    },
                    '100%': {
                        transform: 'scale(1)',
                        boxShadow: '0 0 0 0 rgba(44, 62, 80, 0)',
                    },
                },
            }}
            onMouseEnter={() => setHoveredCollection(collection.id)}
            onMouseLeave={() => setHoveredCollection(null)}
            ref={(el: HTMLLIElement | null) => {
                if (el) {
                    listItemRefs.current[collection.id] = el;
                } else {
                    delete listItemRefs.current[collection.id];
                }
            }}
        >
            <ListItem
                disablePadding
                sx={{
                    mb: 0.5,
                    position: 'relative',
                    overflow: 'visible',
                }}
            >
                {/* Wrapper Box - Apply drop ref and hover styles here */}
                <Box
                    ref={(node: HTMLDivElement | null) => {
                        dropRef(node);
                        if (
                            collection.id === editingCollection ||
                            collection.id === deletingCollection
                        ) {
                            (
                                collectionItemRef as React.MutableRefObject<HTMLDivElement | null>
                            ).current = node;
                        }
                    }}
                    sx={{
                        width: '100%',
                        position: 'relative',
                        transform: showDropIndication
                            ? 'scale(1.01)'
                            : 'scale(1)',
                        transformOrigin: 'center left',
                        transition: theme.transitions.create(
                            ['transform', 'background-color', 'box-shadow'],
                            {
                                duration: theme.transitions.duration.short,
                            }
                        ),
                        bgcolor: showDropIndication
                            ? alpha(theme.palette.primary.main, 0.15)
                            : isNewCollection(collection.id)
                            ? alpha(theme.palette.primary.light, 0.2)
                            : 'transparent',
                        borderRadius: 2,
                        boxShadow: showDropIndication
                            ? `0 0 0 2px ${alpha(
                                  theme.palette.primary.main,
                                  0.3
                              )} inset`
                            : 'none',
                    }}
                >
                    {/* Delete confirmation slide-in panel */}
                    <Slide
                        direction="left"
                        in={deletingCollection === collection.id}
                        timeout={300}
                        mountOnEnter
                        unmountOnExit
                        container={collectionItemRef.current}
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
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    height: COLLECTION_ITEM_HEIGHT,
                                    p: 1,
                                    backgroundColor: '#ffebee',
                                    border: '1px solid',
                                    borderColor: '#ef9a9a',
                                    borderRadius: 2,
                                    animation: 'pulse 1.5s ease-in-out',
                                    '@keyframes pulse': {
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
                                    Delete collection & recipes?
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0 }}>
                                    <Zoom
                                        in={true}
                                        timeout={200}
                                        style={{ transitionDelay: '150ms' }}
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                onDeleteCollection(
                                                    collection.id
                                                )
                                            }
                                            sx={{
                                                color: alpha(
                                                    theme.palette.primary.light,
                                                    0.8
                                                ),
                                                transition:
                                                    'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                '&:hover': {
                                                    bgcolor: alpha(
                                                        theme.palette.primary
                                                            .light,
                                                        0.05
                                                    ),
                                                    transform: 'scale(1.1)',
                                                },
                                            }}
                                        >
                                            <CheckRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Zoom>
                                    <Zoom
                                        in={true}
                                        timeout={200}
                                        style={{ transitionDelay: '250ms' }}
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={onCancelDelete}
                                            sx={{
                                                color: alpha(
                                                    theme.palette.primary.light,
                                                    0.8
                                                ),
                                                transition:
                                                    'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                '&:hover': {
                                                    bgcolor: alpha(
                                                        theme.palette.primary
                                                            .light,
                                                        0.05
                                                    ),
                                                    transform: 'scale(1.1)',
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

                    {editingCollection === collection.id ? (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1,
                                width: '100%',
                                height: COLLECTION_ITEM_HEIGHT,
                                borderRadius: 2,
                                bgcolor: alpha(
                                    theme.palette.primary.light,
                                    0.05
                                ),
                                border: '1px solid',
                                borderColor: alpha(
                                    theme.palette.primary.main,
                                    0.1
                                ),
                            }}
                        >
                            <IconButton
                                size="small"
                                onClick={onOpenEmojiPicker}
                                sx={{ mr: 1 }}
                            >
                                {getCollectionIcon(collection)}
                            </IconButton>
                            <TextField
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                variant="standard"
                                size="small"
                                fullWidth
                                autoFocus
                                InputProps={{
                                    disableUnderline: true,
                                    sx: {
                                        fontSize: '0.95rem',
                                        fontWeight: 500,
                                    },
                                }}
                            />
                        </Box>
                    ) : (
                        <ListItemButton
                            selected={selectedCollection === collection.id}
                            onClick={() => {
                                if (
                                    editingCollection !== collection.id &&
                                    deletingCollection !== collection.id &&
                                    !(isOver && canDrop)
                                ) {
                                    onCollectionSelect(collection.id);
                                }
                            }}
                            sx={{
                                borderRadius: 2,
                                height: COLLECTION_ITEM_HEIGHT,
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                '&:hover': {
                                    bgcolor: showDropIndication
                                        ? undefined
                                        : alpha(
                                              theme.palette.primary.main,
                                              0.06
                                          ),
                                },
                                '&.Mui-selected': {
                                    bgcolor: alpha(
                                        theme.palette.primary.light,
                                        0.1
                                    ),
                                    color: 'primary.dark',
                                    boxShadow: `0 1px 3px ${alpha(
                                        theme.palette.primary.main,
                                        0.1
                                    )}`,
                                    '&:hover': {
                                        bgcolor: showDropIndication
                                            ? undefined
                                            : alpha(
                                                  theme.palette.primary.light,
                                                  0.3
                                              ),
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: 'primary.main',
                                    },
                                    '& .MuiListItemText-secondary': {
                                        color: alpha(
                                            theme.palette.primary.main,
                                            0.7
                                        ),
                                    },
                                },
                                cursor: showDropIndication
                                    ? 'grabbing'
                                    : 'pointer',
                                ...(showDropIndication && {
                                    bgcolor: `${alpha(
                                        theme.palette.primary.main,
                                        0.15
                                    )} !important`,
                                }),
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: isOpen ? 36 : 0,
                                    color:
                                        selectedCollection === collection.id
                                            ? 'primary.main'
                                            : 'primary.main',
                                    fontSize: '1.2rem',
                                }}
                            >
                                {getCollectionIcon(collection)}
                            </ListItemIcon>
                            {isOpen && (
                                <ListItemText
                                    primary={collection.name}
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
                                            fontSize: '0.75rem',
                                            color:
                                                selectedCollection ===
                                                collection.id
                                                    ? alpha(
                                                          theme.palette.primary
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

                {/* Edit/Delete controls - Keep existing Portal logic */}
                {isOpen &&
                    hoveredCollection === collection.id &&
                    !editingCollection &&
                    !deletingCollection &&
                    buttonPositions[collection.id] &&
                    collection.id !== ALL_RECIPES_ID && ( // Don't show edit button for "All Recipes"
                        <Portal>
                            <Grow
                                in={true}
                                timeout={{ enter: 200, exit: 150 }}
                                style={{ transformOrigin: 'center right' }}
                            >
                                <Box
                                    sx={{
                                        position: 'fixed',
                                        left: `${
                                            buttonPositions[collection.id].left
                                        }px`,
                                        top: `${
                                            buttonPositions[collection.id].top -
                                            16
                                        }px`,
                                        zIndex: theme.zIndex.drawer + 1,
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            onEditCollection(collection.id)
                                        }
                                        sx={{
                                            bgcolor: alpha(
                                                theme.palette.background.paper,
                                                0.7
                                            ),
                                            boxShadow: 1,
                                            width: 28,
                                            height: 28,
                                            transition: 'all 0.15s ease',
                                            '&:hover': {
                                                bgcolor: alpha(
                                                    theme.palette.background
                                                        .paper,
                                                    0.9
                                                ),
                                                transform: 'scale(1.02)',
                                            },
                                        }}
                                    >
                                        <EditRoundedIcon
                                            fontSize="small"
                                            sx={{
                                                fontSize: '0.9rem',
                                                color: alpha(
                                                    theme.palette.text
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

                {isOpen &&
                    editingCollection === collection.id &&
                    buttonPositions[collection.id] &&
                    deletingCollection !== collection.id && (
                        <Portal>
                            <Box
                                sx={{
                                    position: 'fixed',
                                    left: `${
                                        buttonPositions[collection.id].left
                                    }px`,
                                    top: `${
                                        buttonPositions[collection.id].top - 48
                                    }px`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.5,
                                    zIndex: theme.zIndex.drawer + 1,
                                }}
                            >
                                {/* Save Button */}
                                <Grow
                                    in={true}
                                    timeout={{ enter: 300, exit: 200 }}
                                    style={{
                                        transformOrigin: 'center left',
                                        transitionDelay: '0ms',
                                    }}
                                    unmountOnExit
                                >
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() =>
                                            onSaveCollection(collection.id)
                                        } // Assuming onSaveCollection handles name/emoji update
                                        sx={{
                                            bgcolor: 'background.paper',
                                            boxShadow: 1,
                                            width: 28,
                                            height: 28,
                                            '&:hover': {
                                                bgcolor: '#f5f5f5',
                                                transform: 'scale(1.02)',
                                            },
                                        }}
                                    >
                                        <CheckRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Grow>
                                {/* Delete Button */}
                                <Grow
                                    in={true}
                                    timeout={{ enter: 300, exit: 200 }}
                                    style={{
                                        transformOrigin: 'center left',
                                        transitionDelay: '75ms',
                                    }}
                                    unmountOnExit
                                >
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            onConfirmDelete(collection.id)
                                        }
                                        sx={{
                                            bgcolor: 'background.paper',
                                            boxShadow: 1,
                                            width: 28,
                                            height: 28,
                                            color: '#ef9a9a',
                                            '&:hover': {
                                                bgcolor: '#fff8f8',
                                                transform: 'scale(1.02)',
                                            },
                                        }}
                                    >
                                        <DeleteRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Grow>
                                {/* Cancel Button */}
                                <Grow
                                    in={true}
                                    timeout={{ enter: 300, exit: 200 }}
                                    style={{
                                        transformOrigin: 'center left',
                                        transitionDelay: '150ms',
                                    }}
                                    unmountOnExit
                                >
                                    <IconButton
                                        size="small"
                                        onClick={onCancelEdit}
                                        sx={{
                                            bgcolor: 'background.paper',
                                            boxShadow: 1,
                                            width: 28,
                                            height: 28,
                                            '&:hover': {
                                                bgcolor: '#f5f5f5',
                                                transform: 'scale(1.02)',
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
    );
};

export default CollectionsDrawer;
