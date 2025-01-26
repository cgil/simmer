import { FC, useState } from 'react';
import { Grid, Typography, Box, Paper, Chip } from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import { MOCK_RECIPES } from '../../mocks/recipes';
import { IngredientSection } from '../../types';
import { Card, CardMedia, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';

const CatalogPage: FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    // TODO: Replace with actual search logic
    const filteredRecipes = MOCK_RECIPES.filter(
        (recipe) =>
            recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            recipe.tags.some((tag: string) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase())
            ) ||
            recipe.ingredients.some((section: IngredientSection) =>
                section.items.some((item) =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
    );

    return (
        <AppLayout showAddButton>
            <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 } }}>
                <Typography
                    variant="h3"
                    component="h1"
                    gutterBottom
                    sx={{
                        fontWeight: 700,
                        textAlign: 'center',
                        mb: { xs: 2.5, sm: 3 },
                        background:
                            'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                        backgroundClip: 'text',
                        textFillColor: 'transparent',
                        fontSize: { xs: '1.75rem', sm: '2.25rem' },
                    }}
                >
                    Recipe Catalog
                </Typography>

                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 1, sm: 1.5 },
                        mb: { xs: 3, sm: 4 },
                        borderRadius: 2,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        border: '1.5px solid',
                        borderColor: 'divider',
                        '&:focus-within': {
                            borderColor: 'primary.main',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
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
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                color: 'text.secondary',
                                userSelect: 'none',
                            }}
                        >
                            {filteredRecipes.length}{' '}
                            {filteredRecipes.length === 1
                                ? 'result'
                                : 'results'}
                        </Typography>
                    )}
                </Paper>

                <Grid container spacing={3}>
                    {filteredRecipes.map((recipe) => (
                        <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                            <Card
                                onClick={() => navigate(`/recipe/${recipe.id}`)}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow:
                                            '0 12px 30px rgba(0,0,0,0.12)',
                                    },
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={recipe.images[0]}
                                    alt={recipe.title}
                                    sx={{
                                        objectFit: 'cover',
                                    }}
                                />
                                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                    <Typography
                                        variant="h6"
                                        component="h2"
                                        gutterBottom
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: '1.25rem',
                                            mb: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
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
                                            minHeight: '48px',
                                        }}
                                    >
                                        {recipe.description}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 1,
                                            flexWrap: 'wrap',
                                            mb: 2,
                                        }}
                                    >
                                        {recipe.tags.slice(0, 3).map((tag) => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                size="small"
                                                color="secondary"
                                                sx={{
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                        ))}
                                        {recipe.tags.length > 3 && (
                                            <Chip
                                                label={`+${
                                                    recipe.tags.length - 3
                                                }`}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            mt: 'auto',
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
                                                fontSize="small"
                                                color="action"
                                            />
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
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
                                                    fontSize="small"
                                                    color="action"
                                                />
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {recipe.time_estimate.total}{' '}
                                                    mins
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {filteredRecipes.length === 0 && (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 8,
                            px: 2,
                        }}
                    >
                        <Typography
                            variant="h6"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                        >
                            No recipes found
                        </Typography>
                        <Typography color="text.secondary">
                            Try adjusting your search terms
                        </Typography>
                    </Box>
                )}
            </Box>
        </AppLayout>
    );
};

export default CatalogPage;
