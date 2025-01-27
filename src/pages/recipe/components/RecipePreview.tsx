import { FC } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Grid,
    Chip,
    Stack,
    Divider,
} from '@mui/material';
import { Recipe } from '../../../types';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

interface RecipePreviewProps {
    recipe: Recipe;
    onEdit: () => void;
    onSave: () => void;
    isLoading?: boolean;
}

const RecipePreview: FC<RecipePreviewProps> = ({
    recipe,
    onEdit,
    onSave,
    isLoading = false,
}) => {
    return (
        <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, sm: 4 },
                    bgcolor: '#F8F7FA',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 2,
                    }}
                >
                    Preview Recipe
                </Typography>

                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h4"
                        gutterBottom
                        sx={{
                            fontWeight: 700,
                            color: 'primary.main',
                        }}
                    >
                        {recipe.title}
                    </Typography>
                    <Typography
                        color="text.secondary"
                        sx={{ mb: 2, fontSize: '1.1rem', lineHeight: 1.6 }}
                    >
                        {recipe.description}
                    </Typography>
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{ mb: 3 }}
                        divider={
                            <Divider
                                orientation="vertical"
                                flexItem
                                sx={{ mx: 2 }}
                            />
                        }
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <RestaurantIcon color="primary" />
                            <Typography>{recipe.servings} servings</Typography>
                        </Box>
                        {recipe.time_estimate && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <AccessTimeIcon color="primary" />
                                <Typography>
                                    {recipe.time_estimate.total} mins
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {recipe.tags.map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                color="secondary"
                            />
                        ))}
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ fontWeight: 600 }}
                        >
                            Ingredients
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                            {recipe.ingredients.map((ingredient) => (
                                <Typography
                                    key={ingredient.id}
                                    component="li"
                                    sx={{ mb: 1 }}
                                >
                                    {ingredient.quantity &&
                                        `${ingredient.quantity} ${
                                            ingredient.unit || ''
                                        } `}
                                    {ingredient.name}
                                    {ingredient.notes &&
                                        ` (${ingredient.notes})`}
                                </Typography>
                            ))}
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ fontWeight: 600 }}
                        >
                            Instructions
                        </Typography>
                        {recipe.instructions.map((section, index) => (
                            <Box key={index} sx={{ mb: 3 }}>
                                <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 600, mb: 1 }}
                                >
                                    {section.section_title}
                                </Typography>
                                <Box component="ol" sx={{ pl: 2 }}>
                                    {section.steps.map((step, stepIndex) => (
                                        <Typography
                                            key={stepIndex}
                                            component="li"
                                            sx={{ mb: 1 }}
                                        >
                                            {step}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Grid>
                </Grid>

                {recipe.notes && recipe.notes.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ fontWeight: 600 }}
                        >
                            Notes
                        </Typography>
                        <Box component="ul" sx={{ pl: 2 }}>
                            {recipe.notes.map((note, index) => (
                                <Typography
                                    key={index}
                                    component="li"
                                    sx={{ mb: 1 }}
                                >
                                    {note}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                )}

                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ mt: 4, justifyContent: 'flex-end' }}
                >
                    <Button
                        variant="outlined"
                        onClick={onEdit}
                        disabled={isLoading}
                        startIcon={<EditIcon />}
                    >
                        Edit Recipe
                    </Button>
                    <Button
                        variant="contained"
                        onClick={onSave}
                        disabled={isLoading}
                        startIcon={<SaveIcon />}
                    >
                        Save Recipe
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
};

export default RecipePreview;
