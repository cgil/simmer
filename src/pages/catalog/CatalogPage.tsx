import { FC, useState, useEffect, useRef, useCallback } from 'react';
import {
    Grid,
    Typography,
    Box,
    Chip,
    CircularProgress,
    Fade,
    useTheme,
    Card,
    CardMedia,
    CardContent,
    Theme, // Import Theme type
} from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
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
// Import DnD hooks and types
import { useDrag, useDrop } from 'react-dnd';
import { ItemTypes, RecipeDragItem } from '../../types/dnd'; // Import the type definition

// Import from collection.ts including the new constant
import {
    CollectionItem,
    ALL_RECIPES_ID,
    COLLECTION_ROUTE_PATH,
} from '../../types/collection';

// --- Internal Draggable Recipe Card Component ---
interface DraggableRecipeCardProps {
    recipe: Recipe;
    isLastElement: boolean;
    lastRecipeElementRef: (node: HTMLDivElement | null) => void;
    handleRecipeClick: (recipe: Recipe) => void;
    determineMatchType: (recipe: Recipe, searchQuery: string) => MatchType;
    searchQuery: string;
    selectedCollection: string;
    theme: Theme; // Pass theme explicitly
    recipePosition?: number; // Add position prop
    onRecipeReorder?: (
        draggedId: string,
        targetId: string,
        newPosition: number
    ) => void; // Add reordering handler
    isFirstItem?: boolean; // Add prop to identify if this is the first item
    isLastItem?: boolean; // Add prop to identify if this is the last item
}

const DraggableRecipeCard: FC<DraggableRecipeCardProps> = ({
    recipe,
    isLastElement,
    lastRecipeElementRef,
    handleRecipeClick,
    determineMatchType,
    searchQuery,
    selectedCollection,
    theme,
    recipePosition,
    onRecipeReorder,
    isFirstItem = false,
    isLastItem = false,
}) => {
    // Determine match type if search is active
    const matchType = searchQuery
        ? determineMatchType(recipe, searchQuery)
        : null;

    // State to track mouse position for determining left/right drop position
    const [dropPosition, setDropPosition] = useState<'left' | 'right' | null>(
        null
    );

    // Reference for the drag source
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.RECIPE_CARD,
        item: {
            type: ItemTypes.RECIPE_CARD,
            recipeId: recipe.id,
            sourceCollectionId: selectedCollection,
            currentPosition: recipePosition,
            isReordering: selectedCollection !== ALL_RECIPES_ID,
        } as RecipeDragItem,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    // Reference for drop target (to enable reordering within same collection)
    const [{ isOver, canDrop }, drop] = useDrop(
        () => ({
            accept: ItemTypes.RECIPE_CARD,
            canDrop: (item: RecipeDragItem) => {
                return (
                    item.sourceCollectionId === selectedCollection &&
                    selectedCollection !== ALL_RECIPES_ID &&
                    item.recipeId !== recipe.id
                );
            },
            hover: (_item: RecipeDragItem, monitor) => {
                // Get current mouse position
                const clientOffset = monitor.getClientOffset();
                if (!clientOffset) return;

                // Set left/right based on which half of the screen we're in
                const screenMiddleX = window.innerWidth / 2;
                const newPosition =
                    clientOffset.x < screenMiddleX ? 'left' : 'right';
                setDropPosition(newPosition);
            },
            drop: (item: RecipeDragItem) => {
                // Reset drop position after drop
                const position = dropPosition;
                setDropPosition(null);

                // Skip if we don't have the required data
                if (
                    !onRecipeReorder ||
                    !item.recipeId ||
                    item.sourceCollectionId !== selectedCollection ||
                    selectedCollection === ALL_RECIPES_ID ||
                    recipePosition === undefined
                ) {
                    return;
                }

                // All checks passed, item.recipeId and recipe.id are both defined strings
                const safeRecipeId = item.recipeId as string;
                const safeTargetId = recipe.id as string;

                // Special handling for first and last positions
                if (position === 'left' && isFirstItem) {
                    // When dropping at the left of the first item, use a position before this item
                    onRecipeReorder(
                        safeRecipeId,
                        safeTargetId,
                        recipePosition - 1000
                    );
                } else if (position === 'right' && isLastItem) {
                    // When dropping at the right of the last item, use a position after this item
                    onRecipeReorder(
                        safeRecipeId,
                        safeTargetId,
                        recipePosition + 1000
                    );
                } else {
                    // Normal case - use the current recipe's position
                    onRecipeReorder(safeRecipeId, safeTargetId, recipePosition);
                }
            },
            collect: (monitor) => ({
                isOver: !!monitor.isOver(),
                canDrop: !!monitor.canDrop(),
            }),
        }),
        [
            selectedCollection,
            recipe.id,
            recipePosition,
            onRecipeReorder,
            isLastItem,
        ]
    );

    // Combine drag and drop refs using React DnD's method
    const dragDropRef = useCallback(
        (node: HTMLDivElement | null) => {
            // Apply the drag and drop refs
            drag(node);
            drop(node);

            // Apply the last element ref if needed
            if (isLastElement && node) {
                lastRecipeElementRef(node);
            }
        },
        [drag, drop, isLastElement, lastRecipeElementRef]
    );

    // Reset drop position when no longer over the component
    useEffect(() => {
        if (!isOver) {
            setDropPosition(null);
        }
    }, [isOver]);

    return (
        <Grid
            item
            xs={1}
            key={recipe.id}
            ref={dragDropRef}
            sx={{
                opacity: isDragging ? 0.5 : 1,
                cursor: 'move',
                transition: theme.transitions.create('opacity', {
                    duration: theme.transitions.duration.short,
                }),
                position: 'relative',
                // Left highlight
                ...(canDrop && isOver && dropPosition === 'left'
                    ? {
                          '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: '10%',
                              left: 10,
                              width: 2,
                              height: '80%',
                              backgroundColor: theme.palette.primary.light,
                              borderRadius: 4,
                              zIndex: 10,
                              opacity: 0.5,
                          },
                      }
                    : {}),
                // Right highlight
                ...(canDrop && isOver && dropPosition === 'right'
                    ? {
                          '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: '10%',
                              right: -12,
                              width: 2,
                              height: '80%',
                              backgroundColor: theme.palette.primary.light,
                              borderRadius: 4,
                              zIndex: 10,
                              opacity: 0.5,
                          },
                      }
                    : {}),
                // Special case for first item - left edge
                ...(canDrop && isOver && dropPosition === 'left' && isFirstItem
                    ? {
                          '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: '10%',
                              left: 10,
                              width: 2,
                              height: '80%',
                              backgroundColor: theme.palette.primary.light,
                              borderRadius: 4,
                              zIndex: 10,
                              opacity: 0.5,
                          },
                      }
                    : {}),
                // Special case for last item - right edge
                ...(canDrop && isOver && dropPosition === 'right' && isLastItem
                    ? {
                          '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: '10%',
                              right: -10,
                              width: 2,
                              height: '80%',
                              backgroundColor: theme.palette.primary.light,
                              borderRadius: 4,
                              zIndex: 10,
                              opacity: 0.5,
                          },
                      }
                    : {}),
            }}
        >
            <div // Non-draggable container for the last element ref
                ref={isLastElement ? lastRecipeElementRef : null}
                style={{ height: '100%' }} // Ensure div takes full height for Card
            >
                <Card
                    onClick={() => handleRecipeClick(recipe)}
                    sx={{
                        position: 'relative',
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
                        transition: 'all 0.15s ease-in-out',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100%',
                            background: 'rgba(255,255,255,0.5)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: 1,
                            zIndex: 0,
                            border: '1px solid',
                            borderColor: 'divider',
                        },
                        '& > *': {
                            position: 'relative',
                            zIndex: 1,
                        },
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            borderColor: 'rgba(44, 62, 80, 0.15)',
                        },
                        // Apply subtle elevation when being targeted
                        ...(canDrop && isOver
                            ? {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.09)',
                                  transition: 'all 0.2s ease-out',
                              }
                            : {}),
                    }}
                >
                    {/* Match Corner Fold - only appears during search */}
                    {searchQuery && <MatchCornerFold matchType={matchType} />}

                    {recipe.images && recipe.images.length > 0 ? (
                        <CardMedia
                            component="img"
                            height="180"
                            image={recipe.images[0]}
                            alt={recipe.title}
                            sx={{
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <Box
                            sx={{
                                height: 180,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                                position: 'relative',
                                overflow: 'hidden',
                                padding: 2,
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
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
                                        recipe.title.length > 20
                                            ? recipe.title.substring(0, 20) +
                                              '...'
                                            : recipe.title
                                    }"`,
                                    position: 'absolute',
                                    fontFamily: "'Kalam', cursive",
                                    fontSize: '1.75rem',
                                    color: theme.palette.primary.main,
                                    opacity: 0.15,
                                    transform: 'rotate(-5deg)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    textAlign: 'center',
                                    width: '100%',
                                    maxWidth: '90%',
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
                            flexDirection: 'column',
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
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                fontFamily: "'Kalam', cursive",
                                color: 'primary.main',
                            }}
                        >
                            {recipe.title}
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{
                                mb: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                fontSize: {
                                    xs: '0.875rem',
                                    sm: '1rem',
                                },
                                minHeight: {
                                    xs: '40px',
                                    sm: '48px',
                                },
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {recipe.description}
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 0.75,
                                flexWrap: 'wrap',
                                mb: 1,
                                mt: 'auto',
                            }}
                        >
                            {recipe.tags &&
                                recipe.tags.length > 0 &&
                                recipe.tags.slice(0, 3).map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        size="small"
                                        color="secondary"
                                        sx={{
                                            fontSize: '0.75rem',
                                            height: '24px',
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    />
                                ))}
                            {recipe.tags && recipe.tags.length > 3 && (
                                <Chip
                                    label={`+${recipe.tags.length - 3}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        fontSize: '0.75rem',
                                        height: '24px',
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                />
                            )}
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: {
                                    xs: 1.5,
                                    sm: 2,
                                },
                                mt: 2,
                                pt: 2,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                }}
                            >
                                <RestaurantIcon
                                    sx={{
                                        fontSize: {
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
                                        fontSize: {
                                            xs: '0.75rem',
                                            sm: '0.875rem',
                                        },
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    {recipe.servings} servings
                                </Typography>
                            </Box>
                            {recipe.time_estimate && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                    }}
                                >
                                    <AccessTimeIcon
                                        sx={{
                                            fontSize: {
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
                                            fontSize: {
                                                xs: '0.75rem',
                                                sm: '0.875rem',
                                            },
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        {formatTimeDisplay(
                                            recipe.time_estimate.total
                                        )}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </div>
        </Grid>
    );
};

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
                    await RecipeService.addRecipeToCollection(
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
                    await RecipeService.removeRecipeFromCollection(
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
                    await RecipeService.getRecipePositionsInCollection(
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
                await RecipeService.updateRecipePositionInCollection(
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

                                        return (
                                            <DraggableRecipeCard
                                                key={
                                                    recipe.id ||
                                                    `recipe-${index}`
                                                }
                                                recipe={recipe}
                                                isLastElement={isLastElement}
                                                lastRecipeElementRef={
                                                    lastRecipeElementRef
                                                }
                                                handleRecipeClick={
                                                    handleRecipeClick
                                                }
                                                determineMatchType={
                                                    determineMatchType
                                                }
                                                searchQuery={searchQuery}
                                                selectedCollection={
                                                    selectedCollection
                                                }
                                                theme={theme} // Pass theme
                                                recipePosition={index * 1000} // Use index * 1000 for spacing
                                                onRecipeReorder={
                                                    selectedCollection !==
                                                    ALL_RECIPES_ID
                                                        ? handleRecipeReordering
                                                        : undefined
                                                }
                                                isFirstItem={index === 0}
                                                isLastItem={
                                                    index === recipes.length - 1
                                                }
                                            />
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
