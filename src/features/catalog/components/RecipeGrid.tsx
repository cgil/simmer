import { FC, memo } from 'react';
import {
    Box,
    Grid,
    Typography,
    CircularProgress,
    Fade,
    useTheme,
} from '@mui/material';
import { Recipe } from '../../../types/recipe';
import EmptyRecipeBook from '../../../components/icons/EmptyRecipeBook';
import DraggableRecipeCard from '../../../components/recipe/DraggableRecipeCard';
import { MatchType } from '../../../components/recipe/MatchCornerFold';

interface RecipeGridProps {
    visibleRecipes: Recipe[];
    initialLoading: boolean;
    searchLoading?: boolean;
    loadingMore: boolean;
    error: string | null;
    searchQuery: string;
    selectedCollection: string;
    lastRecipeElementRef: (node: HTMLDivElement | null) => void;
    handleRecipeClick: (recipe: Recipe) => void;
    determineMatchType: (recipe: Recipe, searchQuery: string) => MatchType;
    handleRecipeReordering?: (
        draggedId: string,
        targetId: string,
        newPosition: number
    ) => void;
}

const RecipeGrid: FC<RecipeGridProps> = ({
    visibleRecipes,
    initialLoading,
    loadingMore,
    error,
    searchQuery,
    selectedCollection,
    lastRecipeElementRef,
    handleRecipeClick,
    determineMatchType,
    handleRecipeReordering,
}) => {
    const theme = useTheme();

    if (initialLoading) {
        return (
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
        );
    }

    if (error) {
        return (
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
                <Typography color="error" align="center" gutterBottom>
                    {error}
                </Typography>
                <Typography
                    variant="body2"
                    align="center"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                >
                    Try refreshing the page or check your internet connection.
                </Typography>
            </Box>
        );
    }

    if (visibleRecipes.length > 0) {
        return (
            <>
                <Fade in={!initialLoading} timeout={300}>
                    <Grid
                        container
                        spacing={{ xs: 2, sm: 3 }}
                        columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
                    >
                        {visibleRecipes.map((recipe, index) => {
                            // Check if this is the last recipe element for infinite scroll
                            const isLastElement =
                                index === visibleRecipes.length - 1;

                            return (
                                <DraggableRecipeCard
                                    key={recipe.id || `recipe-${index}`}
                                    recipe={recipe}
                                    isLastElement={isLastElement}
                                    lastRecipeElementRef={lastRecipeElementRef}
                                    handleRecipeClick={handleRecipeClick}
                                    determineMatchType={determineMatchType}
                                    searchQuery={searchQuery}
                                    selectedCollection={selectedCollection}
                                    theme={theme}
                                    recipePosition={index * 1000}
                                    onRecipeReorder={handleRecipeReordering}
                                    isFirstItem={index === 0}
                                    isLastItem={
                                        index === visibleRecipes.length - 1
                                    }
                                />
                            );
                        })}
                    </Grid>
                </Fade>

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
            </>
        );
    }

    return (
        <Fade in={!initialLoading} timeout={300}>
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
                        <Typography variant="h6" align="center" gutterBottom>
                            No recipes found
                        </Typography>
                        <Typography
                            variant="body2"
                            align="center"
                            color="text.secondary"
                        >
                            Try adjusting your search query or adding new
                            recipes.
                        </Typography>
                    </>
                ) : (
                    <>
                        <Typography variant="h6" align="center" gutterBottom>
                            Your recipe book is empty
                        </Typography>
                        <Typography
                            variant="body2"
                            align="center"
                            color="text.secondary"
                        >
                            Start adding recipes by clicking the + button in the
                            top right.
                        </Typography>
                    </>
                )}
            </Box>
        </Fade>
    );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(RecipeGrid);
