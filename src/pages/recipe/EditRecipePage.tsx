import { FC, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    TextField,
    Grid,
    IconButton,
    Stack,
    Menu,
    MenuItem,
    Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import FontAwesomeIcon from '../../components/icons/FontAwesomeIcon';
import CarrotPlusIcon from '../../components/icons/CarrotPlusIcon';
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
    const [ingredients, setIngredients] = useState(recipe?.ingredients || []);
    const [notes, setNotes] = useState(recipe?.notes || []);

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

    const handleAddIngredient = () => {
        const newIngredient = {
            id: `new-${Date.now()}`,
            name: '',
            quantity: null,
            unit: null,
        };
        setIngredients([...ingredients, newIngredient]);
    };

    const handleAddStep = (sectionIndex: number) => {
        const newInstructions = [...instructions];
        newInstructions[sectionIndex].steps.push('');
        setInstructions(newInstructions);
    };

    const handleAddSection = () => {
        setInstructions([
            ...instructions,
            {
                section_title: 'New Section',
                steps: [''],
            },
        ]);
    };

    const handleAddNote = () => {
        setNotes([...notes, '']);
    };

    const handleDeleteNote = (index: number) => {
        const newNotes = notes.filter((_, i) => i !== index);
        setNotes(newNotes);
    };

    const handleNoteChange = (index: number, value: string) => {
        const newNotes = [...notes];
        newNotes[index] = value;
        setNotes(newNotes);
    };

    const handleDeleteIngredient = (ingredientId: string) => {
        setIngredients(ingredients.filter((ing) => ing.id !== ingredientId));
    };

    const handleDeleteSection = (sectionIndex: number) => {
        setInstructions(
            instructions.filter((_, index) => index !== sectionIndex)
        );
    };

    const handleDeleteStep = (sectionIndex: number, stepIndex: number) => {
        const newInstructions = [...instructions];
        newInstructions[sectionIndex].steps = newInstructions[
            sectionIndex
        ].steps.filter((_, index) => index !== stepIndex);

        // If this was the last step, delete the section
        if (newInstructions[sectionIndex].steps.length === 0) {
            handleDeleteSection(sectionIndex);
        } else {
            setInstructions(newInstructions);
        }
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
            <Container
                maxWidth={false}
                sx={{
                    maxWidth: 1400,
                    pb: { xs: 4, sm: 6, md: 8 },
                    bgcolor: '#FFFFFF',
                    minHeight: '100vh',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.08)',
                        pointerEvents: 'none',
                    },
                    // Paper texture overlay
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
                            radial-gradient(circle at 50% 50%, rgba(25, 25, 25, 0.07) 0.5px, transparent 0.5px),
                            radial-gradient(circle at 50% 50%, rgba(25, 25, 25, 0.04) 1px, transparent 1px)
                        `,
                        backgroundSize: '6px 6px, 14px 14px',
                        backgroundPosition: '0 0',
                        mixBlendMode: 'multiply',
                        filter: 'opacity(1)',
                    },
                }}
            >
                <Box
                    sx={{
                        py: { xs: 2, sm: 3 },
                        position: 'relative',
                        zIndex: 1,
                        '& .MuiTextField-root': {
                            position: 'relative',
                            zIndex: 2,
                        },
                    }}
                >
                    {/* Title Section */}
                    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                        <Box
                            sx={{
                                position: 'relative',
                                bgcolor: '#FFFFFF',
                                p: { xs: 2, sm: 3 },
                                borderRadius: 1,
                                boxShadow: `
                                    0 1px 2px rgba(0,0,0,0.05),
                                    0 3px 6px rgba(0,0,0,0.02),
                                    0 1px 8px rgba(0,0,0,0.02)
                                `,
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
                            <TextField
                                fullWidth
                                placeholder="Give your recipe a name..."
                                defaultValue={recipe.title}
                                variant="standard"
                                sx={{
                                    mb: 2,
                                    '& .MuiInputBase-input': {
                                        fontFamily: "'Kalam', cursive",
                                        fontSize: { xs: '2.5rem', sm: '3rem' },
                                        fontWeight: 700,
                                        lineHeight: 1.2,
                                        pb: 1,
                                        textShadow:
                                            '1px 1px 1px rgba(0,0,0,0.05)',
                                    },
                                    '& .MuiInput-underline:before': {
                                        borderBottomColor: 'transparent',
                                    },
                                }}
                            />
                            <TextField
                                fullWidth
                                placeholder="Add a description..."
                                defaultValue={recipe.description}
                                multiline
                                rows={2}
                                variant="standard"
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: '1.25rem',
                                        lineHeight: 1.5,
                                        color: 'text.secondary',
                                    },
                                    '& .MuiInput-underline:before': {
                                        borderBottomColor: 'transparent',
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    <Grid container spacing={{ xs: 4, md: 6 }}>
                        {/* Ingredients Section */}
                        <Grid item xs={12} md={5}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: '#FFFFFF',
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    boxShadow: `
                                        0 1px 2px rgba(0,0,0,0.05),
                                        0 3px 6px rgba(0,0,0,0.02),
                                        0 1px 8px rgba(0,0,0,0.02)
                                    `,
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
                                <Typography
                                    variant="h2"
                                    sx={{
                                        mb: 3,
                                        fontSize: '2rem',
                                        fontWeight: 700,
                                        fontFamily: "'Kalam', cursive",
                                        textShadow:
                                            '1px 1px 1px rgba(0,0,0,0.05)',
                                        color: 'primary.main',
                                    }}
                                >
                                    Ingredients
                                </Typography>
                                <Stack spacing={3}>
                                    {ingredients.map((ingredient) => (
                                        <Box
                                            key={ingredient.id}
                                            sx={{
                                                display: 'flex',
                                                gap: 2,
                                                alignItems: 'flex-start',
                                                position: 'relative',
                                                '&:hover': {
                                                    '& .delete-button': {
                                                        opacity: 1,
                                                        transform:
                                                            'translateX(0)',
                                                    },
                                                },
                                            }}
                                        >
                                            <TextField
                                                size="small"
                                                placeholder="amount"
                                                defaultValue={
                                                    ingredient.quantity
                                                }
                                                variant="standard"
                                                type="number"
                                                inputProps={{
                                                    min: 0,
                                                    step: 0.25,
                                                }}
                                                sx={{
                                                    width: 160,
                                                    '& .MuiInputBase-input': {
                                                        fontSize: '1rem',
                                                        textAlign: 'right',
                                                        '&::-webkit-inner-spin-button':
                                                            {
                                                                opacity: 0,
                                                                marginLeft: 1,
                                                            },
                                                        '&:hover::-webkit-inner-spin-button':
                                                            {
                                                                opacity: 1,
                                                            },
                                                    },
                                                    '& .MuiInputBase-input::placeholder':
                                                        {
                                                            fontSize:
                                                                '0.875rem',
                                                        },
                                                }}
                                            />
                                            <TextField
                                                size="small"
                                                placeholder="unit"
                                                defaultValue={ingredient.unit}
                                                variant="standard"
                                                sx={{
                                                    width: 160,
                                                    '& .MuiInputBase-input': {
                                                        fontSize: '1rem',
                                                    },
                                                    '& .MuiInputBase-input::placeholder':
                                                        {
                                                            fontSize:
                                                                '0.875rem',
                                                        },
                                                }}
                                            />
                                            <TextField
                                                size="small"
                                                placeholder="ingredient name"
                                                defaultValue={ingredient.name}
                                                variant="standard"
                                                fullWidth
                                                sx={{
                                                    '& .MuiInputBase-input': {
                                                        fontSize: '1rem',
                                                    },
                                                    '& .MuiInputBase-input::placeholder':
                                                        {
                                                            fontSize:
                                                                '0.875rem',
                                                        },
                                                }}
                                            />
                                            <IconButton
                                                className="delete-button"
                                                color="error"
                                                size="small"
                                                onClick={() =>
                                                    handleDeleteIngredient(
                                                        ingredient.id
                                                    )
                                                }
                                                sx={{
                                                    opacity: 0,
                                                    transform:
                                                        'translateX(-10px)',
                                                    transition: 'all 0.2s',
                                                    width: 32,
                                                    height: 32,
                                                    bgcolor: '#f5f5f5',
                                                    '&:hover': {
                                                        transform:
                                                            'translateY(-1px)',
                                                        bgcolor: '#eeeeee',
                                                        '&::before': {
                                                            opacity: 1,
                                                        },
                                                    },
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        boxShadow:
                                                            '0 4px 8px rgba(0,0,0,0.1)',
                                                        opacity: 0,
                                                        transition:
                                                            'opacity 0.2s ease-in-out',
                                                        borderRadius: '50%',
                                                    },
                                                    '& svg': {
                                                        color: '#9e9e9e',
                                                        transition:
                                                            'color 0.2s',
                                                    },
                                                }}
                                            >
                                                <FontAwesomeIcon
                                                    icon="fa-solid fa-eraser"
                                                    sx={{ fontSize: 18 }}
                                                />
                                            </IconButton>
                                        </Box>
                                    ))}
                                    <Button
                                        startIcon={
                                            <CarrotPlusIcon fontSize={20} />
                                        }
                                        onClick={handleAddIngredient}
                                        sx={{
                                            alignSelf: 'flex-start',
                                            color: 'text.secondary',
                                            borderRadius: 2,
                                            py: 1.25,
                                            px: 2.5,
                                            minHeight: 40,
                                            bgcolor: '#FFF9C4',
                                            '&:hover': {
                                                bgcolor: '#FFF59D',
                                            },
                                        }}
                                    >
                                        Add Ingredient
                                    </Button>
                                </Stack>
                            </Box>
                        </Grid>

                        {/* Instructions Section */}
                        <Grid item xs={12} md={7}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: '#FFFFFF',
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    boxShadow: `
                                        0 1px 2px rgba(0,0,0,0.05),
                                        0 3px 6px rgba(0,0,0,0.02),
                                        0 1px 8px rgba(0,0,0,0.02)
                                    `,
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
                                <Typography
                                    variant="h2"
                                    sx={{
                                        mb: 3,
                                        fontSize: '2rem',
                                        fontWeight: 700,
                                        fontFamily: "'Kalam', cursive",
                                        textShadow:
                                            '1px 1px 1px rgba(0,0,0,0.05)',
                                        color: 'primary.main',
                                    }}
                                >
                                    Instructions
                                </Typography>
                                <Stack spacing={4}>
                                    {instructions.map(
                                        (section, sectionIndex) => (
                                            <Box
                                                key={section.section_title}
                                                sx={{
                                                    position: 'relative',
                                                    '&:hover .delete-section': {
                                                        opacity: 1,
                                                        transform:
                                                            'translateX(0)',
                                                    },
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        gap: 2,
                                                        mb: 3,
                                                    }}
                                                >
                                                    <TextField
                                                        fullWidth
                                                        placeholder="Section name (optional)"
                                                        value={
                                                            section.section_title
                                                        }
                                                        variant="standard"
                                                        sx={{
                                                            '& .MuiInputBase-input':
                                                                {
                                                                    fontFamily:
                                                                        "'Kalam', cursive",
                                                                    fontSize:
                                                                        '1.5rem',
                                                                    fontWeight: 700,
                                                                    textShadow:
                                                                        '1px 1px 1px rgba(0,0,0,0.05)',
                                                                },
                                                        }}
                                                    />
                                                    <IconButton
                                                        className="delete-section"
                                                        color="error"
                                                        size="small"
                                                        onClick={() =>
                                                            handleDeleteSection(
                                                                sectionIndex
                                                            )
                                                        }
                                                        sx={{
                                                            opacity: 0,
                                                            transform:
                                                                'translateX(-10px)',
                                                            transition:
                                                                'all 0.2s',
                                                            width: 32,
                                                            height: 32,
                                                            bgcolor: '#f5f5f5',
                                                            '&:hover': {
                                                                transform:
                                                                    'translateY(-1px)',
                                                                bgcolor:
                                                                    '#eeeeee',
                                                                '&::before': {
                                                                    opacity: 1,
                                                                },
                                                            },
                                                            '&::before': {
                                                                content: '""',
                                                                position:
                                                                    'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                right: 0,
                                                                bottom: 0,
                                                                boxShadow:
                                                                    '0 4px 8px rgba(0,0,0,0.1)',
                                                                opacity: 0,
                                                                transition:
                                                                    'opacity 0.2s ease-in-out',
                                                                borderRadius:
                                                                    '50%',
                                                            },
                                                            '& svg': {
                                                                color: '#9e9e9e',
                                                                transition:
                                                                    'color 0.2s',
                                                            },
                                                        }}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon="fa-solid fa-eraser"
                                                            sx={{
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    </IconButton>
                                                </Box>
                                                <Stack spacing={3}>
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
                                                                    position:
                                                                        'relative',
                                                                    '&:hover .step-actions':
                                                                        {
                                                                            opacity: 1,
                                                                            transform:
                                                                                'translateX(0)',
                                                                        },
                                                                }}
                                                            >
                                                                <Typography
                                                                    sx={{
                                                                        mt: 1,
                                                                        minWidth: 28,
                                                                        color: 'text.secondary',
                                                                        fontWeight: 500,
                                                                        fontSize:
                                                                            '1rem',
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
                                                                        multiline
                                                                        placeholder="Describe this step..."
                                                                        value={
                                                                            step
                                                                        }
                                                                        variant="standard"
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
                                                                        sx={{
                                                                            '& .MuiInputBase-input':
                                                                                {
                                                                                    fontSize:
                                                                                        '1rem',
                                                                                    lineHeight: 1.6,
                                                                                },
                                                                        }}
                                                                    />
                                                                    <Box
                                                                        className="step-actions"
                                                                        sx={{
                                                                            display:
                                                                                'flex',
                                                                            gap: 1,
                                                                            opacity: 0,
                                                                            transform:
                                                                                'translateX(-10px)',
                                                                            transition:
                                                                                'all 0.2s',
                                                                            ml: 1,
                                                                        }}
                                                                    >
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
                                                                                width: 32,
                                                                                height: 32,
                                                                                mt: 1,
                                                                                color: 'text.secondary',
                                                                                bgcolor:
                                                                                    '#f8f9fa',
                                                                                '&:hover':
                                                                                    {
                                                                                        bgcolor:
                                                                                            '#eeeeee',
                                                                                    },
                                                                            }}
                                                                        >
                                                                            <CarrotPlusIcon
                                                                                fontSize={
                                                                                    20
                                                                                }
                                                                            />
                                                                        </IconButton>
                                                                        <IconButton
                                                                            color="error"
                                                                            size="small"
                                                                            onClick={() =>
                                                                                handleDeleteStep(
                                                                                    sectionIndex,
                                                                                    stepIndex
                                                                                )
                                                                            }
                                                                            sx={{
                                                                                width: 32,
                                                                                height: 32,
                                                                                mt: 1,
                                                                                bgcolor:
                                                                                    '#f5f5f5',
                                                                                '&:hover':
                                                                                    {
                                                                                        bgcolor:
                                                                                            '#eeeeee',
                                                                                    },
                                                                                '& svg':
                                                                                    {
                                                                                        color: '#9e9e9e',
                                                                                        transition:
                                                                                            'color 0.2s',
                                                                                    },
                                                                            }}
                                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon="fa-solid fa-eraser"
                                                                                sx={{
                                                                                    fontSize: 18,
                                                                                }}
                                                                            />
                                                                        </IconButton>
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                        )
                                                    )}
                                                    <Button
                                                        startIcon={
                                                            <AddIcon
                                                                sx={{
                                                                    fontSize: 20,
                                                                }}
                                                            />
                                                        }
                                                        onClick={() =>
                                                            handleAddStep(
                                                                sectionIndex
                                                            )
                                                        }
                                                        sx={{
                                                            alignSelf:
                                                                'flex-start',
                                                            ml: 4,
                                                            color: 'text.secondary',
                                                            borderRadius: 2,
                                                            py: 1.25,
                                                            px: 2.5,
                                                            minHeight: 40,
                                                            bgcolor: '#f8f9fa',
                                                            '&:hover': {
                                                                bgcolor:
                                                                    '#f5f5f5',
                                                            },
                                                        }}
                                                    >
                                                        Add Step
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        )
                                    )}
                                    <Box sx={{ mt: 2 }}>
                                        <Divider sx={{ mb: 3 }} />
                                        <Button
                                            startIcon={
                                                <PlaylistAddIcon
                                                    sx={{ fontSize: 22 }}
                                                />
                                            }
                                            onClick={handleAddSection}
                                            sx={{
                                                alignSelf: 'flex-start',
                                                color: 'text.secondary',
                                                borderRadius: 2,
                                                py: 1.25,
                                                px: 2.5,
                                                minHeight: 40,
                                                bgcolor: '#f8f9fa',
                                                '&:hover': {
                                                    bgcolor: '#f5f5f5',
                                                },
                                            }}
                                        >
                                            Add New Section
                                        </Button>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid>

                        {/* Notes Section */}
                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: '#FFFFFF',
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    boxShadow: `
                                        0 1px 2px rgba(0,0,0,0.05),
                                        0 3px 6px rgba(0,0,0,0.02),
                                        0 1px 8px rgba(0,0,0,0.02)
                                    `,
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
                                <Typography
                                    variant="h2"
                                    sx={{
                                        mb: 3,
                                        fontSize: '2rem',
                                        fontWeight: 700,
                                        fontFamily: "'Kalam', cursive",
                                        textShadow:
                                            '1px 1px 1px rgba(0,0,0,0.05)',
                                        color: 'primary.main',
                                    }}
                                >
                                    Notes
                                </Typography>
                                <Stack spacing={3}>
                                    {notes.map((note, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                gap: 2,
                                                alignItems: 'flex-start',
                                                position: 'relative',
                                                '&:hover .delete-button': {
                                                    opacity: 1,
                                                    transform: 'translateX(0)',
                                                },
                                            }}
                                        >
                                            <TextField
                                                fullWidth
                                                multiline
                                                placeholder="Add a note..."
                                                value={note}
                                                variant="standard"
                                                onChange={(e) =>
                                                    handleNoteChange(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
                                                sx={{
                                                    '& .MuiInputBase-input': {
                                                        fontSize: '1rem',
                                                        lineHeight: 1.6,
                                                    },
                                                }}
                                            />
                                            <IconButton
                                                className="delete-button"
                                                color="error"
                                                size="small"
                                                onClick={() =>
                                                    handleDeleteNote(index)
                                                }
                                                sx={{
                                                    mt: 1,
                                                    opacity: 0,
                                                    transform:
                                                        'translateX(-10px)',
                                                    transition: 'all 0.2s',
                                                    width: 32,
                                                    height: 32,
                                                    bgcolor: '#f5f5f5',
                                                    '&:hover': {
                                                        transform:
                                                            'translateX(-10px) rotate(-8deg)',
                                                        bgcolor: '#eeeeee',
                                                    },
                                                    '& svg': {
                                                        color: '#9e9e9e',
                                                        transition:
                                                            'color 0.2s',
                                                    },
                                                }}
                                            >
                                                <FontAwesomeIcon
                                                    icon="fa-solid fa-eraser"
                                                    sx={{ fontSize: 18 }}
                                                />
                                            </IconButton>
                                        </Box>
                                    ))}
                                    <Button
                                        startIcon={
                                            <AddIcon sx={{ fontSize: 20 }} />
                                        }
                                        onClick={handleAddNote}
                                        sx={{
                                            alignSelf: 'flex-start',
                                            color: 'text.secondary',
                                            borderRadius: 2,
                                            py: 1.25,
                                            px: 2.5,
                                            minHeight: 40,
                                            bgcolor: '#f8f9fa',
                                            '&:hover': {
                                                bgcolor: '#f5f5f5',
                                            },
                                        }}
                                    >
                                        Add Note
                                    </Button>
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
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
                PaperProps={{
                    sx: {
                        maxHeight: 300,
                        width: 250,
                        mt: 1,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: '#f5f5f5',
                        backgroundImage: `
                            repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(66, 66, 66, 0.05) 31px, rgba(66, 66, 66, 0.05) 32px)
                        `,
                        '& .MuiMenuItem-root': {
                            fontSize: '1rem',
                            py: 1.5,
                            borderBottom: '1px solid',
                            borderColor: 'rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: '#fff',
                                transform: 'translateX(4px)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            },
                        },
                    },
                }}
            >
                {recipe.ingredients.map((ingredient) => (
                    <MenuItem
                        key={ingredient.id}
                        onClick={() => handleIngredientClick(ingredient)}
                        sx={{
                            py: 1.5,
                            '&:hover': {
                                bgcolor: 'primary.lighter',
                            },
                        }}
                    >
                        {ingredient.name}
                    </MenuItem>
                ))}
            </Menu>
        </AppLayout>
    );
};

export default EditRecipePage;
