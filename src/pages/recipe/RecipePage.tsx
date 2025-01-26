import { FC, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Chip,
    Paper,
    Button,
    useTheme,
    useMediaQuery,
    Slider,
    Stack,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AppLayout from '../../components/layout/AppLayout';
import { MOCK_RECIPES } from '../../mocks/recipes';
import { scaleQuantity, formatQuantity } from '../../utils/recipe';

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

    const handleServingsChange = (_event: Event, value: number | number[]) => {
        setServings(value as number);
    };

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
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                transition: 'transform 0.2s',
                                            },
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
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2.5, sm: 4 },
                                height: '100%',
                                borderRadius: 4,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                },
                            }}
                        >
                            <Stack spacing={3}>
                                <Typography
                                    variant="h5"
                                    component="h2"
                                    sx={{
                                        fontWeight: 700,
                                        color: 'primary.main',
                                        mb: 2,
                                        fontSize: {
                                            xs: '1.25rem',
                                            sm: '1.5rem',
                                        },
                                    }}
                                >
                                    Ingredients
                                </Typography>
                                <Box sx={{ px: { xs: 0.5, sm: 2 } }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 2,
                                            flexWrap: 'wrap',
                                            gap: 1,
                                        }}
                                    >
                                        <Typography
                                            id="servings-slider"
                                            sx={{
                                                color: 'text.secondary',
                                                fontWeight: 500,
                                                fontSize: {
                                                    xs: '0.9rem',
                                                    sm: '1rem',
                                                },
                                            }}
                                        >
                                            Adjust servings
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontWeight: 600,
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                px: { xs: 2, sm: 2.5 },
                                                py: { xs: 0.5, sm: 0.75 },
                                                borderRadius: 2,
                                                minWidth: 45,
                                                textAlign: 'center',
                                                boxShadow:
                                                    '0 2px 8px rgba(0,0,0,0.15)',
                                                fontSize: {
                                                    xs: '0.9rem',
                                                    sm: '1rem',
                                                },
                                            }}
                                        >
                                            {servings}
                                        </Typography>
                                    </Box>
                                    <Slider
                                        value={servings}
                                        onChange={handleServingsChange}
                                        aria-labelledby="servings-slider"
                                        step={1}
                                        marks={[
                                            { value: 1, label: '1' },
                                            { value: 2, label: '2' },
                                            { value: 4, label: '4' },
                                            { value: 6, label: '6' },
                                            { value: 8, label: '8' },
                                            { value: 10, label: '10' },
                                        ]}
                                        min={1}
                                        max={10}
                                        valueLabelDisplay="off"
                                        sx={{
                                            '& .MuiSlider-thumb': {
                                                width: { xs: 10, sm: 12 },
                                                height: { xs: 10, sm: 12 },
                                                transition: '0.2s',
                                                '&:hover, &.Mui-focusVisible': {
                                                    boxShadow:
                                                        '0 0 0 8px rgba(0,0,0,0.1)',
                                                },
                                            },
                                            '& .MuiSlider-track': {
                                                height: { xs: 3, sm: 4 },
                                            },
                                            '& .MuiSlider-rail': {
                                                height: { xs: 3, sm: 4 },
                                            },
                                            '& .MuiSlider-mark': {
                                                width: { xs: 2, sm: 3 },
                                                height: { xs: 2, sm: 3 },
                                            },
                                            '& .MuiSlider-markLabel': {
                                                fontSize: {
                                                    xs: '0.75rem',
                                                    sm: '0.875rem',
                                                },
                                            },
                                            mb: 4,
                                        }}
                                    />
                                </Box>
                                {recipe.ingredients.map((section) => (
                                    <Box
                                        key={section.section_title}
                                        sx={{ mb: 4 }}
                                    >
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: 600,
                                                mb: 2,
                                                color: 'text.primary',
                                                fontSize: {
                                                    xs: '1rem',
                                                    sm: '1.1rem',
                                                },
                                            }}
                                        >
                                            {section.section_title}
                                        </Typography>
                                        <Box
                                            component="ul"
                                            sx={{
                                                pl: { xs: 1, sm: 2 },
                                                listStyleType: 'none',
                                                '& li:last-child': {
                                                    mb: 0,
                                                },
                                            }}
                                        >
                                            {section.items.map((item) => (
                                                <Typography
                                                    component="li"
                                                    key={item.name}
                                                    sx={{
                                                        mb: 2,
                                                        display: 'flex',
                                                        alignItems:
                                                            'flex-start',
                                                        fontSize: {
                                                            xs: '0.9rem',
                                                            sm: '1rem',
                                                        },
                                                        lineHeight: 1.5,
                                                        '&::before': {
                                                            content: '""',
                                                            width: {
                                                                xs: 4,
                                                                sm: 6,
                                                            },
                                                            height: {
                                                                xs: 4,
                                                                sm: 6,
                                                            },
                                                            bgcolor:
                                                                'primary.main',
                                                            borderRadius: '50%',
                                                            mr: 2,
                                                            mt: '0.5em',
                                                            opacity: 0.7,
                                                            flexShrink: 0,
                                                        },
                                                    }}
                                                >
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                fontWeight: 500,
                                                                display:
                                                                    'inline-block',
                                                                mr: 1,
                                                            }}
                                                        >
                                                            {formatQuantity(
                                                                scaleQuantity(
                                                                    item.quantity,
                                                                    recipe.servings,
                                                                    servings
                                                                )
                                                            )}{' '}
                                                            {item.unit &&
                                                                `${item.unit} `}
                                                        </Box>
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                display:
                                                                    'inline',
                                                            }}
                                                        >
                                                            {item.name}
                                                        </Box>
                                                        {item.notes && (
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    color: 'text.secondary',
                                                                    ml: 1,
                                                                    fontSize:
                                                                        '0.85em',
                                                                    display:
                                                                        'inline-block',
                                                                }}
                                                            >
                                                                ({item.notes})
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Instructions Section */}
                    <Grid item xs={12} md={8}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2.5, sm: 4 },
                                height: '100%',
                                borderRadius: 4,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                },
                            }}
                        >
                            <Typography
                                variant="h5"
                                component="h2"
                                gutterBottom
                                sx={{
                                    fontWeight: 700,
                                    color: 'primary.main',
                                    mb: 3,
                                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                }}
                            >
                                Instructions
                            </Typography>
                            {recipe.instructions.map((section) => (
                                <Box key={section.section_title} sx={{ mb: 4 }}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 600,
                                            mb: 2,
                                        }}
                                    >
                                        {section.section_title}
                                    </Typography>
                                    <Box component="ol" sx={{ pl: 2 }}>
                                        {section.steps.map((step, index) => (
                                            <Typography
                                                component="li"
                                                key={index}
                                                sx={{ mb: 2 }}
                                            >
                                                {step}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </Paper>
                    </Grid>

                    {/* Notes Section */}
                    {recipe.notes.length > 0 && (
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 } }}>
                                <Typography
                                    variant="h5"
                                    component="h2"
                                    gutterBottom
                                    sx={{ fontWeight: 600 }}
                                >
                                    Notes
                                </Typography>
                                <Box component="ul" sx={{ pl: 2 }}>
                                    {recipe.notes.map((note, index) => (
                                        <Typography
                                            component="li"
                                            key={index}
                                            sx={{ mb: 1 }}
                                        >
                                            {note}
                                        </Typography>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </AppLayout>
    );
};

export default RecipePage;
