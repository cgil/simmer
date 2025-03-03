import { FC, useState, useEffect, useRef, useCallback } from 'react';
import {
    Grid,
    Typography,
    Box,
    Paper,
    Chip,
    CircularProgress,
} from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import { Card, CardMedia, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import { formatTimeDisplay } from '../../utils/time';
import { useAuth } from '../../context/AuthContext';
import { RecipeService } from '../../services/RecipeService';
import { Recipe } from '../../types/recipe';
import EmptyRecipeBook from '../../components/icons/EmptyRecipeBook';

const CatalogPage: FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const RECIPES_PER_PAGE = 10;
    const observer = useRef<IntersectionObserver | null>(null);
    const lastRecipeElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (loading || loadingMore) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMoreRecipes();
                }
            });

            if (node) observer.current.observe(node);
        },
        [loading, loadingMore, hasMore]
    );

    // Load initial recipes
    useEffect(() => {
        loadRecipes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Filter recipes when search query changes
    useEffect(() => {
        filterRecipes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, recipes]);

    const loadRecipes = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const fetchedRecipes = await RecipeService.getRecipes(user.id);
            setRecipes(fetchedRecipes);
            setFilteredRecipes(fetchedRecipes);
            setHasMore(false); // We load all recipes at once since we need to search across all recipes
            setPage(1);
        } catch (err) {
            console.error('Error loading recipes:', err);
            setError('Failed to load recipes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadMoreRecipes = async () => {
        if (!user || loadingMore || !hasMore) return;

        setLoadingMore(true);

        try {
            const nextPage = page + 1;
            const start = page * RECIPES_PER_PAGE;
            const end = start + RECIPES_PER_PAGE;

            // Note: Since we're actually fetching all recipes at once for searching purposes,
            // this is just simulating pagination for the UI
            const nextRecipes = recipes.slice(start, end);

            if (nextRecipes.length === 0) {
                setHasMore(false);
            } else {
                setFilteredRecipes((prevRecipes) => [
                    ...prevRecipes,
                    ...nextRecipes,
                ]);
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

    const filterRecipes = () => {
        if (!searchQuery.trim()) {
            setFilteredRecipes(recipes);
            return;
        }

        const filtered = recipes.filter(
            (recipe) =>
                recipe.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                (recipe.tags &&
                    recipe.tags.some((tag: string) =>
                        tag.toLowerCase().includes(searchQuery.toLowerCase())
                    )) ||
                (recipe.ingredients &&
                    recipe.ingredients.some((item) =>
                        item.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                    ))
        );

        setFilteredRecipes(filtered);
    };

    return (
        <AppLayout showAddButton>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    minWidth: '100%',
                    px: { xs: 2, sm: 3, md: 4 },
                    py: { xs: 3, sm: 4 },
                    flex: 1,
                    bgcolor: 'paper.light',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        boxShadow: 'inset 0 0 50px rgba(62, 28, 0, 0.08)',
                        pointerEvents: 'none',
                    },
                    overflow: 'hidden',
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 1, sm: 2 },
                        mb: { xs: 3, sm: 4 },
                        borderRadius: 1,
                        boxShadow: `
                            0 1px 2px rgba(0,0,0,0.05),
                            0 3px 6px rgba(0,0,0,0.02),
                            0 1px 8px rgba(0,0,0,0.02)
                        `,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        width: '100%',
                        position: 'relative',
                        bgcolor: 'background.paper',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100%',
                            background: 'rgba(255,255,255,0.6)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: 1,
                            zIndex: 0,
                        },
                        '& > *': {
                            position: 'relative',
                            zIndex: 1,
                        },
                    }}
                >
                    <SearchIcon
                        sx={{
                            ml: { xs: 1, sm: 1.5 },
                            fontSize: { xs: 20, sm: 22 },
                            color: searchQuery
                                ? 'primary.main'
                                : 'text.secondary',
                        }}
                    />
                    <InputBase
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search recipes by name, tags, or ingredients..."
                        fullWidth
                        sx={{
                            flex: 1,
                            '& input': {
                                py: { xs: 1, sm: 1.25 },
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                fontFamily: "'Inter', sans-serif",
                                '&::placeholder': {
                                    color: 'text.secondary',
                                    opacity: 0.8,
                                },
                            },
                        }}
                    />
                    {searchQuery && (
                        <Typography
                            variant="body2"
                            sx={{
                                px: { xs: 1.5, sm: 2 },
                                py: '2px',
                                bgcolor: 'secondary.light',
                                borderRadius: 1,
                                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                color: 'text.primary',
                                fontFamily: "'Inter', sans-serif",
                                userSelect: 'none',
                            }}
                        >
                            {filteredRecipes.length}{' '}
                            {filteredRecipes.length === 1
                                ? 'recipe'
                                : 'recipes'}
                        </Typography>
                    )}
                </Paper>

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
                    {loading ? (
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
                                Try refreshing the page or check your internet
                                connection.
                            </Typography>
                        </Box>
                    ) : filteredRecipes.length > 0 ? (
                        <Grid
                            container
                            spacing={{ xs: 2, sm: 3 }}
                            columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
                        >
                            {filteredRecipes.map((recipe, index) => {
                                const imageUrl =
                                    recipe.images && recipe.images.length > 0
                                        ? recipe.images[0]
                                        : '/placeholder-recipe.jpg';

                                // Check if this is the last recipe element for infinite scroll
                                const isLastElement =
                                    index === filteredRecipes.length - 1;

                                return (
                                    <Grid
                                        item
                                        xs={1}
                                        key={recipe.id || `recipe-${index}`}
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
                                                    { state: { recipe } }
                                                )
                                            }
                                            sx={{
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
                                                bgcolor: 'background.paper',
                                                position: 'relative',
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: '100%',
                                                    background:
                                                        'rgba(255,255,255,0.5)',
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
                                                    transform:
                                                        'translateY(-2px)',
                                                    boxShadow:
                                                        '0 4px 12px rgba(0,0,0,0.06)',
                                                    borderColor:
                                                        'rgba(44, 62, 80, 0.15)',
                                                },
                                            }}
                                        >
                                            <CardMedia
                                                component="img"
                                                height="180"
                                                image={imageUrl}
                                                alt={recipe.title}
                                                sx={{
                                                    objectFit: 'cover',
                                                }}
                                            />
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
                                                        textOverflow:
                                                            'ellipsis',
                                                        display: '-webkit-box',
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
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                            'ellipsis',
                                                        display: '-webkit-box',
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
                                                        flexWrap: 'wrap',
                                                        mb: 1,
                                                        mt: 'auto',
                                                    }}
                                                >
                                                    {recipe.tags
                                                        .slice(0, 3)
                                                        .map((tag) => (
                                                            <Chip
                                                                key={tag}
                                                                label={tag}
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
                                                        ))}
                                                    {recipe.tags.length > 3 && (
                                                        <Chip
                                                            label={`+${
                                                                recipe.tags
                                                                    .length - 3
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
                                                        alignItems: 'center',
                                                        gap: { xs: 1.5, sm: 2 },
                                                        mt: 2,
                                                        pt: 2,
                                                        borderTop: '1px solid',
                                                        borderColor: 'divider',
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
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
                                                                fontFamily:
                                                                    "'Inter', sans-serif",
                                                            }}
                                                        >
                                                            {recipe.servings}{' '}
                                                            servings
                                                        </Typography>
                                                    </Box>
                                                    {recipe.time_estimate && (
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
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
                    ) : (
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
                                        Try adjusting your search query or
                                        adding new recipes.
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
                                        Start adding recipes by clicking the +
                                        button in the top right.
                                    </Typography>
                                </>
                            )}
                        </Box>
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
        </AppLayout>
    );
};

export default CatalogPage;
