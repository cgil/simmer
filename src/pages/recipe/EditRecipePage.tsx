import { FC, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    TextField,
    Grid,
    IconButton,
    Stack,
    Menu,
    MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AddLinkIcon from '@mui/icons-material/AddLink';
import AppLayout from '../../components/layout/AppLayout';
import { Recipe } from '../../types';

const EditRecipePage: FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const recipe = location.state?.recipe as Recipe;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [activeStepIndex, setActiveStepIndex] = useState<
        [number, number] | null
    >(null);
    const [instructions, setInstructions] = useState(
        recipe?.instructions || []
    );

    if (!recipe) {
        navigate('/');
        return null;
    }

    const handleSave = () => {
        // TODO: Implement save functionality
        navigate('/');
    };

    const handleIngredientClick = (ingredient: Recipe['ingredients'][0]) => {
        if (activeStepIndex) {
            const [sectionIndex, stepIndex] = activeStepIndex;
            const newInstructions = [...instructions];
            const currentStep = newInstructions[sectionIndex].steps[stepIndex];
            const textToInsert = `[INGREDIENT=${ingredient.id}]`;

            // Get the active textarea element
            const textarea = document.querySelector(
                `[data-section-index="${sectionIndex}"][data-step-index="${stepIndex}"]`
            ) as HTMLTextAreaElement;

            if (textarea) {
                const start = textarea.selectionStart || 0;
                const end = textarea.selectionEnd || 0;

                newInstructions[sectionIndex].steps[stepIndex] =
                    currentStep.substring(0, start) +
                    textToInsert +
                    currentStep.substring(end);

                setInstructions(newInstructions);

                // Restore focus and move cursor after the inserted text
                setTimeout(() => {
                    textarea.focus();
                    const newPosition = start + textToInsert.length;
                    textarea.setSelectionRange(newPosition, newPosition);
                }, 0);
            }
        }
        setAnchorEl(null);
    };

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
                        fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                >
                    Back
                </Typography>
            </Box>
            <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{
                    height: 42,
                    px: 3,
                }}
            >
                Save Recipe
            </Button>
        </Box>
    );

    return (
        <AppLayout headerContent={headerContent} showIcon={false}>
            <Container maxWidth="lg">
                <Box sx={{ py: { xs: 3, sm: 4 } }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, sm: 4 },
                            bgcolor: '#F8F7FA',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Grid container spacing={4}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Recipe Title"
                                    defaultValue={recipe.title}
                                    variant="outlined"
                                    sx={{ mb: 3 }}
                                />
                                <TextField
                                    fullWidth
                                    label="Description"
                                    defaultValue={recipe.description}
                                    multiline
                                    rows={3}
                                    variant="outlined"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 2, fontWeight: 600 }}
                                >
                                    Ingredients
                                </Typography>
                                <Stack spacing={2}>
                                    {recipe.ingredients.map((ingredient) => (
                                        <Box
                                            key={ingredient.id}
                                            sx={{
                                                display: 'flex',
                                                gap: 2,
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            <TextField
                                                size="small"
                                                label="Quantity"
                                                defaultValue={
                                                    ingredient.quantity
                                                }
                                                sx={{ width: 100 }}
                                            />
                                            <TextField
                                                size="small"
                                                label="Unit"
                                                defaultValue={ingredient.unit}
                                                sx={{ width: 100 }}
                                            />
                                            <TextField
                                                size="small"
                                                label="Ingredient"
                                                defaultValue={ingredient.name}
                                                fullWidth
                                            />
                                            <IconButton
                                                color="error"
                                                size="small"
                                                sx={{ mt: 1 }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    ))}
                                    <Button
                                        startIcon={<AddIcon />}
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Add Ingredient
                                    </Button>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 2, fontWeight: 600 }}
                                >
                                    Instructions
                                </Typography>
                                <Stack spacing={2}>
                                    {instructions.map(
                                        (section, sectionIndex) => (
                                            <Box key={section.section_title}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Section Title"
                                                    value={
                                                        section.section_title
                                                    }
                                                    sx={{ mb: 2 }}
                                                />
                                                <Stack spacing={2}>
                                                    {section.steps.map(
                                                        (step, stepIndex) => (
                                                            <Box
                                                                key={stepIndex}
                                                                sx={{
                                                                    display:
                                                                        'flex',
                                                                    gap: 2,
                                                                    alignItems:
                                                                        'flex-start',
                                                                }}
                                                            >
                                                                <Typography
                                                                    sx={{
                                                                        mt: 1,
                                                                        minWidth: 24,
                                                                    }}
                                                                >
                                                                    {stepIndex +
                                                                        1}
                                                                    .
                                                                </Typography>
                                                                <Box
                                                                    sx={{
                                                                        display:
                                                                            'flex',
                                                                        gap: 1,
                                                                        flex: 1,
                                                                    }}
                                                                >
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        multiline
                                                                        value={
                                                                            step
                                                                        }
                                                                        inputProps={{
                                                                            'data-section-index':
                                                                                sectionIndex,
                                                                            'data-step-index':
                                                                                stepIndex,
                                                                        }}
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            const newInstructions =
                                                                                [
                                                                                    ...instructions,
                                                                                ];
                                                                            newInstructions[
                                                                                sectionIndex
                                                                            ].steps[
                                                                                stepIndex
                                                                            ] =
                                                                                e.target.value;
                                                                            setInstructions(
                                                                                newInstructions
                                                                            );
                                                                        }}
                                                                        onFocus={() =>
                                                                            setActiveStepIndex(
                                                                                [
                                                                                    sectionIndex,
                                                                                    stepIndex,
                                                                                ]
                                                                            )
                                                                        }
                                                                    />
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(
                                                                            e
                                                                        ) =>
                                                                            setAnchorEl(
                                                                                e.currentTarget
                                                                            )
                                                                        }
                                                                        sx={{
                                                                            mt: 1,
                                                                        }}
                                                                    >
                                                                        <AddLinkIcon />
                                                                    </IconButton>
                                                                </Box>
                                                                <IconButton
                                                                    color="error"
                                                                    size="small"
                                                                    sx={{
                                                                        mt: 1,
                                                                    }}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Box>
                                                        )
                                                    )}
                                                    <Button
                                                        startIcon={<AddIcon />}
                                                        sx={{
                                                            alignSelf:
                                                                'flex-start',
                                                            ml: 4,
                                                        }}
                                                    >
                                                        Add Step
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        )
                                    )}
                                    <Button
                                        startIcon={<AddIcon />}
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Add Section
                                    </Button>
                                </Stack>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 2, fontWeight: 600 }}
                                >
                                    Notes
                                </Typography>
                                <Stack spacing={2}>
                                    {recipe.notes.map((note) => (
                                        <Box
                                            key={note}
                                            sx={{
                                                display: 'flex',
                                                gap: 2,
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            <TextField
                                                fullWidth
                                                size="small"
                                                multiline
                                                defaultValue={note}
                                            />
                                            <IconButton
                                                color="error"
                                                size="small"
                                                sx={{ mt: 1 }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    ))}
                                    <Button
                                        startIcon={<AddIcon />}
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Add Note
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>
            </Container>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                {recipe.ingredients.map((ingredient) => (
                    <MenuItem
                        key={ingredient.id}
                        onClick={() => handleIngredientClick(ingredient)}
                    >
                        {ingredient.name}
                    </MenuItem>
                ))}
            </Menu>
        </AppLayout>
    );
};

export default EditRecipePage;
