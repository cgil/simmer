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
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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

    // State for menu and dialogs
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Menu handlers
    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
    };

    // Fetch recipe if not provided in location state
    useEffect(() => {
        if (!id || initialRecipe) return;

        const fetchRecipe = async () => {
            setLoading(true);
            setError(null);

            try {
                // Pass user ID if available, but don't require it for public recipes
                const fetchedRecipe = await RecipeService.getRecipeById(
                    id,
                    user?.id
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
    }, [id, initialRecipe, user?.id]);

    // When edit button is clicked, navigate to edit page with recipe data
    const handleEditClick = () => {
        if (recipe) {
            // Navigate to the edit page with the recipe data
            navigate('/recipe/edit', {
                state: {
                    recipe: recipe,
                    returnTo:
                        location.state?.returnTo || `/recipe/${recipe.id}`,
                },
            });
        }
        handleCloseMenu();
    };

    // Delete handlers
    const handleDeleteClick = () => {
        handleCloseMenu();
        setDeleteDialogOpen(true);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    const handleDeleteConfirm = async () => {
        if (!recipe || !recipe.id || !user) return;

        setIsDeleting(true);
        try {
            await RecipeService.deleteRecipe(recipe.id, user.id);
            setDeleteDialogOpen(false);

            // Navigate back to collection or home after successful deletion
            const returnPath = location.state?.returnTo || '/';
            navigate(returnPath);
        } catch (err) {
            console.error('Error deleting recipe:', err);
            setError('Failed to delete recipe. Please try again.');
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    // Function to handle back navigation with collection context
    const handleBackClick = () => {
        // Navigate back to the collection or home page
        const returnTo = location.state?.returnTo || '/';
        navigate(returnTo);
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
                        onClick={handleBackClick}
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

    // Create the action button with the three-dot menu
    const actionButton =
        user && recipe && user.id === recipe.user_id ? (
            <>
                <IconButton
                    onClick={handleOpenMenu}
                    aria-label="recipe actions"
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            color: 'primary.main',
                        },
                    }}
                >
                    <MoreVertIcon />
                </IconButton>

                <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleCloseMenu}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            borderRadius: 1,
                            minWidth: 180,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        },
                    }}
                >
                    <MenuItem onClick={handleEditClick}>
                        <EditIcon sx={{ mr: 2, fontSize: 20 }} />
                        <Typography>Edit Recipe</Typography>
                    </MenuItem>
                    <MenuItem
                        onClick={handleDeleteClick}
                        sx={{
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.lighter' },
                        }}
                    >
                        <DeleteIcon
                            sx={{
                                mr: 2,
                                fontSize: 20,
                                color: (theme) =>
                                    theme.palette.error.contrastText,
                            }}
                        />
                        <Typography>Delete Recipe</Typography>
                    </MenuItem>
                </Menu>

                {/* Delete confirmation dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={handleDeleteCancel}
                    aria-labelledby="delete-dialog-title"
                    aria-describedby="delete-dialog-description"
                    PaperProps={{
                        sx: {
                            borderRadius: 1,
                            width: '100%',
                            maxWidth: 450,
                        },
                    }}
                >
                    <DialogTitle id="delete-dialog-title">
                        Delete "{recipe.title}"?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="delete-dialog-description">
                            Once you remove this recipe from your cookbook, you
                            won't be able to access this recipe, its
                            ingredients, or cooking instructions anymore.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button
                            onClick={handleDeleteCancel}
                            variant="outlined"
                            disabled={isDeleting}
                            sx={{
                                borderRadius: 1,
                                textTransform: 'none',
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            variant="contained"
                            color="error"
                            disabled={isDeleting}
                            startIcon={
                                isDeleting ? (
                                    <CircularProgress
                                        size={20}
                                        color="inherit"
                                    />
                                ) : (
                                    <DeleteIcon />
                                )
                            }
                            sx={{
                                borderRadius: 1,
                                textTransform: 'none',
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Recipe'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        ) : null;

    // Create the header content with back button
    const headerContent = (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
            }}
        >
            {user ? (
                <Box
                    onClick={handleBackClick}
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
                            fontFamily: 'Inter, system-ui, sans-serif',
                        }}
                    >
                        Back
                    </Typography>
                </Box>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >
                    <Typography
                        variant={isMobile ? 'h6' : 'h5'}
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            color: 'primary.main',
                            letterSpacing: '-0.5px',
                            fontFamily: "'Kalam', cursive",
                        }}
                    >
                        Simmer
                    </Typography>
                </Box>
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
            actionButton={actionButton}
        >
            <Box
                sx={{
                    position: 'relative',
                    bgcolor: 'paper.light',
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
