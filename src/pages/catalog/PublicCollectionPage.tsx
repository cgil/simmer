/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import SearchBar from '../../components/search-bar/SearchBar';
import { useDebounce } from '../../hooks';
import RecipeGrid from '../../features/catalog/components/RecipeGrid';
import { MatchType } from '../../components/recipe/MatchCornerFold';
import { Recipe } from '../../types/recipe';
import { supabase } from '../../lib/supabase';
import { RecipeService } from '../../services/RecipeService';
import { useAuth } from '../../context/AuthContext';

/**
 * Determines the highest priority match type for a recipe (title > tag > ingredient)
 */
const determineMatchType = (recipe: Recipe, searchQuery: string): MatchType => {
    if (!searchQuery.trim()) return null;

    const normalizedSearch = searchQuery.toLowerCase().trim();

    // Title match
    if (recipe.title && recipe.title.toLowerCase().includes(normalizedSearch)) {
        return 'title';
    }

    // Tag match
    if (recipe.tags && Array.isArray(recipe.tags)) {
        const hasTagMatch = recipe.tags.some(
            (tag) =>
                typeof tag === 'string' &&
                tag.toLowerCase().includes(normalizedSearch)
        );
        if (hasTagMatch) return 'tag';
    }

    // Ingredient match
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

/**
 * A read-only page that displays a public collection and its public recipes to unauthenticated users.
 */

const PublicCollectionPage: FC = () => {
    const { collectionId } = useParams<{ collectionId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Collection details
    const [collectionName, setCollectionName] = useState<string>('');
    const [collectionEmoji, setCollectionEmoji] = useState<string>('📚');

    // Recipes state
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    // For RecipeGrid pagination (reuse logic from CatalogPage but simpler)
    const RECIPES_PER_PAGE = 12;
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastRecipeElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (loadingMore) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMoreRecipes();
                }
            });

            if (node) observer.current.observe(node);
        },
        [loadingMore, hasMore]
    );

    // Initial load
    useEffect(() => {
        if (!collectionId) {
            setError('Collection not found');
            setInitialLoading(false);
            return;
        }

        const fetchCollectionAndRecipes = async () => {
            setInitialLoading(true);
            try {
                // 1. Fetch collection details (only if public)
                const { data: collectionData, error: collectionError } =
                    await supabase
                        .from('collections')
                        .select('name, emoji')
                        .eq('id', collectionId)
                        .eq('is_public', true)
                        .maybeSingle();

                if (collectionError || !collectionData) {
                    setError('Collection not found or is not public');
                    return;
                }

                setCollectionName(collectionData.name);
                setCollectionEmoji(collectionData.emoji || '📚');

                // 2. Fetch recipes in this collection (by position)
                const { data: positionData, error: posError } = await supabase
                    .from('recipe_collections')
                    .select('recipe_id, position')
                    .eq('collection_id', collectionId)
                    .order('position');

                if (posError) {
                    throw posError;
                }

                if (!positionData || positionData.length === 0) {
                    setRecipes([]);
                    return;
                }

                const recipeIds = positionData.map((p) => p.recipe_id);
                const positionMap: Record<string, number> = {};
                positionData.forEach((p) => {
                    positionMap[p.recipe_id] = p.position;
                });

                // Fetch recipes (public ones only)
                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select(
                        `*,
                        recipe_images (id, url, position),
                        recipe_ingredients (id, name, quantity, unit, notes, position),
                        recipe_instruction_sections (
                            id, section_title, position,
                            recipe_instruction_steps (id, text, timing_min, timing_max, timing_units, position)
                        )`
                    )
                    .in('id', recipeIds)
                    .eq('is_public', true);

                if (recipeError) {
                    throw recipeError;
                }

                const mappedRecipes: Recipe[] = (recipeData || []).map(
                    (r: any) =>
                        // Using mapDbRecipeToRecipe which requires complex DB type
                        RecipeService.mapDbRecipeToRecipe(r as any)
                );

                // Sort by position order
                mappedRecipes.sort((a, b) => {
                    const posA = a.id ? positionMap[a.id] || 0 : 0;
                    const posB = b.id ? positionMap[b.id] || 0 : 0;
                    return posA - posB;
                });

                setRecipes(mappedRecipes);
                setHasMore(mappedRecipes.length > RECIPES_PER_PAGE);
            } catch (err) {
                console.error('Error loading public collection:', err);
                setError('Failed to load collection.');
            } finally {
                setInitialLoading(false);
            }
        };

        fetchCollectionAndRecipes();
    }, [collectionId]);

    // Perform client-side search whenever debouncedSearch changes
    useEffect(() => {
        if (!debouncedSearch) {
            setPage(1);
            setHasMore(recipes.length > RECIPES_PER_PAGE);
            return;
        }

        setSearchLoading(true);
        const normalizedSearch = debouncedSearch.toLowerCase().trim();
        const filtered = recipes.filter(
            (recipe) =>
                recipe.title.toLowerCase().includes(normalizedSearch) ||
                (recipe.tags &&
                    recipe.tags.some((tag) =>
                        tag.toLowerCase().includes(normalizedSearch)
                    )) ||
                (recipe.ingredients &&
                    recipe.ingredients.some((ing) =>
                        ing.name.toLowerCase().includes(normalizedSearch)
                    ))
        );

        setRecipes(filtered);
        setPage(1);
        setHasMore(filtered.length > RECIPES_PER_PAGE);
        setSearchLoading(false);
    }, [debouncedSearch]);

    // Load more recipes for infinite scroll (client-side slicing)
    const loadMoreRecipes = () => {
        if (loadingMore) return;
        setLoadingMore(true);
        setTimeout(() => {
            setPage((prev) => prev + 1);
            setHasMore(recipes.length > (page + 1) * RECIPES_PER_PAGE);
            setLoadingMore(false);
        }, 300);
    };

    // Paginated visible recipes
    const visibleRecipes = recipes.slice(0, page * RECIPES_PER_PAGE);

    // Handle recipe click -> open recipe page (which already supports public access)
    const handleRecipeClick = (recipe: Recipe) => {
        if (!recipe.id) return;
        navigate(`/recipe/${recipe.id}`, {
            state: {
                returnTo: `/collection/${collectionId}`,
            },
        });
    };

    return (
        <AppLayout
            showAddButton={false}
            hasDrawer={false}
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
                        {collectionEmoji}
                    </Box>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: 'primary.main',
                            fontFamily: "'Kalam', cursive",
                            letterSpacing: '-0.5px',
                        }}
                    >
                        {collectionName || 'Collection'}
                    </Typography>
                </Box>
            }
            actionButton={
                user ? (
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/collection/all')}
                        sx={{
                            height: { xs: 34, sm: 40 },
                            borderColor: 'divider',
                            color: 'text.primary',
                            textTransform: 'none',
                            fontSize: { xs: '0.825rem', sm: '0.9rem' },
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'rgba(44, 62, 80, 0.04)',
                            },
                        }}
                    >
                        My Recipes
                    </Button>
                ) : null
            }
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    width: '100%',
                    minWidth: 0,
                    px: { xs: 2, sm: 3, md: 4 },
                    py: { xs: 3, sm: 4 },
                    bgcolor: 'paper.light',
                    position: 'relative',
                    overflow: 'hidden',
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
                        backgroundImage:
                            'radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.05) 0.5px, transparent 0.5px), radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.03) 1px, transparent 1px)',
                        backgroundSize: '6px 6px, 14px 14px',
                        backgroundPosition: '0 0',
                        mixBlendMode: 'multiply',
                        filter: 'opacity(1)',
                    },
                }}
            >
                {/* SearchBar */}
                <SearchBar
                    value={searchQuery}
                    onChange={(value) => setSearchQuery(value)}
                    placeholder={`Search in "${collectionName}"...`}
                    resultsCount={recipes.length}
                    isSearching={searchLoading}
                />

                {/* Recipe Grid */}
                <Box sx={{ flex: 1 }}>
                    <RecipeGrid
                        visibleRecipes={visibleRecipes}
                        initialLoading={initialLoading}
                        searchLoading={searchLoading}
                        loadingMore={loadingMore}
                        error={error}
                        searchQuery={searchQuery}
                        selectedCollection={collectionId || 'public'}
                        lastRecipeElementRef={lastRecipeElementRef}
                        handleRecipeClick={handleRecipeClick}
                        determineMatchType={determineMatchType}
                    />
                </Box>
            </Box>
        </AppLayout>
    );
};

export default PublicCollectionPage;
