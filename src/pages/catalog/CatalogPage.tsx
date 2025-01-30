import { FC, useState } from 'react';
import { Grid, Typography, Box, Paper, Chip } from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import { MOCK_RECIPES } from '../../mocks/recipes';
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
            recipe.ingredients.some((item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

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
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 1,
                        pointerEvents: 'none',
                        backgroundImage: `
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.07) 0.5px, transparent 0.5px),
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.04) 1px, transparent 1px)
                        `,
                        backgroundSize: '6px 6px, 14px 14px',
                        backgroundPosition: '0 0',
                        mixBlendMode: 'multiply',
                        filter: 'opacity(1)',
                    },
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
                    {filteredRecipes.length > 0 ? (
                        <Grid
                            container
                            spacing={{ xs: 2, sm: 3 }}
                            columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
                        >
                            {filteredRecipes.map((recipe) => (
                                <Grid
                                    item
                                    xs={1}
                                    key={recipe.title + recipe.id}
                                >
                                    <Card
                                        onClick={() =>
                                            navigate(`/recipe/${recipe.id}`)
                                        }
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            cursor: 'pointer',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            boxShadow: `
                                                0 1px 2px rgba(0,0,0,0.05),
                                                0 3px 6px rgba(0,0,0,0.02),
                                                0 1px 8px rgba(0,0,0,0.02)
                                            `,
                                            transition: 'all 0.15s ease-in-out',
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
                                                    'rgba(255,255,255,0.6)',
                                                backdropFilter: 'blur(4px)',
                                                borderRadius: 1,
                                                zIndex: 0,
                                            },
                                            '& > *': {
                                                position: 'relative',
                                                zIndex: 1,
                                            },
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
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
                                            image={recipe.images[0]}
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
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
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
                                                    mb: 'auto',
                                                    mt: 1,
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
                                                            recipe.tags.length -
                                                            3
                                                        }`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            fontSize: '0.75rem',
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
                                                            {
                                                                recipe
                                                                    .time_estimate
                                                                    .total
                                                            }{' '}
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
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: { xs: 6, sm: 8 },
                                flex: 1,
                                width: '100%',
                                minHeight: '50vh',
                            }}
                        >
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{
                                    mb: 2,
                                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                    fontFamily: "'Kalam', cursive",
                                }}
                            >
                                No recipes found
                            </Typography>
                            <Typography
                                color="text.secondary"
                                sx={{
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                Try adjusting your search terms
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </AppLayout>
    );
};

export default CatalogPage;
