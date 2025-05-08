import { FC, useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Typography,
    Chip,
    Button,
    useTheme,
    useMediaQuery,
    CircularProgress,
    IconButton,
    Menu,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Container,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendIcon from '@mui/icons-material/Send';
import AppLayout from '../../components/layout/AppLayout';
import IngredientsList from './components/IngredientsList';
import CookingInstructions from './components/CookingInstructions';
import RecipeGallery, { RecipeGalleryHandle } from './components/RecipeGallery';
import RecipeNotes from './components/RecipeNotes';
import TimeEstimate from './components/TimeEstimate';
import { RecipeService } from '../../services/RecipeService';
import { useAuth } from '../../context/AuthContext';
import { Recipe } from '../../types/recipe';
import ShareMenuItem from '../../components/sharing/ShareMenuItem';
import ShareDialogContainer from '../../components/sharing/ShareDialogContainer';
import { IngredientSubstitutionProvider } from '../../components/substitution/IngredientSubstitutionContext';
import useWakeLock from '../../hooks/useWakeLock';
import { FastAverageColor } from 'fast-average-color';
import { getOptimalTextColor } from '../../utils/colorUtils';

const fac = new FastAverageColor();

const hexToRgba = (hex: string, alpha: number): string => {
    const bigint = parseInt(hex.startsWith('#') ? hex.slice(1) : hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const RecipePage: FC = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();

    // Add ref for the RecipeGallery
    const galleryRef = useRef<RecipeGalleryHandle>(null);

    useWakeLock(isMobile);

    const initialRecipe = location.state?.recipe as Recipe | undefined;

    const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe || null);
    const [loading, setLoading] = useState(!initialRecipe);
    const [error, setError] = useState<string | null>(
        location.state?.error || null
    );
    const [servings, setServings] = useState<number>(
        initialRecipe?.servings || 2
    );
    const [canEdit, setCanEdit] = useState<boolean>(false);

    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    const [dominantColor, setDominantColor] = useState<string | null>(null);
    const [heroTextColor, setHeroTextColor] = useState<string>(
        theme.palette.common.white
    );
    const [gradientBackground, setGradientBackground] = useState<string | null>(
        null
    );
    const [heroImageLoaded, setHeroImageLoaded] = useState(false);
    const [activeGalleryImage, setActiveGalleryImage] = useState<string | null>(
        null
    );

    // Handle gallery image changes
    const handleGalleryImageChange = (_index: number, imageUrl: string) => {
        // Always update on image change - removed comparison that may prevent updates
        setActiveGalleryImage(imageUrl);

        // Directly extract colors from the new image
        // Don't rely on the useEffect dependency
        extractColorFromImage(imageUrl);
    };

    // This effect runs only on initial load
    useEffect(() => {
        if (
            recipe &&
            recipe.images &&
            recipe.images.length > 0 &&
            recipe.images[0] &&
            !activeGalleryImage // Only run on initial load
        ) {
            setActiveGalleryImage(recipe.images[0]);
            extractColorFromImage(recipe.images[0]);
        } else if (recipe && (!recipe.images || recipe.images.length === 0)) {
            const defaultColor = theme.palette.grey[200];
            setDominantColor(defaultColor);
            setHeroTextColor(getOptimalTextColor(defaultColor));
            setGradientBackground(theme.palette.background.default);
            setHeroImageLoaded(true);
        }
        // Remove activeGalleryImage from dependencies to prevent cycles
    }, [recipe, theme]);

    // Function to extract color from an image URL
    const extractColorFromImage = async (imageUrl: string) => {
        if (!imageUrl) {
            return;
        }

        try {
            // Set a loading state if this is the first image (don't show loading on navigation)
            if (!heroImageLoaded) {
                setHeroImageLoaded(false);
            }

            // Create a new image element
            const img = new Image();

            // Set crossOrigin to anonymous to request CORS access
            img.crossOrigin = 'Anonymous';

            // Create promise to handle both success and error cases
            const imageLoadPromise = new Promise<HTMLImageElement>(
                (resolve, reject) => {
                    img.onload = () => resolve(img);
                    img.onerror = (e) => {
                        console.error(
                            'Error loading image for color extraction:',
                            e
                        );
                        reject(new Error('Failed to load image'));
                    };
                }
            );

            // Determine if this is a Google Cloud Storage URL
            const isGoogleCloudStorage = imageUrl.includes(
                'storage.googleapis.com'
            );

            // Set the source to trigger loading - don't modify Google Cloud Storage URLs
            if (isGoogleCloudStorage) {
                // For Google Cloud Storage, use the URL as is
                img.src = imageUrl;
            } else {
                // For other URLs, add cache-busting parameter
                img.src = imageUrl;

                // Add cache-busting parameter for some CDNs that might support CORS
                if (!img.src.includes('?')) {
                    img.src = `${img.src}?cors=1&t=${Date.now()}`;
                } else {
                    img.src = `${img.src}&cors=1&t=${Date.now()}`;
                }
            }

            // Wait for image to load with a timeout
            const loadedImg = await Promise.race([
                imageLoadPromise,
                new Promise<never>((_, reject) =>
                    setTimeout(
                        () => reject(new Error('Image load timeout')),
                        5000
                    )
                ),
            ]);

            // Extract color from the loaded image
            const color = await fac.getColorAsync(loadedImg);

            if (color) {
                setDominantColor(color.hex);
                setHeroTextColor(getOptimalTextColor(color.hex));

                const dominantRgbaFull = color.rgba;
                const gradientStartRgba = dominantRgbaFull.replace(
                    /,1\)$/,
                    ',0.85)'
                );
                const gradientMidRgba = dominantRgbaFull.replace(
                    /,1\)$/,
                    ',0.40)'
                );

                const newGradient = `linear-gradient(to bottom, ${gradientStartRgba} 0%, ${gradientStartRgba} 35%, ${gradientMidRgba} 65%, ${theme.palette.background.default} 100%)`;
                setGradientBackground(newGradient);
                setHeroImageLoaded(true);
            } else {
                throw new Error('Could not extract color information');
            }
        } catch (error) {
            console.warn(
                'Color extraction failed, using fallback approach:',
                error
            );
            // Use a color extraction fallback based on the recipe characteristics

            // Option 1: Use primary theme color
            let fallbackColor = theme.palette.primary.main;

            // Option 2: Use a color based on recipe tags if available
            if (recipe && recipe.tags && recipe.tags.length > 0) {
                // Generate a repeatable color based on the first tag
                const tag = recipe.tags[0].toLowerCase();

                // Simple tag-to-color mapping for common food categories
                if (
                    tag.includes('dessert') ||
                    tag.includes('sweet') ||
                    tag.includes('cake') ||
                    tag.includes('cookie')
                ) {
                    fallbackColor = '#F8BBD0'; // Light pink for desserts
                } else if (
                    tag.includes('vegetable') ||
                    tag.includes('salad') ||
                    tag.includes('green') ||
                    tag.includes('vegan')
                ) {
                    fallbackColor = '#C5E1A5'; // Light green for vegetables/vegan
                } else if (
                    tag.includes('meat') ||
                    tag.includes('beef') ||
                    tag.includes('steak')
                ) {
                    fallbackColor = '#FFAB91'; // Light red/orange for meat
                } else if (tag.includes('chicken') || tag.includes('poultry')) {
                    fallbackColor = '#FFCC80'; // Light orange for poultry
                } else if (tag.includes('fish') || tag.includes('seafood')) {
                    fallbackColor = '#81D4FA'; // Light blue for seafood
                } else if (tag.includes('breakfast')) {
                    fallbackColor = '#FFF59D'; // Light yellow for breakfast
                } else if (tag.includes('soup') || tag.includes('stew')) {
                    fallbackColor = '#B39DDB'; // Light purple for soups/stews
                }
            }

            // Apply the fallback color
            setDominantColor(fallbackColor);
            setHeroTextColor(getOptimalTextColor(fallbackColor));

            const fallbackRgba085 = hexToRgba(fallbackColor, 0.85);
            const fallbackRgba040 = hexToRgba(fallbackColor, 0.4);

            setGradientBackground(
                `linear-gradient(to bottom, ${fallbackRgba085} 0%, ${fallbackRgba085} 35%, ${fallbackRgba040} 65%, ${theme.palette.background.default} 100%)`
            );
            setHeroImageLoaded(true);
        }
    };

    useEffect(() => {
        if (!id || initialRecipe) {
            if (initialRecipe) setHeroImageLoaded(true);
            return;
        }

        const fetchRecipe = async () => {
            setLoading(true);
            setHeroImageLoaded(false);
            setError(null);

            try {
                const fetchedRecipe = await RecipeService.getRecipeById(
                    id,
                    user?.id
                );

                if (fetchedRecipe) {
                    setRecipe(fetchedRecipe);
                    setServings(fetchedRecipe.servings || 2);
                } else {
                    setError('Recipe not found');
                    setHeroImageLoaded(true);
                }
            } catch (err) {
                console.error('Error fetching recipe:', err);
                setError('Failed to load recipe. Please try again.');
                setHeroImageLoaded(true);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [id, initialRecipe, user?.id]);

    useEffect(() => {
        const checkEditPermission = async () => {
            if (!recipe || !recipe.id || !user) {
                setCanEdit(false);
                return;
            }
            try {
                if (recipe.user_id === user.id) {
                    setCanEdit(true);
                    return;
                }
                const hasEditPermission =
                    await RecipeService.checkEditPermission(recipe.id);
                setCanEdit(hasEditPermission);
            } catch (err) {
                console.error('Error checking edit permission:', err);
                setCanEdit(false);
            }
        };
        checkEditPermission();
    }, [recipe, user]);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
    };
    const handleEditClick = () => {
        if (recipe) {
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
            await RecipeService.deleteRecipe(recipe.id);
            setDeleteDialogOpen(false);
            const returnPath = location.state?.returnTo || '/';
            navigate(returnPath);
        } catch (err) {
            console.error('Error deleting recipe:', err);
            setError('Failed to delete recipe. Please try again.');
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleBackClick = () => {
        const returnTo = location.state?.returnTo || '/';
        navigate(returnTo);
    };

    const handleShareClick = () => {
        handleCloseMenu();
        setShareDialogOpen(true);
    };

    const handleShareDialogClose = () => {
        setShareDialogOpen(false);
    };

    const heroHeight = useMemo(
        () => ({ xs: '92vh', sm: '94vh', md: '91vh' }),
        []
    );
    const heroMinHeight = useMemo(() => ({ xs: 350, sm: 450, md: 550 }), []);

    if (loading || (!heroImageLoaded && !initialRecipe && !error)) {
        return (
            <AppLayout>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 'calc(100vh - 64px)',
                    }}
                >
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading recipe...</Typography>
                </Box>
            </AppLayout>
        );
    }

    if (error || !recipe) {
        return (
            <AppLayout>
                <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: "'Kalam', cursive",
                            color: 'error.dark',
                            mb: 3,
                        }}
                    >
                        {error || 'Oops! Recipe not found.'}
                    </Typography>
                    <Button
                        onClick={handleBackClick}
                        variant="contained"
                        color="primary"
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontFamily: "'Inter', sans-serif",
                            py: 1,
                            px: 3,
                        }}
                    >
                        Back to Recipes
                    </Button>
                </Box>
            </AppLayout>
        );
    }

    const actionButton =
        user && recipe && (recipe.user_id === user.id || canEdit) ? (
            <>
                <IconButton
                    onClick={handleOpenMenu}
                    aria-label="recipe actions"
                    sx={{
                        color: 'text.primary',
                        position: 'relative',
                        zIndex: 1300,
                        '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.05)',
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
                    {canEdit && (
                        <ShareMenuItem
                            icon={EditIcon}
                            label="Edit Recipe"
                            onClick={handleEditClick}
                        />
                    )}
                    {recipe.user_id === user.id && (
                        <ShareMenuItem
                            icon={SendIcon}
                            label="Share Recipe"
                            onClick={handleShareClick}
                            iconSx={{ transform: 'rotate(-45deg)' }}
                        />
                    )}
                    {recipe.user_id === user.id && (
                        <>
                            <Divider sx={{ my: 0.5 }} />
                            <ShareMenuItem
                                icon={DeleteIcon}
                                label="Delete Recipe"
                                onClick={handleDeleteClick}
                                color={theme.palette.error.contrastText}
                            />
                        </>
                    )}
                </Menu>
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

    const headerContent = (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                position: 'relative',
                zIndex: 1300,
            }}
        >
            {user ? (
                <Box
                    onClick={handleBackClick}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        p: 1,
                        borderRadius: '4px',
                        transition: 'background-color 0.3s',
                        color: 'text.primary',
                        '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            color: 'primary.main',
                        },
                    }}
                >
                    <ArrowBackIcon sx={{ fontSize: 24 }} />
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 500,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
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
                        color: 'text.primary',
                    }}
                >
                    <Typography
                        variant={isMobile ? 'h6' : 'h5'}
                        component="h1"
                        sx={{
                            fontWeight: 700,
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

    const heroContentReady = heroImageLoaded && recipe;

    return (
        <AppLayout
            headerContent={headerContent}
            showCookingButton={true}
            onCookingClick={() =>
                navigate(`/recipe/${recipe.id}/cook`, { state: { servings } })
            }
            actionButton={actionButton}
        >
            <IngredientSubstitutionProvider>
                <Box
                    sx={{
                        background:
                            heroContentReady && gradientBackground
                                ? gradientBackground
                                : theme.palette.background.default,
                        minHeight: '100vh',
                        pt: 0,
                        pb: 4,
                        transition: 'background 0.5s ease-in-out',
                        position: 'relative',
                        '&:before': dominantColor
                            ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '3px',
                                  background: 'none',
                                  zIndex: 10,
                              }
                            : {},
                    }}
                >
                    {heroContentReady ? (
                        <>
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    height: heroHeight,
                                    minHeight: heroMinHeight,
                                }}
                                onTouchStart={(e) =>
                                    galleryRef.current?.handleTouchStart(e)
                                }
                                onTouchEnd={(e) =>
                                    galleryRef.current?.handleTouchEnd(e)
                                }
                            >
                                {/* Layer 1: Masked Image Background */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        maskImage:
                                            'linear-gradient(to bottom, black 70%, transparent 100%)',
                                        WebkitMaskImage:
                                            'linear-gradient(to bottom, black 70%, transparent 100%)',
                                        overflow: 'hidden',
                                        zIndex: 1,
                                    }}
                                >
                                    <RecipeGallery
                                        ref={galleryRef}
                                        images={recipe.images || []}
                                        heroHeight="100%"
                                        onImageChange={handleGalleryImageChange}
                                    />
                                    <Box // Darkening gradient for the image (inside masked layer)
                                        sx={{
                                            position: 'absolute',
                                            top: '55%',
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background:
                                                'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)',
                                            zIndex: 1, // Ensures it's above RecipeGallery within this Box
                                        }}
                                    />
                                </Box>

                                {/* Layer 2: Text Content (Not Masked) - Now with touch events */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '55%', // Positioned from 55% down in HeroAreaContainer
                                        left: 0,
                                        right: 0,
                                        bottom: 0, // Fills the remainder of the height
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-end',
                                        alignItems: 'flex-start',
                                        color: heroTextColor, // Apply text color here
                                        p: { xs: 2, sm: 3, md: 4 },
                                        pb: { xs: 3, sm: 4, md: 5 },
                                        zIndex: 2, // Ensures it's above the Masked Image Background layer
                                    }}
                                >
                                    <Typography
                                        variant={isMobile ? 'h3' : 'h2'}
                                        component="h1"
                                        sx={{
                                            fontWeight: 700,
                                            fontFamily:
                                                "'Lato', 'Helvetica Neue', sans-serif",
                                            color: heroTextColor,
                                            textShadow:
                                                '0px 2px 4px rgba(0,0,0,0.5)',
                                            mb: 1.5,
                                            textAlign: 'left',
                                        }}
                                    >
                                        {recipe.title}
                                    </Typography>
                                    <Typography
                                        variant={isMobile ? 'body1' : 'h6'}
                                        component="p"
                                        sx={{
                                            mb: 2.5,
                                            maxWidth: '700px',
                                            lineHeight: 1.7,
                                            fontFamily: "'Kalam', cursive",
                                            color: heroTextColor,
                                            textShadow:
                                                '0px 1px 3px rgba(0,0,0,0.4)',
                                            textAlign: 'left',
                                        }}
                                    >
                                        {recipe.description}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 1,
                                            flexWrap: 'wrap',
                                            justifyContent: 'flex-start',
                                            mb: 2.5,
                                        }}
                                    >
                                        {recipe.tags.map((tag) => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                size={
                                                    isMobile
                                                        ? 'small'
                                                        : 'medium'
                                                }
                                                sx={{
                                                    fontFamily:
                                                        "'Inter', sans-serif",
                                                    color: heroTextColor,
                                                    backgroundColor:
                                                        'rgba(255,255,255,0.15)',
                                                    backdropFilter: 'blur(5px)',
                                                    border: `1px solid rgba(255,255,255,0.2)`,
                                                    borderRadius: '16px',
                                                    boxShadow:
                                                        '0 2px 8px rgba(0,0,0,0.1)',
                                                    '& .MuiChip-label': {
                                                        color: 'inherit',
                                                    },
                                                }}
                                            />
                                        ))}
                                    </Box>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            maxWidth: 500,
                                            mt: 1,
                                        }}
                                    >
                                        <TimeEstimate
                                            timeEstimate={recipe.time_estimate}
                                            baseTextColor={heroTextColor}
                                        />
                                    </Box>
                                </Box>
                            </Box>

                            <Container
                                // maxWidth="md"
                                sx={{
                                    py: 4,
                                    position: 'relative',
                                    zIndex: 2,
                                    bgcolor: 'transparent',
                                }}
                            >
                                <Box
                                    display="flex"
                                    flexDirection={{ xs: 'column', md: 'row' }}
                                    gap={4}
                                >
                                    <Box
                                        sx={{ flex: { md: 1 }, width: '100%' }}
                                    >
                                        <IngredientsList
                                            recipe={recipe}
                                            servings={servings}
                                            onServingsChange={setServings}
                                        />
                                    </Box>

                                    <Box
                                        sx={{ flex: { md: 2 }, width: '100%' }}
                                    >
                                        <CookingInstructions
                                            recipe={recipe}
                                            servings={servings}
                                        />
                                    </Box>
                                </Box>

                                {recipe.notes && recipe.notes.length > 0 && (
                                    <Box sx={{ mt: 4, width: '100%' }}>
                                        <RecipeNotes recipe={recipe} />
                                    </Box>
                                )}
                            </Container>
                        </>
                    ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography>
                                Recipe content is preparing...
                            </Typography>
                        </Box>
                    )}
                </Box>
            </IngredientSubstitutionProvider>

            <ShareDialogContainer
                open={shareDialogOpen}
                onClose={handleShareDialogClose}
                title="Share Recipe"
                itemType="recipe"
                itemId={recipe.id || ''}
                itemTitle={recipe.title}
            />
        </AppLayout>
    );
};

export default RecipePage;
