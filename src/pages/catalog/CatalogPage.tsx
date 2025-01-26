import { FC, useState } from 'react';
import { Grid, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import SearchBar from '../../components/search-bar/SearchBar';
import RecipeCard from '../../components/recipe-card/RecipeCard';
import { MOCK_RECIPES } from '../../mocks/recipes';
import { IngredientSection } from '../../types';

const CatalogPage: FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        <AppLayout>
            <Box sx={{ mb: { xs: 2, sm: 4 } }}>
                <Typography
                    variant={isMobile ? 'h5' : 'h4'}
                    component="h1"
                    gutterBottom
                    align="center"
                    sx={{ fontWeight: 600 }}
                >
                    My Recipes
                </Typography>
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by recipe name, ingredient, or tag..."
                />
            </Box>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
                {filteredRecipes.map((recipe) => (
                    <Grid item key={recipe.id} xs={12} sm={6} md={4}>
                        <RecipeCard
                            id={recipe.id}
                            title={recipe.title}
                            description={recipe.description}
                            imageUrl={recipe.images[0]}
                            tags={recipe.tags}
                            servings={recipe.servings}
                        />
                    </Grid>
                ))}
                {filteredRecipes.length === 0 && (
                    <Grid item xs={12}>
                        <Typography
                            variant={isMobile ? 'body1' : 'h6'}
                            color="text.secondary"
                            align="center"
                            sx={{ py: 4 }}
                        >
                            {searchQuery
                                ? 'No recipes found matching your search.'
                                : 'No recipes yet. Click "Add Recipe" to get started!'}
                        </Typography>
                    </Grid>
                )}
            </Grid>
        </AppLayout>
    );
};

export default CatalogPage;
