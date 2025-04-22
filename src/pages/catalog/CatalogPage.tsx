import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, useTheme, Button } from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RecipeService } from '../../services/RecipeService';
import { CollectionService } from '../../services/CollectionService';
import { Recipe } from '../../types/recipe';
import SearchBar from '../../components/search-bar/SearchBar';
import { useDebounce } from '../../hooks';
import { MatchType } from '../../components/recipe/MatchCornerFold';
import CollectionsDrawer from '../../components/collections/CollectionsDrawer';

// Import from collection.ts including the new constant
import {
    CollectionItem,
    ALL_RECIPES_ID,
    COLLECTION_ROUTE_PATH,
} from '../../types/collection';

// Sharing components
import SendIcon from '@mui/icons-material/Send';
import ShareDialog from '../../components/sharing/ShareDialog';

// Import our new components
import RecipeGrid from '../../features/catalog/components/RecipeGrid';

/**
 * Determines the highest priority match type for a recipe
 */
const determineMatchType = (recipe: Recipe, searchQuery: string): MatchType => {
    if (!searchQuery.trim()) return null;

    const normalizedSearch = searchQuery.toLowerCase().trim();

    // Check title match (highest priority)
    if (recipe.title && recipe.title.toLowerCase().includes(normalizedSearch)) {
        return 'title';
    }

    // Check tag match (medium priority)
    if (recipe.tags && Array.isArray(recipe.tags)) {
        const hasTagMatch = recipe.tags.some(
            (tag) =>
                typeof tag === 'string' &&
                tag.toLowerCase().includes(normalizedSearch)
        );
        if (hasTagMatch) return 'tag';
    }

    // Check ingredient match (lowest priority)
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        const hasIngredientMatch = recipe.ingredients.some(
            (ingredient) =>
                ingredient &&
                ingredient.name &&
                ingredient.name.toLowerCase().includes(normalizedSearch)
        );
        if (hasIngredientMatch) return 'ingredient';
    }

    return null;
};

const CatalogPage: FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { collectionId } = useParams<{ collectionId?: string }>();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [initialLoading, setInitialLoading] = useState(true); // Initial loading state
    const [searchLoading, setSearchLoading] = useState(false); // Search-specific loading state
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const RECIPES_PER_PAGE = 10;
    const initialLoadCompleted = useRef(false);
    const [selectedCollection, setSelectedCollection] = useState<string>(
        collectionId || ALL_RECIPES_ID
    );
    const [drawerOpen, setDrawerOpen] = useState(false);
    // New state for collections
    const [collections, setCollections] = useState<CollectionItem[]>([]);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    // Add state to track items being removed with animation
    const [collectionsBeingRemoved, setCollectionsBeingRemoved] = useState<
        string[]
    >([]);

    // Add state for collection sharing
    const [collectionShareDialogOpen, setCollectionShareDialogOpen] =
        useState(false);

    const drawerWidth = 240;
    const collapsedDrawerWidth = 72;

    // Use debounce hook to delay search and reduce API calls
    const debouncedSearch = useDebounce(searchQuery, 500);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastRecipeElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (
                (initialLoading && !initialLoadCompleted.current) ||
                loadingMore
            )
                return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMoreRecipes();
                }
            });

            if (node) observer.current.observe(node);
        },
        [initialLoading, loadingMore, hasMore]
    );

    // Update debounced search when debounced value changes
    useEffect(() => {
        setDebouncedSearchQuery(debouncedSearch);
    }, [debouncedSearch]);

    // Effect to sync URL param with selected collection
    useEffect(() => {
        // Case 1: URL has a collection ID that's different from current selection
        if (collectionId && collectionId !== selectedCollection) {
            setSelectedCollection(collectionId);

            // Only reload recipes if initial load is complete
            if (initialLoadCompleted.current) {
                loadRecipesByCollection(collectionId);
            }
        }
        // Case 2: URL has no collection ID (root URL/All Recipes) but we're not on All Recipes view
        else if (
            !collectionId &&
            selectedCollection !== ALL_RECIPES_ID &&
            initialLoadCompleted.current
        ) {
            setSelectedCollection(ALL_RECIPES_ID);
            loadRecipesByCollection(ALL_RECIPES_ID);
        }
    }, [collectionId, selectedCollection]);

    // Load initial collections when user is available
    useEffect(() => {
        if (user) {
            loadCollections();
        }
    }, [user]);

    // Handle initial load of recipes
    useEffect(() => {
        if (user && !initialLoadCompleted.current) {
            loadInitialRecipes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, selectedCollection]);

    // Handle search updates
    useEffect(() => {
        if (
            user &&
            initialLoadCompleted.current &&
            debouncedSearchQuery !== null
        ) {
            performSearch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, debouncedSearchQuery]);

    // Function to load collections
    const loadCollections = async () => {
        if (!user) return;

        setCollectionsLoading(true);
        try {
            const fetchedCollections =
                await CollectionService.getCollectionItems(user.id);
            setCollections(fetchedCollections);

            // If this is the first time loading collections, load the selected collection from URL or default to "All Recipes"
            if (!initialLoadCompleted.current) {
                const collectionToLoad = collectionId || selectedCollection;

                // Validate that the collection exists or default to ALL_RECIPES_ID
                const collectionExists = collectionId
                    ? fetchedCollections.some((c) => c.id === collectionId) ||
                      collectionId === ALL_RECIPES_ID // Also allow ALL_RECIPES_ID
                    : true;

                const finalCollectionId = collectionExists
                    ? collectionToLoad
                    : ALL_RECIPES_ID;

                if (finalCollectionId !== collectionId && collectionId) {
                    // If the collection in URL doesn't exist, navigate to all recipes
                    navigate('/', { replace: true });
                } else {
                    await loadRecipesByCollection(finalCollectionId);
                    initialLoadCompleted.current = true;
                }
            }
        } catch (err) {
            console.error('Error loading collections:', err);
            setCollections([]);
        } finally {
            setCollectionsLoading(false);
        }
    };

    // Add a new function to load recipes based on the selected collection
    const loadRecipesByCollection = async (collectionId: string) => {
        if (!user) return;

        setInitialLoading(true);
        setError(null);

        try {
            let fetchedRecipes: Recipe[] = [];

            // Check if this is "All Recipes" view or a specific collection
            if (collectionId === ALL_RECIPES_ID) {
                fetchedRecipes = await RecipeService.getRecipes(user.id);
            } else {
                fetchedRecipes = await CollectionService.getRecipesByCollection(
                    user.id,
                    collectionId
                );
            }

            // If there's a search query, filter the recipes client-side
            if (searchQuery) {
                const normalizedSearch = searchQuery.toLowerCase().trim();
                fetchedRecipes = fetchedRecipes.filter(
                    (recipe) =>
                        recipe.title.toLowerCase().includes(normalizedSearch) ||
                        (recipe.tags &&
                            recipe.tags.some((tag) =>
                                tag.toLowerCase().includes(normalizedSearch)
                            )) ||
                        (recipe.ingredients &&
                            recipe.ingredients.some((ing) =>
                                ing.name
                                    .toLowerCase()
                                    .includes(normalizedSearch)
                            ))
                );
            }

            setRecipes(fetchedRecipes);

            // Update pagination
            setHasMore(fetchedRecipes.length > RECIPES_PER_PAGE);
            setPage(1);
        } catch (err) {
            console.error('Error loading recipes by collection:', err);
            setError('Failed to load recipes. Please try again.');
        } finally {
            setInitialLoading(false);
        }
    };

    // Modify loadInitialRecipes to use the selected collection
    const loadInitialRecipes = async () => {
        if (!user) return;

        setInitialLoading(true);
        setError(null);

        try {
            await loadRecipesByCollection(selectedCollection);
            initialLoadCompleted.current = true;
        } catch (err) {
            console.error('Error loading initial recipes:', err);
            setError('Failed to load recipes. Please try again.');
        } finally {
            setInitialLoading(false);
        }
    };

    // Modify performSearch to account for collection filtering
    const performSearch = async () => {
        if (!user) return;

        setSearchLoading(true);
        setError(null);

        try {
            // Using the same loadRecipesByCollection function for consistency
            await loadRecipesByCollection(selectedCollection);
        } catch (err) {
            console.error('Error searching recipes:', err);
            setError('Failed to search recipes. Please try again.');
        } finally {
            setSearchLoading(false);
        }
    };

    const loadMoreRecipes = async () => {
        if (!user || loadingMore || !hasMore) return;

        setLoadingMore(true);

        try {
            const nextPage = page + 1;
            const start = page * RECIPES_PER_PAGE;
            const end = start + RECIPES_PER_PAGE;

            // Note: We're now loading all recipes at once but still simulating pagination
            // for the UI. Future enhancement could implement actual server-side pagination.
            const nextRecipes = recipes.slice(start, end);

            if (nextRecipes.length === 0) {
                setHasMore(false);
            } else {
                setRecipes((prevRecipes) => [...prevRecipes, ...nextRecipes]);
                setHasMore(recipes.length > end);
                setPage(nextPage);
            }
        } catch (err) {
            console.error('Error loading more recipes:', err);
            setError('Failed to load more recipes. Please try again.');
        } finally {
            setLoadingMore(false);
        }
    };

    // Handle search input changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
    };

    // Calculate the visible recipes based on pagination
    const visibleRecipes = recipes.slice(0, page * RECIPES_PER_PAGE);

    // Update handleCollectionSelect to update URL and filter recipes
    const handleCollectionSelect = async (collectionId: string) => {
        setSelectedCollection(collectionId);

        // Update URL based on selected collection
        if (collectionId === ALL_RECIPES_ID) {
            navigate('/', { replace: false }); // Go to home for "All Recipes"
        } else {
            navigate(`${COLLECTION_ROUTE_PATH}/${collectionId}`, {
                replace: false,
            });
        }

        // Reset search when changing collections
        if (searchQuery) {
            setSearchQuery('');
            setDebouncedSearchQuery('');
        }

        // Load recipes for the selected collection
        await loadRecipesByCollection(collectionId);
    };

    // Handle drawer state change
    const handleDrawerStateChange = (isOpen: boolean) => {
        setDrawerOpen(isOpen);
    };

    // Create a new collection
    const handleCreateCollection = async () => {
        if (!user) return;

        try {
            // Generate a temporary ID for optimistic update
            const tempId = `temp-${Date.now()}`;

            // Create optimistic collection item
            const newCollection: CollectionItem = {
                id: tempId,
                name: 'New Collection',
                emoji: '🥘',
                count: 0,
            };

            // Optimistically update the UI
            setCollections((prev) => [...prev, newCollection]);

            // Create a new empty collection with default name and emoji in the backend
            const createdCollection = await CollectionService.createCollection(
                user.id,
                'New Collection',
                '🥘'
            );

            // Update collections with the actual data from backend
            setCollections((prev) =>
                prev.map((c) =>
                    c.id === tempId ? { ...createdCollection, count: 0 } : c
                )
            );
        } catch (err) {
            console.error('Error creating collection:', err);
            // Revert optimistic update on error
            setCollections((prev) =>
                prev.filter((c) => !c.id.startsWith('temp-'))
            );
        }
    };

    // Add handleUpdateCollection function
    const handleUpdateCollection = async (
        collectionId: string,
        name: string,
        emoji?: string
    ) => {
        if (!user) return;

        try {
            // Optimistically update the UI first
            setCollections((prev) =>
                prev.map((c) =>
                    c.id === collectionId
                        ? { ...c, name, emoji: emoji || c.emoji }
                        : c
                )
            );

            // Update in the backend
            await CollectionService.updateCollection(collectionId, {
                name,
                emoji,
            });

            // No need to reload all collections since we've already updated our local state
        } catch (err) {
            console.error('Error updating collection:', err);
            // Reload collections on error to ensure UI is in sync with backend
            await loadCollections();
        }
    };

    // Modified handleDeleteCollection function with animation support
    const handleDeleteCollection = async (collectionId: string) => {
        if (!user) return;

        try {
            // Mark this collection as being removed (for animation)
            setCollectionsBeingRemoved((prev) => [...prev, collectionId]);

            // Set a small timeout to allow the animation to complete
            setTimeout(async () => {
                try {
                    // Remove from the backend
                    await CollectionService.deleteCollection(collectionId);

                    // Update the selected collection if the one being deleted is selected
                    if (selectedCollection === collectionId) {
                        setSelectedCollection(ALL_RECIPES_ID);
                        navigate('/', { replace: true });
                        await loadRecipesByCollection(ALL_RECIPES_ID);
                    }

                    // Update our local state
                    setCollections((prev) =>
                        prev.filter((c) => c.id !== collectionId)
                    );
                } catch (error) {
                    console.error(
                        'Error deleting collection from backend:',
                        error
                    );
                } finally {
                    // Remove from the being-removed state
                    setCollectionsBeingRemoved((prev) =>
                        prev.filter((id) => id !== collectionId)
                    );
                }
            }, 300); // Match this with your animation duration
        } catch (err) {
            console.error('Error starting collection deletion:', err);
            // Remove from the being-removed state
            setCollectionsBeingRemoved((prev) =>
                prev.filter((id) => id !== collectionId)
            );
        }
    };

    // Helper function to find the currently selected collection
    const getSelectedCollection = () => {
        return (
            collections.find((c) => c.id === selectedCollection) || {
                // Fallback to a default collection if not found
                id: ALL_RECIPES_ID,
                name: 'All Recipes',
                count: 0,
                emoji: '📚',
            }
        );
    };

    // Handle recipe click with collection context
    const handleRecipeClick = (recipe: Recipe) => {
        // Navigate to recipe detail with collection context in state
        navigate(`/recipe/${recipe.id}`, {
            state: {
                recipe,
                fromCollection: selectedCollection,
                returnTo:
                    selectedCollection === ALL_RECIPES_ID
                        ? '/'
                        : `${COLLECTION_ROUTE_PATH}/${selectedCollection}`,
            },
        });
    };

    // Handle drop event from CollectionsDrawer
    const handleDropRecipeOnCollection = useCallback(
        async (recipeId: string, targetCollectionId: string) => {
            if (!user) return;

            // The source collection is the one currently selected/viewed in the UI
            const sourceCollectionId = selectedCollection;

            // Prevent dropping onto the same collection view (no action needed)
            // Note: Dropping onto "All Recipes" is handled by the drop target itself
            if (sourceCollectionId === targetCollectionId) {
                console.log(
                    'Recipe dropped onto the same collection view. No action needed.'
                );
                return;
            }

            // Find the recipe being dragged (from the currently loaded recipes)
            const recipe = recipes.find((r) => r.id === recipeId);
            if (!recipe) {
                console.error(
                    'Dragged recipe not found in current view state.'
                );
                setError(
                    'An error occurred while moving the recipe. Please refresh and try again.'
                );
                return;
            }

            console.log(
                `Attempting to move recipe ${recipeId} from view ${sourceCollectionId} to target ${targetCollectionId}`
            );

            // Store original states for potential rollback
            const originalCollections = [...collections];
            const originalRecipes = [...recipes];

            try {
                let needsUIRemoval = false; // Should the recipe be removed from the current UI list?
                let needsTargetCountIncrease = false;
                let needsSourceCountDecrease = false;

                // --- Perform Backend Operations ---

                // 1. Add to Target Collection (if target is a specific collection)
                if (targetCollectionId !== ALL_RECIPES_ID) {
                    console.log(
                        `Backend Call: Add recipe ${recipeId} to collection ${targetCollectionId}`
                    );
                    await CollectionService.addRecipeToCollection(
                        recipeId,
                        targetCollectionId
                    );
                    needsTargetCountIncrease = true;
                }

                // 2. Remove from Source Collection (if source was a specific collection)
                // This runs if dragging from a specific collection, regardless of target.
                if (sourceCollectionId !== ALL_RECIPES_ID) {
                    console.log(
                        `Backend Call: Remove recipe ${recipeId} from collection ${sourceCollectionId}`
                    );
                    await CollectionService.removeRecipeFromCollection(
                        recipeId,
                        sourceCollectionId
                    );
                    needsSourceCountDecrease = true;
                    // We only remove from the UI list if the recipe was dragged out of the *currently viewed* collection.
                    needsUIRemoval = true;
                }

                // --- Optimistic UI Updates ---

                console.log('Applying optimistic UI updates...');

                // 1. Update collection counts
                setCollections((prev) =>
                    prev.map((c) => {
                        let count = c.count;
                        // Increment target count if added to a specific collection
                        if (
                            needsTargetCountIncrease &&
                            c.id === targetCollectionId
                        ) {
                            count++;
                        }
                        // Decrement source count if removed from a specific collection
                        if (
                            needsSourceCountDecrease &&
                            c.id === sourceCollectionId
                        ) {
                            count = Math.max(0, count - 1); // Prevent count going below 0
                        }
                        return { ...c, count };
                    })
                );

                // 2. Remove recipe from the currently displayed list if needed
                if (needsUIRemoval) {
                    console.log(
                        `Optimistic UI: Removing recipe ${recipeId} from current view.`
                    );
                    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
                }

                console.log('Optimistic UI updates applied successfully.');
                // Optional: Add success feedback (e.g., Snackbar)
            } catch (err) {
                console.error('Error moving recipe:', err);
                const targetName =
                    collections.find((c) => c.id === targetCollectionId)
                        ?.name || 'target collection';
                setError(
                    `Failed to move recipe to ${targetName}. Please try again.`
                );
                // Rollback UI updates on error
                setCollections(originalCollections);
                setRecipes(originalRecipes);
                // Optional: Show error notification
            }
        },
        [user, selectedCollection, recipes, collections] // Dependencies
    );

    // Handle reordering of recipes within a collection
    const handleRecipeReordering = useCallback(
        async (draggedId: string, targetId: string, newIndex: number) => {
            if (!user || selectedCollection === ALL_RECIPES_ID) return;

            console.log(
                `Reordering recipe ${draggedId} to position ${newIndex}`
            );

            // Store original recipe order for potential rollback
            const originalRecipes = [...recipes];

            try {
                // Find the dragged recipe and its index
                const draggedRecipeIndex = recipes.findIndex(
                    (r) => r.id === draggedId
                );
                if (draggedRecipeIndex === -1) {
                    console.error('Dragged recipe not found in list');
                    return;
                }

                // Find the target recipe
                const targetRecipeIndex = recipes.findIndex(
                    (r) => r.id === targetId
                );
                if (targetRecipeIndex === -1) {
                    console.error('Target recipe not found in list');
                    return;
                }

                // Get all current recipe positions in this collection
                const positionData =
                    await CollectionService.getRecipePositionsInCollection(
                        selectedCollection
                    );

                // If we have no position data, or empty collection, bail out
                if (!positionData.length) {
                    console.error('No position data available for reordering');
                    return;
                }

                // Calculate new position for the dragged recipe
                // Strategy: We place it between the items where it's dropped
                let newPosition: number;

                if (targetRecipeIndex === 0) {
                    // If dropped before the first item
                    newPosition = positionData[0].position - 1000;
                } else if (targetRecipeIndex === recipes.length - 1) {
                    // If dropped after the last item
                    newPosition =
                        positionData[positionData.length - 1].position + 1000;
                } else {
                    // If dropped between two items
                    // Find the position values of the target and the item before it
                    const beforePositionItem = positionData.find(
                        (p) => p.recipeId === recipes[targetRecipeIndex - 1].id
                    );
                    const targetPositionItem = positionData.find(
                        (p) => p.recipeId === targetId
                    );

                    if (!beforePositionItem || !targetPositionItem) {
                        console.error('Cannot find position data for recipes');
                        return;
                    }

                    // Place between the two positions
                    newPosition =
                        (beforePositionItem.position +
                            targetPositionItem.position) /
                        2;
                }

                // Optimistically update UI
                const draggedRecipe = recipes[draggedRecipeIndex];
                const newRecipes = [...recipes];
                newRecipes.splice(draggedRecipeIndex, 1); // Remove from old position
                newRecipes.splice(targetRecipeIndex, 0, draggedRecipe); // Insert at new position
                setRecipes(newRecipes);

                // Update the position in the database
                await CollectionService.updateRecipePositionInCollection(
                    draggedId,
                    selectedCollection,
                    newPosition
                );

                console.log(
                    `Recipe ${draggedId} successfully reordered to position ${newPosition}`
                );
            } catch (err) {
                console.error('Error reordering recipe:', err);
                // Rollback UI updates on error
                setRecipes(originalRecipes);
                setError('Failed to reorder recipe. Please try again.');
            }
        },
        [user, selectedCollection, recipes] // Dependencies
    );

    // Add handler functions for collection sharing
    const handleOpenCollectionShareDialog = () => {
        setCollectionShareDialogOpen(true);
    };

    const handleCloseCollectionShareDialog = () => {
        setCollectionShareDialogOpen(false);
    };

    // Mock shared users for UI testing (would come from API in real implementation)
    const mockCollectionSharedUsers = [
        {
            id: '1',
            email: 'family@example.com',
            access: 'edit' as const,
        },
        {
            id: '2',
            email: user?.email || 'current.user@example.com',
            avatarUrl: user?.user_metadata?.avatar_url,
            access: 'view' as const,
            isCurrentUser: true,
        },
    ];

    // Update the renderShareButton function to handle the CollectionItem structure correctly
    const renderShareButton = () => {
        // Only show share button when viewing a non-All collection that the user owns
        const collection = collections.find((c) => c.id === selectedCollection);

        // Since CollectionItem doesn't have user_id, we might need another check
        // For now, let's assume any non-All collection can be shared if the user is logged in
        if (selectedCollection !== ALL_RECIPES_ID && collection && user) {
            return (
                <Button
                    variant="outlined"
                    startIcon={
                        <SendIcon sx={{ transform: 'rotate(-45deg)' }} />
                    }
                    onClick={handleOpenCollectionShareDialog}
                    sx={{
                        height: { xs: 38, sm: 42 },
                        ml: 1,
                        borderColor: 'divider',
                        color: 'text.primary',
                        fontSize: {
                            xs: '0.875rem',
                            sm: '0.9375rem',
                        },
                        fontFamily: "'Inter', sans-serif",
                        textTransform: 'none',
                        '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'rgba(44, 62, 80, 0.04)',
                        },
                    }}
                >
                    {/* Only show text on screens larger than xs */}
                    <Box
                        component="span"
                        sx={{ display: { xs: 'none', sm: 'inline' } }}
                    >
                        Share
                    </Box>
                </Button>
            );
        }
        return null;
    };

    return (
        <AppLayout
            showAddButton
            hasDrawer={true}
            drawerWidth={drawerWidth}
            collapsedDrawerWidth={collapsedDrawerWidth}
            isDrawerOpen={drawerOpen}
            onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
            headerContent={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'primary.main',
                            fontSize: '1.5rem',
                        }}
                    >
                        {getSelectedCollection().emoji ||
                            getSelectedCollection().icon}
                    </Box>
                    <Typography
                        variant="h6"
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            color: 'primary.main',
                            letterSpacing: '-0.5px',
                            fontFamily: "'Kalam', cursive",
                            // Add these properties to handle overflow with ellipsis
                            maxWidth: { xs: '180px', sm: '300px', md: '100%' },
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {getSelectedCollection().name}
                    </Typography>
                </Box>
            }
            actionButton={renderShareButton()}
        >
            <Box
                sx={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    position: 'relative',
                    flex: 1,
                }}
            >
                <CollectionsDrawer
                    selectedCollection={selectedCollection}
                    onCollectionSelect={handleCollectionSelect}
                    width={drawerWidth}
                    collapsedWidth={collapsedDrawerWidth}
                    onDrawerStateChange={handleDrawerStateChange}
                    collections={collections}
                    isLoading={collectionsLoading}
                    onCreateCollection={handleCreateCollection}
                    onUpdateCollection={handleUpdateCollection}
                    onDeleteCollection={handleDeleteCollection}
                    collectionsBeingRemoved={collectionsBeingRemoved}
                    isOpen={drawerOpen}
                    // Pass the drop handler
                    onDropRecipe={handleDropRecipeOnCollection}
                />

                {/* Content container - adjusted with left margin to account for drawer width */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        minWidth: 0, // Important for flex child to prevent overflow
                        px: { xs: 2, sm: 3, md: 4 },
                        py: { xs: 3, sm: 4 },
                        flex: 1,
                        bgcolor: 'paper.light',
                        position: 'relative',
                        marginLeft: {
                            xs: 0, // No margin on small screens regardless of drawer state
                            sm: drawerOpen
                                ? `${drawerWidth}px`
                                : `${collapsedDrawerWidth}px`,
                        },
                        transition: theme.transitions.create(['margin'], {
                            easing: theme.transitions.easing.easeInOut,
                            duration: theme.transitions.duration.standard,
                        }),
                        backdropFilter: 'blur(8px)',
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
                        overflow: 'auto', // Makes this container independently scrollable
                    }}
                >
                    {/* SearchBar with search indicator */}
                    <SearchBar
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder={
                            selectedCollection === ALL_RECIPES_ID
                                ? 'Search recipes by name, tags, or ingredients...'
                                : `Search in "${
                                      getSelectedCollection().name
                                  }"...`
                        }
                        resultsCount={recipes.length}
                        isSearching={searchLoading}
                    />

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            width: '100%',
                            minWidth: '100%',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        <RecipeGrid
                            visibleRecipes={visibleRecipes}
                            initialLoading={initialLoading}
                            searchLoading={searchLoading}
                            loadingMore={loadingMore}
                            error={error}
                            searchQuery={searchQuery}
                            selectedCollection={selectedCollection}
                            lastRecipeElementRef={lastRecipeElementRef}
                            handleRecipeClick={handleRecipeClick}
                            determineMatchType={determineMatchType}
                            handleRecipeReordering={
                                selectedCollection !== ALL_RECIPES_ID
                                    ? handleRecipeReordering
                                    : undefined
                            }
                        />
                    </Box>
                </Box>
            </Box>

            {/* Collection Share Dialog */}
            <ShareDialog
                open={collectionShareDialogOpen}
                onClose={handleCloseCollectionShareDialog}
                title="Share Collection"
                itemType="collection"
                itemTitle={
                    collections.find((c) => c.id === selectedCollection)
                        ?.name || 'Collection'
                }
                sharedUsers={mockCollectionSharedUsers}
                ownerEmail={user?.email || 'owner@example.com'}
                ownerAvatarUrl={user?.user_metadata?.avatar_url}
                ownerId={user?.id}
                currentUserId={user?.id}
            />
        </AppLayout>
    );
};

export default CatalogPage;
