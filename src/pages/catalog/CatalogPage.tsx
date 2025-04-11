import { FC, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
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
import { useNavigate } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatTimeDisplay } from '../../utils/time';
import { useAuth } from '../../context/AuthContext';
import { RecipeService } from '../../services/RecipeService';
import { Recipe } from '../../types/recipe';
import EmptyRecipeBook from '../../components/icons/EmptyRecipeBook';
import RecipeImagePlaceholder from '../../components/recipe/RecipeImagePlaceholder';
import SearchBar from '../../components/search-bar/SearchBar';
import { useDebounce } from '../../hooks';
import MatchCornerFold, {
    MatchType,
} from '../../components/recipe/MatchCornerFold';
import CollectionsDrawer from '../../components/collections/CollectionsDrawer';
// Import icons for collection headers
import BookmarksRoundedIcon from '@mui/icons-material/BookmarksRounded';
import CakeRoundedIcon from '@mui/icons-material/CakeRounded';
import RamenDiningRoundedIcon from '@mui/icons-material/RamenDiningRounded';
import LocalPizzaRoundedIcon from '@mui/icons-material/LocalPizzaRounded';
import LocalBarRoundedIcon from '@mui/icons-material/LocalBarRounded';
import CollectionsBookmarkRoundedIcon from '@mui/icons-material/CollectionsBookmarkRounded';

// Define the collection item interface
interface CollectionItem {
    id: string;
    name: string;
    count: number;
    icon: ReactNode;
}

// Define collections in one central place
const APP_COLLECTIONS: CollectionItem[] = [
    {
        id: 'all',
        name: 'All Recipes',
        count: 42,
        icon: <BookmarksRoundedIcon />,
    },
    { id: 'desserts', name: 'Desserts', count: 12, icon: <CakeRoundedIcon /> },
    {
        id: 'asian',
        name: 'Asian Cuisine',
        count: 8,
        icon: <RamenDiningRoundedIcon />,
    },
    {
        id: 'italian',
        name: 'Italian',
        count: 10,
        icon: <LocalPizzaRoundedIcon />,
    },
    { id: 'drinks', name: 'Drinks', count: 5, icon: <LocalBarRoundedIcon /> },
    {
        id: 'empty',
        name: 'Empty Collection',
        count: 0,
        icon: <CollectionsBookmarkRoundedIcon />,
    },
    // Add additional collections as needed
    {
        id: 'asian-1',
        name: 'Asian Cuisine',
        count: 8,
        icon: <RamenDiningRoundedIcon />,
    },
    {
        id: 'italian-1',
        name: 'Italian',
        count: 10,
        icon: <LocalPizzaRoundedIcon />,
    },
    {
        id: 'drinks-1',
        name: 'Drinks',
        count: 5,
        icon: <LocalBarRoundedIcon />,
    },
    {
        id: 'empty-1',
        name: 'Empty Collection',
        count: 0,
        icon: <CollectionsBookmarkRoundedIcon />,
    },
    {
        id: 'asian-2',
        name: 'Asian Cuisine',
        count: 8,
        icon: <RamenDiningRoundedIcon />,
    },
    {
        id: 'italian-2',
        name: 'Italian',
        count: 10,
        icon: <LocalPizzaRoundedIcon />,
    },
    {
        id: 'drinks-4',
        name: 'Drinks',
        count: 5,
        icon: <LocalBarRoundedIcon />,
    },
    {
        id: 'empty-2',
        name: 'Empty Collection',
        count: 0,
        icon: <CollectionsBookmarkRoundedIcon />,
    },
    {
        id: 'desserts-2',
        name: 'Desserts',
        count: 12,
        icon: <CakeRoundedIcon />,
    },
    {
        id: 'asian-3',
        name: 'Asian Cuisine',
        count: 8,
        icon: <RamenDiningRoundedIcon />,
    },
    {
        id: 'italian-3',
        name: 'Italian',
        count: 10,
        icon: <LocalPizzaRoundedIcon />,
    },
    {
        id: 'drinks-3',
        name: 'Drinks',
        count: 5,
        icon: <LocalBarRoundedIcon />,
    },
    {
        id: 'empty-3',
        name: 'Empty Collection',
        count: 0,
        icon: <CollectionsBookmarkRoundedIcon />,
    },
];

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
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [initialLoading, setInitialLoading] = useState(true); // Initial loading state
    const [searchLoading, setSearchLoading] = useState(false); // Search-specific loading state
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const RECIPES_PER_PAGE = 10;
    const initialLoadCompleted = useRef(false);
    const [selectedCollection, setSelectedCollection] = useState('all');
    const [drawerOpen, setDrawerOpen] = useState(true);

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

    // Handle initial load of recipes
    useEffect(() => {
        if (user && !initialLoadCompleted.current) {
            loadInitialRecipes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

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

    // Initial load of recipes
    const loadInitialRecipes = async () => {
        if (!user) return;

        setInitialLoading(true);
        setError(null);

        try {
            const fetchedRecipes = await RecipeService.searchRecipes(
                user.id,
                '' // Empty search to get all recipes initially
            );

            setRecipes(fetchedRecipes);

            // Update pagination
            setHasMore(fetchedRecipes.length > RECIPES_PER_PAGE);
            setPage(1);
            initialLoadCompleted.current = true;
        } catch (err) {
            console.error('Error loading recipes:', err);
            setError('Failed to load recipes. Please try again.');
        } finally {
            setInitialLoading(false);
        }
    };

    // Perform search without resetting the UI
    const performSearch = async () => {
        if (!user) return;

        setSearchLoading(true);
        setError(null);

        try {
            const fetchedRecipes = await RecipeService.searchRecipes(
                user.id,
                debouncedSearchQuery
            );

            setRecipes(fetchedRecipes);

            // Update pagination
            setHasMore(fetchedRecipes.length > RECIPES_PER_PAGE);
            setPage(1);
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

    // Handle collection selection
    const handleCollectionSelect = (collectionId: string) => {
        setSelectedCollection(collectionId);
        // In the future, this would filter recipes based on the selected collection
    };

    // Handle drawer state change
    const handleDrawerStateChange = (isOpen: boolean) => {
        setDrawerOpen(isOpen);
    };

    // Helper function to find the currently selected collection
    const getSelectedCollection = () => {
        return (
            APP_COLLECTIONS.find((c) => c.id === selectedCollection) ||
            APP_COLLECTIONS[0]
        );
    };

    return (
        <AppLayout
            showAddButton
            hasDrawer={true}
            drawerWidth={drawerWidth}
            collapsedDrawerWidth={collapsedDrawerWidth}
            isDrawerOpen={drawerOpen}
            headerContent={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'primary.main',
                        }}
                    >
                        {getSelectedCollection().icon}
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
                }}
            >
                <CollectionsDrawer
                    selectedCollection={selectedCollection}
                    onCollectionSelect={handleCollectionSelect}
                    width={drawerWidth}
                    collapsedWidth={collapsedDrawerWidth}
                    onDrawerStateChange={handleDrawerStateChange}
                    collections={APP_COLLECTIONS}
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
                        marginLeft: drawerOpen
                            ? `${drawerWidth}px`
                            : `${collapsedDrawerWidth}px`,
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
                        placeholder="Search recipes by name, tags, or ingredients..."
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
                                                        navigate(
                                                            `/recipe/${recipe.id}`,
                                                            {
                                                                state: {
                                                                    recipe,
                                                                },
                                                            }
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
                                                        <RecipeImagePlaceholder
                                                            height={180}
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
