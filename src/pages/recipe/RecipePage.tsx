import { FC, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Chip,
    Button,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AppLayout from '../../components/layout/AppLayout';
import { MOCK_RECIPES } from '../../mocks/recipes';
import IngredientsList from './components/IngredientsList';
import CookingInstructions from './components/CookingInstructions';

const RecipePage: FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const recipe = MOCK_RECIPES.find((r) => r.id === id);
    const [servings, setServings] = useState(2);

    if (!recipe) {
        return (
            <AppLayout>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h5">Recipe not found</Typography>
                    <Button
                        onClick={() => navigate('/')}
                        sx={{ mt: 2 }}
                        variant="contained"
                    >
                        Back to Recipes
                    </Button>
                </Box>
            </AppLayout>
        );
    }

    const headerContent = (
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
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
            >
                Back
            </Typography>
        </Box>
    );

    return (
        <AppLayout headerContent={headerContent} showIcon={false}>
            <Box sx={{ position: 'relative' }}>
                <Grid container spacing={4}>
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
                                    background:
                                        'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                                    backgroundClip: 'text',
                                    textFillColor: 'transparent',
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
                                        }}
                                    />
                                ))}
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 4,
                                    justifyContent: 'center',
                                    flexWrap: 'wrap',
                                    mb: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        bgcolor: 'background.paper',
                                        p: 1.5,
                                        px: 2.5,
                                        borderRadius: 2,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    <RestaurantIcon color="primary" />
                                    <Typography sx={{ fontWeight: 500 }}>
                                        {servings} servings
                                    </Typography>
                                </Box>
                                {recipe.time_estimate && (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            bgcolor: 'background.paper',
                                            p: 1.5,
                                            px: 2.5,
                                            borderRadius: 2,
                                            boxShadow:
                                                '0 2px 8px rgba(0,0,0,0.1)',
                                        }}
                                    >
                                        <AccessTimeIcon color="primary" />
                                        <Typography sx={{ fontWeight: 500 }}>
                                            {recipe.time_estimate.total} mins
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Grid>

                    {/* Image Section */}
                    {recipe.images[0] && (
                        <Grid item xs={12}>
                            <Box
                                component="img"
                                src={recipe.images[0]}
                                alt={recipe.title}
                                sx={{
                                    width: '100%',
                                    maxHeight: 500,
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    mb: 4,
                                }}
                            />
                        </Grid>
                    )}

                    {/* Ingredients Section */}
                    <Grid item xs={12} md={4}>
                        <IngredientsList
                            recipe={recipe}
                            servings={servings}
                            onServingsChange={setServings}
                        />
                    </Grid>

                    {/* Instructions Section */}
                    <Grid item xs={12} md={8}>
                        <CookingInstructions
                            recipe={recipe}
                            servings={servings}
                        />
                    </Grid>
                </Grid>
            </Box>
        </AppLayout>
    );
};

export default RecipePage;
