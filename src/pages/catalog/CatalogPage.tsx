import { FC, useState, useEffect, useRef, useCallback } from 'react';
import {
    Grid,
    Typography,
    Box,
    Chip,
    CircularProgress,
    Fade,
    useTheme,
} from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import { Card, CardMedia, CardContent } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatTimeDisplay } from '../../utils/time';
import { useAuth } from '../../context/AuthContext';
import { RecipeService } from '../../services/RecipeService';
import { Recipe } from '../../types/recipe';
import EmptyRecipeBook from '../../components/icons/EmptyRecipeBook';
import SearchBar from '../../components/search-bar/SearchBar';
import { useDebounce } from '../../hooks';
import MatchCornerFold, {
    MatchType,
} from '../../components/recipe/MatchCornerFold';
import CollectionsDrawer from '../../components/collections/CollectionsDrawer';
// Import from collection.ts including the new constant
import {
    CollectionItem,
    ALL_RECIPES_ID,
    COLLECTION_ROUTE_PATH,
} from '../../types/collection';

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
    const [drawerOpen, setDrawerOpen] = useState(true);
    // New state for collections
    const [collections, setCollections] = useState<CollectionItem[]>([]);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    // Add state to track items being removed with animation
    const [collectionsBeingRemoved, setCollectionsBeingRemoved] = useState<
        string[]
    >([]);

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
            const fetchedCollections = await RecipeService.getCollectionItems(
                user.id
            );
            setCollections(fetchedCollections);

            // If this is the first time loading collections, load the selected collection from URL or default to "All Recipes"
            if (!initialLoadCompleted.current) {
                const collectionToLoad = collectionId || selectedCollection;

                // Validate that the collection exists or default to ALL_RECIPES_ID
                const collectionExists = collectionId
                    ? fetchedCollections.some((c) => c.id === collectionId)
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

            if (collectionId === ALL_RECIPES_ID) {
                // Load all recipes if "All Recipes" is selected
                fetchedRecipes = await RecipeService.searchRecipes(
                    user.id,
                    searchQuery || '' // Use current search query if exists
                );
            } else {
                // Load recipes for the specific collection
                fetchedRecipes = await RecipeService.getRecipesByCollection(
                    user.id,
                    collectionId
                );

                // If there's a search query, filter the recipes client-side
                if (searchQuery) {
                    const normalizedSearch = searchQuery.toLowerCase().trim();
                    fetchedRecipes = fetchedRecipes.filter(
                        (recipe) =>
                            recipe.title
                                .toLowerCase()
                                .includes(normalizedSearch) ||
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
                emoji: '📁',
                count: 0,
            };

            // Optimistically update the UI
            setCollections((prev) => [...prev, newCollection]);

            // Create a new empty collection with default name and emoji in the backend
            const createdCollection = await RecipeService.createCollection(
                user.id,
                'New Collection',
                '📁'
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
            await RecipeService.updateCollection(collectionId, { name, emoji });

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
            // Mark the collection as being removed first to trigger exit animation
            setCollectionsBeingRemoved((prev) => [...prev, collectionId]);

            // If the deleted collection was selected, switch to "All Recipes" view
            if (selectedCollection === collectionId) {
                setSelectedCollection(ALL_RECIPES_ID);
                navigate('/', { replace: false });
            }

            // Delete in the backend
            await RecipeService.deleteCollection(collectionId);

            // Wait for animation to complete before updating state
            setTimeout(() => {
                setCollections((prev) =>
                    prev.filter((c) => c.id !== collectionId)
                );
                setCollectionsBeingRemoved((prev) =>
                    prev.filter((id) => id !== collectionId)
                );
            }, 300); // Match Collapse exit animation duration
        } catch (err) {
            console.error('Error deleting collection:', err);
            // Remove from being deleted state
            setCollectionsBeingRemoved((prev) =>
                prev.filter((id) => id !== collectionId)
            );
            // Reload collections on error to ensure UI is in sync with backend
            await loadCollections();
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
                        }}
                    >
                        {getSelectedCollection().name}
                    </Typography>
                </Box>
            }
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
                        {initialLoading ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: '300px',
                                    width: '100%',
                                }}
                            >
                                <CircularProgress color="primary" />
                            </Box>
                        ) : error ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '300px',
                                    width: '100%',
                                    p: 3,
                                }}
                            >
                                <Typography
                                    color="error"
                                    align="center"
                                    gutterBottom
                                >
                                    {error}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    align="center"
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                >
                                    Try refreshing the page or check your
                                    internet connection.
                                </Typography>
                            </Box>
                        ) : visibleRecipes.length > 0 ? (
                            <Fade in={!initialLoading} timeout={300}>
                                <Grid
                                    container
                                    spacing={{ xs: 2, sm: 3 }}
                                    columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
                                >
                                    {visibleRecipes.map((recipe, index) => {
                                        // Check if this is the last recipe element for infinite scroll
                                        const isLastElement =
                                            index === visibleRecipes.length - 1;

                                        // Determine match type if search is active
                                        const matchType = searchQuery
                                            ? determineMatchType(
                                                  recipe,
                                                  searchQuery
                                              )
                                            : null;

                                        return (
                                            <Grid
                                                item
                                                xs={1}
                                                key={
                                                    recipe.id ||
                                                    `recipe-${index}`
                                                }
                                                ref={
                                                    isLastElement
                                                        ? lastRecipeElementRef
                                                        : null
                                                }
                                            >
                                                <Card
                                                    onClick={() =>
                                                        handleRecipeClick(
                                                            recipe
                                                        )
                                                    }
                                                    sx={{
                                                        position: 'relative', // Added to support absolute positioning of the corner fold
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        cursor: 'pointer',
                                                        borderRadius: 1,
                                                        overflow: 'hidden',
                                                        boxShadow: `
                                                            0 1px 2px rgba(0,0,0,0.03),
                                                            0 4px 20px rgba(0,0,0,0.06),
                                                            inset 0 0 0 1px rgba(255,255,255,0.9)
                                                        `,
                                                        transition:
                                                            'all 0.15s ease-in-out',
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        bgcolor:
                                                            'background.paper',
                                                        '&::before': {
                                                            content: '""',
                                                            position:
                                                                'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            height: '100%',
                                                            background:
                                                                'rgba(255,255,255,0.5)',
                                                            backdropFilter:
                                                                'blur(4px)',
                                                            borderRadius: 1,
                                                            zIndex: 0,
                                                            border: '1px solid',
                                                            borderColor:
                                                                'divider',
                                                        },
                                                        '& > *': {
                                                            position:
                                                                'relative',
                                                            zIndex: 1,
                                                        },
                                                        '&:hover': {
                                                            transform:
                                                                'translateY(-2px)',
                                                            boxShadow:
                                                                '0 4px 12px rgba(0,0,0,0.06)',
                                                            borderColor:
                                                                'rgba(44, 62, 80, 0.15)',
                                                        },
                                                    }}
                                                >
                                                    {/* Match Corner Fold - only appears during search */}
                                                    {searchQuery && (
                                                        <MatchCornerFold
                                                            matchType={
                                                                matchType
                                                            }
                                                        />
                                                    )}

                                                    {recipe.images &&
                                                    recipe.images.length > 0 ? (
                                                        <CardMedia
                                                            component="img"
                                                            height="180"
                                                            image={
                                                                recipe.images[0]
                                                            }
                                                            alt={recipe.title}
                                                            sx={{
                                                                objectFit:
                                                                    'cover',
                                                            }}
                                                        />
                                                    ) : (
                                                        <Box
                                                            sx={{
                                                                height: 180,
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                                background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                                                                position:
                                                                    'relative',
                                                                overflow:
                                                                    'hidden',
                                                                padding: 2,
                                                                '&::before': {
                                                                    content:
                                                                        '""',
                                                                    position:
                                                                        'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    right: 0,
                                                                    bottom: 0,
                                                                    backgroundImage: `repeating-linear-gradient(
                                                                        -45deg,
                                                                        rgba(255, 255, 255, 0.3),
                                                                        rgba(255, 255, 255, 0.3) 5px,
                                                                        transparent 5px,
                                                                        transparent 10px
                                                                    )`,
                                                                    opacity: 0.5,
                                                                },
                                                                '&::after': {
                                                                    content: `"${
                                                                        recipe
                                                                            .title
                                                                            .length >
                                                                        20
                                                                            ? recipe.title.substring(
                                                                                  0,
                                                                                  20
                                                                              ) +
                                                                              '...'
                                                                            : recipe.title
                                                                    }"`,
                                                                    position:
                                                                        'absolute',
                                                                    fontFamily:
                                                                        "'Kalam', cursive",
                                                                    fontSize:
                                                                        '1.75rem',
                                                                    color: theme
                                                                        .palette
                                                                        .primary
                                                                        .main,
                                                                    opacity: 0.15,
                                                                    transform:
                                                                        'rotate(-5deg)',
                                                                    textTransform:
                                                                        'uppercase',
                                                                    letterSpacing:
                                                                        '1px',
                                                                    textAlign:
                                                                        'center',
                                                                    width: '100%',
                                                                    maxWidth:
                                                                        '90%',
                                                                    left: '5%',
                                                                    right: '5%',
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                    <CardContent
                                                        sx={{
                                                            flexGrow: 1,
                                                            p: { xs: 2, sm: 3 },
                                                            display: 'flex',
                                                            flexDirection:
                                                                'column',
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="h6"
                                                            component="h2"
                                                            gutterBottom
                                                            sx={{
                                                                fontWeight: 600,
                                                                fontSize: {
                                                                    xs: '1.1rem',
                                                                    sm: '1.25rem',
                                                                },
                                                                mb: 1,
                                                                overflow:
                                                                    'hidden',
                                                                textOverflow:
                                                                    'ellipsis',
                                                                display:
                                                                    '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient:
                                                                    'vertical',
                                                                fontFamily:
                                                                    "'Kalam', cursive",
                                                                color: 'primary.main',
                                                            }}
                                                        >
                                                            {recipe.title}
                                                        </Typography>
                                                        <Typography
                                                            color="text.secondary"
                                                            sx={{
                                                                mb: 2,
                                                                overflow:
                                                                    'hidden',
                                                                textOverflow:
                                                                    'ellipsis',
                                                                display:
                                                                    '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient:
                                                                    'vertical',
                                                                fontSize: {
                                                                    xs: '0.875rem',
                                                                    sm: '1rem',
                                                                },
                                                                minHeight: {
                                                                    xs: '40px',
                                                                    sm: '48px',
                                                                },
                                                                fontFamily:
                                                                    "'Inter', sans-serif",
                                                            }}
                                                        >
                                                            {recipe.description}
                                                        </Typography>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                gap: 0.75,
                                                                flexWrap:
                                                                    'wrap',
                                                                mb: 1,
                                                                mt: 'auto',
                                                            }}
                                                        >
                                                            {recipe.tags &&
                                                                recipe.tags
                                                                    .length >
                                                                    0 &&
                                                                recipe.tags
                                                                    .slice(0, 3)
                                                                    .map(
                                                                        (
                                                                            tag
                                                                        ) => (
                                                                            <Chip
                                                                                key={
                                                                                    tag
                                                                                }
                                                                                label={
                                                                                    tag
                                                                                }
                                                                                size="small"
                                                                                color="secondary"
                                                                                sx={{
                                                                                    fontSize:
                                                                                        '0.75rem',
                                                                                    height: '24px',
                                                                                    fontFamily:
                                                                                        "'Inter', sans-serif",
                                                                                }}
                                                                            />
                                                                        )
                                                                    )}
                                                            {recipe.tags &&
                                                                recipe.tags
                                                                    .length >
                                                                    3 && (
                                                                    <Chip
                                                                        label={`+${
                                                                            recipe
                                                                                .tags
                                                                                .length -
                                                                            3
                                                                        }`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{
                                                                            fontSize:
                                                                                '0.75rem',
                                                                            height: '24px',
                                                                            fontFamily:
                                                                                "'Inter', sans-serif",
                                                                        }}
                                                                    />
                                                                )}
                                                        </Box>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: {
                                                                    xs: 1.5,
                                                                    sm: 2,
                                                                },
                                                                mt: 2,
                                                                pt: 2,
                                                                borderTop:
                                                                    '1px solid',
                                                                borderColor:
                                                                    'divider',
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        'flex',
                                                                    alignItems:
                                                                        'center',
                                                                    gap: 0.5,
                                                                }}
                                                            >
                                                                <RestaurantIcon
                                                                    sx={{
                                                                        fontSize:
                                                                            {
                                                                                xs: '1rem',
                                                                                sm: '1.25rem',
                                                                            },
                                                                        color: 'primary.main',
                                                                    }}
                                                                />
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{
                                                                        fontSize:
                                                                            {
                                                                                xs: '0.75rem',
                                                                                sm: '0.875rem',
                                                                            },
                                                                        fontFamily:
                                                                            "'Inter', sans-serif",
                                                                    }}
                                                                >
                                                                    {
                                                                        recipe.servings
                                                                    }{' '}
                                                                    servings
                                                                </Typography>
                                                            </Box>
                                                            {recipe.time_estimate && (
                                                                <Box
                                                                    sx={{
                                                                        display:
                                                                            'flex',
                                                                        alignItems:
                                                                            'center',
                                                                        gap: 0.5,
                                                                    }}
                                                                >
                                                                    <AccessTimeIcon
                                                                        sx={{
                                                                            fontSize:
                                                                                {
                                                                                    xs: '1rem',
                                                                                    sm: '1.25rem',
                                                                                },
                                                                            color: 'primary.main',
                                                                        }}
                                                                    />
                                                                    <Typography
                                                                        variant="body2"
                                                                        color="text.secondary"
                                                                        sx={{
                                                                            fontSize:
                                                                                {
                                                                                    xs: '0.75rem',
                                                                                    sm: '0.875rem',
                                                                                },
                                                                            fontFamily:
                                                                                "'Inter', sans-serif",
                                                                        }}
                                                                    >
                                                                        {formatTimeDisplay(
                                                                            recipe
                                                                                .time_estimate
                                                                                .total
                                                                        )}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Fade>
                        ) : (
                            <Fade in={!initialLoading} timeout={300}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '300px',
                                        width: '100%',
                                        p: 3,
                                    }}
                                >
                                    <EmptyRecipeBook
                                        sx={{
                                            width: '120px',
                                            height: '120px',
                                            color: 'text.secondary',
                                            opacity: 0.5,
                                            mb: 2,
                                        }}
                                    />
                                    {searchQuery ? (
                                        <>
                                            <Typography
                                                variant="h6"
                                                align="center"
                                                gutterBottom
                                            >
                                                No recipes found
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                align="center"
                                                color="text.secondary"
                                            >
                                                Try adjusting your search query
                                                or adding new recipes.
                                            </Typography>
                                        </>
                                    ) : (
                                        <>
                                            <Typography
                                                variant="h6"
                                                align="center"
                                                gutterBottom
                                            >
                                                Your recipe book is empty
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                align="center"
                                                color="text.secondary"
                                            >
                                                Start adding recipes by clicking
                                                the + button in the top right.
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            </Fade>
                        )}

                        {/* Loading indicator for infinite scroll */}
                        {loadingMore && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    width: '100%',
                                    p: 3,
                                }}
                            >
                                <CircularProgress size={24} color="primary" />
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </AppLayout>
    );
};

export default CatalogPage;
