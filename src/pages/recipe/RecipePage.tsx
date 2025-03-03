import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Chip,
    Button,
    useTheme,
    useMediaQuery,
    Paper,
    CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AppLayout from '../../components/layout/AppLayout';
import IngredientsList from './components/IngredientsList';
import CookingInstructions from './components/CookingInstructions';
import RecipeGallery from './components/RecipeGallery';
import RecipeNotes from './components/RecipeNotes';
import TimeEstimate from './components/TimeEstimate';
import { RecipeService } from '../../services/RecipeService';
import { useAuth } from '../../context/AuthContext';
import { Recipe } from '../../types/recipe';

const RecipePage: FC = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();

    // Check if recipe was passed through location state (from CatalogPage)
    const initialRecipe = location.state?.recipe as Recipe | undefined;

    const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe || null);
    const [loading, setLoading] = useState(!initialRecipe);
    const [error, setError] = useState<string | null>(null);
    const [servings, setServings] = useState<number>(
        initialRecipe?.servings || 2
    );

    // Fetch recipe if not provided in location state
    useEffect(() => {
        if (!id || !user || initialRecipe) return;

        const fetchRecipe = async () => {
            setLoading(true);
            setError(null);

            try {
                const fetchedRecipe = await RecipeService.getRecipeById(
                    id,
                    user.id
                );
                if (fetchedRecipe) {
                    setRecipe(fetchedRecipe);
                    setServings(fetchedRecipe.servings || 2);
                } else {
                    setError('Recipe not found');
                }
            } catch (err) {
                console.error('Error fetching recipe:', err);
                setError('Failed to load recipe. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [id, user, initialRecipe]);

    // When edit button is clicked, navigate to edit page with recipe data
    const handleEditClick = () => {
        if (recipe) {
            // Navigate to the edit page with the recipe data
            navigate('/recipe/edit', {
                state: {
                    recipe: recipe,
                    returnTo: `/recipe/${recipe.id}`,
                },
            });
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '50vh',
                    }}
                >
                    <CircularProgress />
                </Box>
            </AppLayout>
        );
    }

    if (error || !recipe) {
        return (
            <AppLayout>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography
                        variant="h5"
                        sx={{
                            fontFamily: "'Kalam', cursive",
                            color: 'primary.main',
                        }}
                    >
                        {error || 'Recipe not found'}
                    </Typography>
                    <Button
                        onClick={() => navigate('/')}
                        sx={{
                            mt: 2,
                            borderRadius: 1,
                            textTransform: 'none',
                            fontFamily: "'Inter', sans-serif",
                        }}
                        variant="contained"
                    >
                        Back to Recipes
                    </Button>
                </Box>
            </AppLayout>
        );
    }

    // Content for the header
    const headerContent = (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
            }}
        >
            <Box
                onClick={() => navigate('/')}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    color: 'text.primary',
                    '&:hover': {
                        color: 'primary.main',
                    },
                }}
            >
                <ArrowBackIcon sx={{ fontSize: 24 }} />
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 500,
                        fontSize: { xs: '1rem', sm: '1.125rem' },
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    Back
                </Typography>
            </Box>

            {/* Show edit button only for recipe owners and only in view mode */}
            {user && recipe && user.id === recipe.user_id && (
                <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEditClick}
                    sx={{
                        borderRadius: 1,
                        textTransform: 'none',
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    Edit Recipe
                </Button>
            )}
        </Box>
    );

    return (
        <AppLayout
            headerContent={headerContent}
            showCookingButton={true}
            onCookingClick={() =>
                navigate(`/recipe/${recipe.id}/cook`, { state: { servings } })
            }
        >
            <Box
                sx={{
                    position: 'relative',
                    bgcolor: '#FFFFFF',
                    minHeight: '100vh',
                    px: { xs: 2, sm: 3, md: 4 },
                    py: { xs: 3, sm: 4 },
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        boxShadow: 'inset 0 0 100px rgba(62, 28, 0, 0.03)',
                        pointerEvents: 'none',
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.3,
                        pointerEvents: 'none',
                        backgroundImage: `
                            linear-gradient(rgba(62, 28, 0, 0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(62, 28, 0, 0.03) 1px, transparent 1px),
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '24px 24px, 24px 24px, 12px 12px',
                        backgroundPosition: '-1px -1px, -1px -1px, -1px -1px',
                        mixBlendMode: 'multiply',
                    },
                }}
            >
                <Grid
                    container
                    spacing={4}
                    sx={{ position: 'relative', zIndex: 1 }}
                >
                    {/* Header Section */}
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                textAlign: 'center',
                                mb: 4,
                                mt: 4,
                                maxWidth: 800,
                                mx: 'auto',
                            }}
                        >
                            <Typography
                                variant={isMobile ? 'h4' : 'h3'}
                                component="h1"
                                gutterBottom
                                sx={{
                                    fontWeight: 700,
                                    color: 'primary.main',
                                    fontFamily: "'Kalam', cursive",
                                    mb: 2,
                                }}
                            >
                                {recipe.title}
                            </Typography>
                            <Typography
                                variant="subtitle1"
                                color="text.secondary"
                                sx={{
                                    mb: 3,
                                    fontSize: '1.1rem',
                                    maxWidth: '600px',
                                    mx: 'auto',
                                    lineHeight: 1.6,
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                {recipe.description}
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    mb: 3,
                                }}
                            >
                                {recipe.tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        color="secondary"
                                        size={isMobile ? 'small' : 'medium'}
                                        sx={{
                                            borderRadius: '16px',
                                            fontFamily: "'Inter', sans-serif",
                                            boxShadow:
                                                '0 4px 20px rgba(0,0,0,0.08)',
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Grid>

                    {/* Image Section */}
                    <Grid item xs={12}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 1,
                                overflow: 'hidden',
                                position: 'relative',
                                bgcolor: 'paper.main',
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
                            <RecipeGallery images={recipe.images} />
                        </Paper>
                    </Grid>

                    {/* Time Estimate Section */}
                    <Grid item xs={12}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 3 },
                                borderRadius: 1,
                                position: 'relative',
                                bgcolor: 'paper.main',
                                boxShadow: `
                                    0 1px 2px rgba(0,0,0,0.03),
                                    0 4px 20px rgba(0,0,0,0.06),
                                    inset 0 0 0 1px rgba(255,255,255,0.9)
                                `,
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
                            }}
                        >
                            <TimeEstimate timeEstimate={recipe.time_estimate} />
                        </Paper>
                    </Grid>

                    {/* Ingredients Section */}
                    <Grid item xs={12} md={4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 3 },
                                borderRadius: 1,
                                position: 'relative',
                                bgcolor: 'paper.main',
                                boxShadow: `
                                    0 1px 2px rgba(0,0,0,0.03),
                                    0 4px 20px rgba(0,0,0,0.06),
                                    inset 0 0 0 1px rgba(255,255,255,0.9)
                                `,
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
                            }}
                        >
                            <IngredientsList
                                recipe={recipe}
                                servings={servings}
                                onServingsChange={setServings}
                            />
                        </Paper>
                    </Grid>

                    {/* Instructions Section */}
                    <Grid item xs={12} md={8}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 3 },
                                borderRadius: 1,
                                position: 'relative',
                                bgcolor: 'paper.main',
                                boxShadow: `
                                    0 1px 2px rgba(0,0,0,0.03),
                                    0 4px 20px rgba(0,0,0,0.06),
                                    inset 0 0 0 1px rgba(255,255,255,0.9)
                                `,
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
                            }}
                        >
                            <CookingInstructions
                                recipe={recipe}
                                servings={servings}
                            />
                        </Paper>
                    </Grid>

                    {/* Notes Section */}
                    {recipe.notes && recipe.notes.length > 0 && (
                        <Grid item xs={12}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    position: 'relative',
                                    bgcolor: 'paper.main',
                                    boxShadow: `
                                        0 1px 2px rgba(0,0,0,0.03),
                                        0 4px 20px rgba(0,0,0,0.06),
                                        inset 0 0 0 1px rgba(255,255,255,0.9)
                                    `,
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
                                }}
                            >
                                <RecipeNotes recipe={recipe} />
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </AppLayout>
    );
};

export default RecipePage;
