import { FC, useState, useRef, DragEvent } from 'react';
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
import { Recipe, TimeEstimate } from '../../types/recipe';
import TimeEstimateForm from './components/TimeEstimateForm';
import TagInput from './components/TagInput';
import ImageIcon from '@mui/icons-material/Image';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotebookButton from '../../components/common/NotebookButton';

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
    const [timeEstimate, setTimeEstimate] = useState<TimeEstimate>({
        prep: recipe?.time_estimate?.prep ?? 0,
        cook: recipe?.time_estimate?.cook ?? 0,
        total: recipe?.time_estimate?.total ?? 0,
    });
    const [tags, setTags] = useState<string[]>(recipe?.tags || []);
    const [title, setTitle] = useState(recipe?.title || '');
    const [description, setDescription] = useState(recipe?.description || '');
    const [images, setImages] = useState<string[]>(recipe?.images || []);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    if (!recipe) {
        navigate('/');
        return null;
    }

    const handleSave = () => {
        const updatedRecipe: Recipe = {
            ...recipe,
            title,
            description,
            ingredients,
            instructions,
            notes,
            time_estimate: timeEstimate,
            tags,
            images,
        };
        // TODO: Implement save functionality
        console.log('Saving recipe:', updatedRecipe);
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

                newInstructions[sectionIndex].steps[stepIndex] = {
                    text:
                        currentStep.text.substring(0, start) +
                        textToInsert +
                        currentStep.text.substring(end),
                    timing: currentStep.timing,
                };

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
        newInstructions[sectionIndex].steps.push({
            text: '',
            timing: null,
        });
        setInstructions(newInstructions);
    };

    const handleAddSection = () => {
        setInstructions([
            ...instructions,
            {
                section_title: 'New Section',
                steps: [
                    {
                        text: '',
                        timing: null,
                    },
                ],
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
        const newInstructions = [...instructions];
        newInstructions.splice(sectionIndex, 1);
        setInstructions(newInstructions);
    };

    const handleDeleteStep = (sectionIndex: number, stepIndex: number) => {
        const newInstructions = [...instructions];
        newInstructions[sectionIndex].steps.splice(stepIndex, 1);
        if (newInstructions[sectionIndex].steps.length === 0) {
            newInstructions.splice(sectionIndex, 1);
        }
        setInstructions(newInstructions);
    };

    const handleMoveImage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= images.length) return;
        const newImages = [...images];
        const [movedImage] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, movedImage);
        setImages(newImages);
    };

    const handleImageUpload = (files: FileList | null) => {
        if (!files) return;

        Array.from(files).forEach((file) => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    setImages((prev) => [...prev, result]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleImageUpload(e.dataTransfer.files);
    };

    const handleStepChange = (
        sectionIndex: number,
        stepIndex: number,
        e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
    ) => {
        const newInstructions = [...instructions];
        newInstructions[sectionIndex].steps[stepIndex] = {
            text: e.target.value,
            timing: newInstructions[sectionIndex].steps[stepIndex].timing,
        };
        setInstructions(newInstructions);
    };

    const handleSectionTitleChange = (
        sectionIndex: number,
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const newInstructions = [...instructions];
        newInstructions[sectionIndex].section_title = e.target.value;
        setInstructions(newInstructions);
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
        <AppLayout headerContent={headerContent}>
            <Container
                maxWidth={false}
                sx={{
                    pb: { xs: 4, sm: 6, md: 8 },
                    bgcolor: 'paper.light',
                    minHeight: '100vh',
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
                                bgcolor: 'background.paper',
                                p: { xs: 2, sm: 3 },
                                borderRadius: 1,
                                boxShadow: `
                                    0 1px 2px rgba(0,0,0,0.03),
                                    0 4px 20px rgba(0,0,0,0.06),
                                    inset 0 0 0 1px rgba(255,255,255,0.9)
                                `,
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '100%',
                                    background: 'rgba(255,255,255,0.5)',
                                    backdropFilter: 'blur(4px)',
                                    borderRadius: 1,
                                    zIndex: 0,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                },
                                '& > *': {
                                    position: 'relative',
                                    zIndex: 1,
                                },
                                '& .MuiInputBase-input': {
                                    color: 'text.primary',
                                    fontFamily: "'Inter', sans-serif",
                                },
                            }}
                        >
                            <TextField
                                fullWidth
                                placeholder="Give your recipe a name..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
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
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
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

                    {/* Images Section */}
                    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                        <Box
                            sx={{
                                position: 'relative',
                                bgcolor: 'background.paper',
                                p: { xs: 2, sm: 3 },
                                borderRadius: 1,
                                boxShadow: `
                                    0 1px 2px rgba(0,0,0,0.03),
                                    0 4px 20px rgba(0,0,0,0.06),
                                    inset 0 0 0 1px rgba(255,255,255,0.9)
                                `,
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '100%',
                                    background: 'rgba(255,255,255,0.5)',
                                    backdropFilter: 'blur(4px)',
                                    borderRadius: 1,
                                    zIndex: 0,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                },
                                '& > *': {
                                    position: 'relative',
                                    zIndex: 1,
                                },
                            }}
                        >
                            <Typography
                                variant="h6"
                                gutterBottom
                                sx={{
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    color: 'text.primary',
                                    mb: 2,
                                    fontFamily: "'Kalam', cursive",
                                }}
                            >
                                <ImageIcon />
                                Recipe Images
                            </Typography>

                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: 'repeat(3, 1fr)',
                                        md: 'repeat(4, 1fr)',
                                    },
                                    gap: 2,
                                    position: 'relative',
                                }}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {isDragging && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            bgcolor: 'rgba(0, 0, 0, 0.05)',
                                            border: '2px dashed',
                                            borderColor: 'primary.main',
                                            borderRadius: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 2,
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: 'primary.contrastText',
                                                fontFamily: "'Kalam', cursive",
                                            }}
                                        >
                                            Drop images here
                                        </Typography>
                                    </Box>
                                )}
                                {images.map((imageUrl, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            position: 'relative',
                                            aspectRatio: '4/3',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            '&:hover .image-actions': {
                                                opacity: 1,
                                            },
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={imageUrl}
                                            alt={`Recipe image ${index + 1}`}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                        <Box
                                            className="image-actions"
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                bgcolor: 'rgba(0, 0, 0, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 1,
                                                opacity: 0,
                                                transition:
                                                    'opacity 0.2s ease-in-out',
                                            }}
                                        >
                                            <IconButton
                                                onClick={() =>
                                                    handleMoveImage(
                                                        index,
                                                        index - 1
                                                    )
                                                }
                                                disabled={index === 0}
                                                size="small"
                                                sx={{
                                                    color: 'white',
                                                    bgcolor:
                                                        'rgba(0, 0, 0, 0.5)',
                                                    '&:hover': {
                                                        bgcolor:
                                                            'rgba(0, 0, 0, 0.7)',
                                                    },
                                                    '&.Mui-disabled': {
                                                        opacity: 0.3,
                                                    },
                                                }}
                                            >
                                                <ArrowBackIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => {
                                                    const newImages = [
                                                        ...images,
                                                    ];
                                                    newImages.splice(index, 1);
                                                    setImages(newImages);
                                                }}
                                                size="small"
                                                sx={{
                                                    color: 'white',
                                                    bgcolor:
                                                        'rgba(0, 0, 0, 0.5)',
                                                    '&:hover': {
                                                        bgcolor:
                                                            'rgba(0, 0, 0, 0.7)',
                                                    },
                                                }}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                onClick={() =>
                                                    handleMoveImage(
                                                        index,
                                                        index + 1
                                                    )
                                                }
                                                disabled={
                                                    index === images.length - 1
                                                }
                                                size="small"
                                                sx={{
                                                    color: 'white',
                                                    bgcolor:
                                                        'rgba(0, 0, 0, 0.5)',
                                                    '&:hover': {
                                                        bgcolor:
                                                            'rgba(0, 0, 0, 0.7)',
                                                    },
                                                    '&.Mui-disabled': {
                                                        opacity: 0.3,
                                                    },
                                                }}
                                            >
                                                <ArrowForwardIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ))}
                                <Box
                                    sx={{
                                        aspectRatio: '4/3',
                                        border: '2px dashed',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'rgba(0, 0, 0, 0.02)',
                                        },
                                    }}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) =>
                                            handleImageUpload(e.target.files)
                                        }
                                        style={{ display: 'none' }}
                                    />
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 1,
                                            color: 'text.secondary',
                                        }}
                                    >
                                        <AddPhotoAlternateIcon
                                            sx={{ fontSize: 24 }}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily:
                                                    "'Inter', sans-serif",
                                                textAlign: 'center',
                                            }}
                                        >
                                            Click to add or
                                            <br />
                                            drag images here
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Time Estimate and Tags Section */}
                    <Grid
                        container
                        spacing={{ xs: 4, md: 6 }}
                        sx={{ mb: { xs: 4, md: 6 } }}
                    >
                        <Grid item xs={12} md={5}>
                            <TimeEstimateForm
                                timeEstimate={timeEstimate}
                                onChange={setTimeEstimate}
                            />
                        </Grid>
                        <Grid item xs={12} md={7}>
                            <TagInput tags={tags} onChange={setTags} />
                        </Grid>
                    </Grid>

                    <Grid container spacing={{ xs: 4, md: 6 }}>
                        {/* Ingredients Section */}
                        <Grid item xs={12} md={5}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: 'background.paper',
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    boxShadow: `
                                        0 1px 2px rgba(0,0,0,0.03),
                                        0 4px 20px rgba(0,0,0,0.06),
                                        inset 0 0 0 1px rgba(255,255,255,0.9)
                                    `,
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '100%',
                                        background: 'rgba(255,255,255,0.5)',
                                        backdropFilter: 'blur(4px)',
                                        borderRadius: 1,
                                        zIndex: 0,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    },
                                    '& > *': {
                                        position: 'relative',
                                        zIndex: 1,
                                    },
                                }}
                            >
                                <Typography
                                    variant="h4"
                                    sx={{
                                        color: 'primary.main',
                                        fontFamily: "'Kalam', cursive",
                                        mb: 2,
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
                                                    bgcolor: 'paper.light',
                                                    '&:hover': {
                                                        transform:
                                                            'translateY(-1px)',
                                                        bgcolor: 'paper.dark',
                                                        '&::before': {
                                                            opacity: 1,
                                                        },
                                                    },
                                                    '& svg': {
                                                        color: 'error.main',
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
                                    <NotebookButton
                                        startIcon={
                                            <CarrotPlusIcon fontSize={20} />
                                        }
                                        onClick={handleAddIngredient}
                                        buttonStyle="primary"
                                    >
                                        Add Ingredient
                                    </NotebookButton>
                                </Stack>
                            </Box>
                        </Grid>

                        {/* Instructions Section */}
                        <Grid item xs={12} md={7}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: 'background.paper',
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    boxShadow: `
                                        0 1px 2px rgba(0,0,0,0.03),
                                        0 4px 20px rgba(0,0,0,0.06),
                                        inset 0 0 0 1px rgba(255,255,255,0.9)
                                    `,
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '100%',
                                        background: 'rgba(255,255,255,0.5)',
                                        backdropFilter: 'blur(4px)',
                                        borderRadius: 1,
                                        zIndex: 0,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    },
                                    '& > *': {
                                        position: 'relative',
                                        zIndex: 1,
                                    },
                                }}
                            >
                                <Typography
                                    variant="h4"
                                    sx={{
                                        color: 'primary.main',
                                        fontFamily: "'Kalam', cursive",
                                        mb: 2,
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
                                                        onChange={(e) =>
                                                            handleSectionTitleChange(
                                                                sectionIndex,
                                                                e
                                                            )
                                                        }
                                                    />
                                                    <IconButton
                                                        className="delete-section"
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
                                                            bgcolor:
                                                                'paper.light',
                                                            '&:hover': {
                                                                transform:
                                                                    'translateY(-1px)',
                                                                bgcolor:
                                                                    'paper.dark',
                                                                '&::before': {
                                                                    opacity: 1,
                                                                },
                                                            },
                                                            '& svg': {
                                                                color: 'error.main',
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
                                                                            step.text
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
                                                                        ) =>
                                                                            handleStepChange(
                                                                                sectionIndex,
                                                                                stepIndex,
                                                                                e
                                                                            )
                                                                        }
                                                                        onFocus={() =>
                                                                            setActiveStepIndex(
                                                                                [
                                                                                    sectionIndex,
                                                                                    stepIndex,
                                                                                ]
                                                                            )
                                                                        }
                                                                        onBlur={() =>
                                                                            setActiveStepIndex(
                                                                                null
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
                                                                                    'paper.light',
                                                                                '&:hover':
                                                                                    {
                                                                                        bgcolor:
                                                                                            'paper.dark',
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
                                                                                    'paper.light',
                                                                                '&:hover':
                                                                                    {
                                                                                        bgcolor:
                                                                                            'paper.dark',
                                                                                    },
                                                                                '& svg':
                                                                                    {
                                                                                        color: 'error.main',
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
                                                    <NotebookButton
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
                                                        buttonStyle="primary"
                                                        sx={{ ml: 4 }}
                                                    >
                                                        Add Step
                                                    </NotebookButton>
                                                </Stack>
                                            </Box>
                                        )
                                    )}
                                    <Box sx={{ mt: 2 }}>
                                        <Divider sx={{ mb: 3 }} />
                                        <NotebookButton
                                            startIcon={
                                                <PlaylistAddIcon
                                                    sx={{ fontSize: 22 }}
                                                />
                                            }
                                            onClick={handleAddSection}
                                            buttonStyle="primary"
                                        >
                                            Add New Section
                                        </NotebookButton>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid>

                        {/* Notes Section */}
                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: 'background.paper',
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    boxShadow: `
                                        0 1px 2px rgba(0,0,0,0.03),
                                        0 4px 20px rgba(0,0,0,0.06),
                                        inset 0 0 0 1px rgba(255,255,255,0.9)
                                    `,
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '100%',
                                        background: 'rgba(255,255,255,0.5)',
                                        backdropFilter: 'blur(4px)',
                                        borderRadius: 1,
                                        zIndex: 0,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    },
                                    '& > *': {
                                        position: 'relative',
                                        zIndex: 1,
                                    },
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: 'primary.main',
                                        fontFamily: "'Kalam', cursive",
                                        mb: 2,
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
                                                    bgcolor: 'paper.light',
                                                    '&:hover': {
                                                        transform:
                                                            'translateX(-10px) rotate(-8deg)',
                                                        bgcolor: 'paper.dark',
                                                    },
                                                    '& svg': {
                                                        color: 'error.main',
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
                                    <NotebookButton
                                        startIcon={
                                            <AddIcon sx={{ fontSize: 20 }} />
                                        }
                                        onClick={handleAddNote}
                                        buttonStyle="primary"
                                    >
                                        Add Note
                                    </NotebookButton>
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
                PaperProps={{
                    sx: {
                        maxHeight: 300,
                        width: 200,
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
