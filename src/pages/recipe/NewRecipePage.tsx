import { FC, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    CircularProgress,
    Container,
    useTheme,
    useMediaQuery,
    LinearProgress,
    Collapse,
    Fade,
    Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkIcon from '@mui/icons-material/Link';
import CreateIcon from '@mui/icons-material/Create';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AppLayout from '../../components/layout/AppLayout';
import {
    extractRecipe,
    generateRecipeIdeas,
    createRecipeFromIdea,
} from '../../lib/api';
import { RecipeIdea } from '../../types';

const EXTRACTION_STEPS = [
    'Visiting the recipe website',
    'Gathering tasty photos',
    'Having our chef taste test',
    'Personalizing it for you',
    'Writing it in our cookbook',
];

// Adding AI recipe specific steps
const AI_RECIPE_STEPS = [
    'Gathering ingredients and inspiration',
    'Crafting the perfect recipe structure',
    "Adding chef's special touches",
    'Testing for deliciousness',
    'Finalizing your personal recipe',
];

const NewRecipePage: FC = () => {
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // New state for managing which section is expanded
    const [activeSection, setActiveSection] = useState<'import' | 'create'>(
        'import'
    );
    // State for AI recipe prompt
    const [recipePrompt, setRecipePrompt] = useState('');

    // State for recipe ideas generation flow
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [recipeIdeas, setRecipeIdeas] = useState<RecipeIdea[]>([]);
    const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
    const [showIdeaPromptEdit, setShowIdeaPromptEdit] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [generationError, setGenerationError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) {
            setError('Please enter a URL');
            return;
        }

        try {
            new URL(url);
            setError(null);
            setIsLoading(true);
            setActiveStep(0);

            // Simulate progress through steps
            const stepDuration = Math.floor(Math.random() * 5000) + 4000; // Random interval between 4 and 9 seconds per step for first 4 steps
            for (let i = 0; i < 4; i++) {
                await new Promise((resolve) =>
                    setTimeout(resolve, stepDuration)
                );
                setActiveStep(i + 1);
            }

            const importedRecipe = await extractRecipe(url);
            setActiveStep(4); // Final step

            // Navigate to edit mode with the imported recipe
            // Mark this recipe as imported so we force it to be treated as new
            navigate('/recipe/edit', {
                state: {
                    recipe: importedRecipe,
                    isImported: true, // Flag this as an imported recipe
                },
            });
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to extract recipe'
            );
            setIsLoading(false);
            setActiveStep(0);
        }
    };

    const handleCreateFromScratch = () => {
        // Create an empty recipe object with the minimum required structure
        const emptyRecipe = {
            title: '',
            description: '',
            servings: 4,
            prep_time: 0,
            cook_time: 0,
            total_time: 0,
            ingredients: [],
            instructions: [
                {
                    sectionTitle: '',
                    steps: [''],
                },
            ],
            notes: [],
            images: [],
        };

        // Reset any AI generation states
        setIsGeneratingIdeas(false);
        setRecipeIdeas([]);
        setSelectedIdeaId(null);

        // Navigate to the recipe edit page with the empty recipe
        navigate('/recipe/edit', {
            state: {
                recipe: emptyRecipe,
                isNew: true, // Flag this as a new recipe (not imported)
            },
        });
    };

    // Recipe Ideas Loading Card Component
    const RecipeIdeaLoadingCard: FC = () => (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                height: 220, // Match the height of the actual recipe cards
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                position: 'relative',
                bgcolor: 'background.paper',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(2px)',
                    borderRadius: 1,
                    zIndex: 0,
                },
            }}
        >
            {/* Title placeholder */}
            <Box
                sx={{
                    height: 28,
                    width: '80%',
                    mb: 1.5,
                    borderRadius: 0.5,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: 'rgba(0,0,0,0.05)',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                            'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                        animation: 'shimmer 1.5s infinite',
                    },
                    '@keyframes shimmer': {
                        '0%': {
                            transform: 'translateX(-100%)',
                        },
                        '100%': {
                            transform: 'translateX(100%)',
                        },
                    },
                }}
            />

            {/* Description placeholder lines */}
            {[...Array(4)].map((_, i) => (
                <Box
                    key={i}
                    sx={{
                        height: 14,
                        width: `${Math.random() * 30 + 70}%`,
                        mb: 1,
                        borderRadius: 0.5,
                        position: 'relative',
                        overflow: 'hidden',
                        bgcolor: 'rgba(0,0,0,0.05)',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                                'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                            animation: 'shimmer 1.5s infinite',
                            animationDelay: `${i * 0.2}s`,
                        },
                    }}
                />
            ))}

            {/* Button placeholder */}
            <Box
                sx={{
                    height: 36,
                    width: '100%',
                    mt: 'auto',
                    borderRadius: 0.5,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: 'rgba(0,0,0,0.05)',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                            'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                        animation: 'shimmer 1.5s infinite',
                    },
                }}
            />
        </Paper>
    );

    // New function to generate AI recipe ideas
    const handleGenerateRecipeIdeas = async () => {
        if (!recipePrompt.trim()) return;

        setIsGeneratingIdeas(true);
        setRecipeIdeas([]);
        setSelectedIdeaId(null);
        setGenerationError(null);

        try {
            const ideas = await generateRecipeIdeas(recipePrompt);
            setRecipeIdeas(ideas);
        } catch (err) {
            setGenerationError(
                err instanceof Error
                    ? err.message
                    : 'Failed to generate recipe ideas'
            );
            setIsGeneratingIdeas(false);
        }
    };

    // Function to create a recipe from a selected idea
    const handleCreateFromSelectedIdea = async () => {
        if (!selectedIdeaId) return;

        const selectedIdea = recipeIdeas.find(
            (idea) => idea.id === selectedIdeaId
        );
        if (!selectedIdea) return;

        // Show loading state
        setIsLoading(true);
        setActiveStep(0);

        try {
            // Simulate progress through steps for a better UX
            const stepDuration = Math.floor(Math.random() * 4000) + 3000; // Random interval between 3 and 8 seconds per step for first 4 steps
            for (let i = 0; i < AI_RECIPE_STEPS.length - 1; i++) {
                await new Promise((resolve) =>
                    setTimeout(resolve, stepDuration)
                );
                setActiveStep(i + 1);
            }

            // Call API to create the full recipe from the idea
            const fullRecipe = await createRecipeFromIdea(
                selectedIdea,
                recipePrompt
            );

            // Set the final step
            setActiveStep(AI_RECIPE_STEPS.length - 1);

            // Navigate to the recipe edit page with the new recipe
            setTimeout(() => {
                navigate('/recipe/edit', {
                    state: {
                        recipe: fullRecipe,
                        isNew: true,
                    },
                });
            }, 800); // Short delay for final step to be visible
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to create recipe'
            );
            setIsLoading(false);
            setActiveStep(0);
        }
    };

    const toggleSection = (section: 'import' | 'create') => {
        // Only change if we're selecting a different section
        if (activeSection !== section) {
            setActiveSection(section);

            // Reset AI generation states when switching sections
            setIsGeneratingIdeas(false);
            setRecipeIdeas([]);
            setSelectedIdeaId(null);
            setShowIdeaPromptEdit(false);

            // Clear any errors when switching to import section
            if (section === 'import') {
                setError(null);
            }
        }
    };

    // Recipe ideas with progressive loading
    const recipeIdeasContent = (
        <Box>
            {/* Show original prompt with edit option */}
            <Box
                sx={{
                    mb: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    position: 'relative',
                }}
            >
                {!showIdeaPromptEdit ? (
                    <>
                        <Typography
                            sx={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '1rem',
                                mb: 0.5,
                                fontWeight: 600,
                            }}
                        >
                            Recipe description:
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    color: 'text.secondary',
                                    pr: 2,
                                    flex: 1,
                                    lineHeight: 1.5,
                                }}
                            >
                                {recipePrompt}
                            </Typography>
                            <Box
                                onClick={() => {
                                    setShowIdeaPromptEdit(true);
                                    setEditedPrompt(recipePrompt);
                                }}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    color: 'text.secondary',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        color: 'primary.main',
                                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                                    },
                                }}
                            >
                                <CreateIcon fontSize="small" />
                            </Box>
                        </Box>
                    </>
                ) : (
                    <>
                        <Typography
                            sx={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '1rem',
                                mb: 1,
                                fontWeight: 600,
                            }}
                        >
                            Recipe description:
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={editedPrompt}
                            onChange={(e) => setEditedPrompt(e.target.value)}
                            variant="outlined"
                            size="small"
                            autoFocus
                            InputProps={{
                                sx: {
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '1rem',
                                    bgcolor: 'background.paper',
                                },
                            }}
                            sx={{ mb: 2 }}
                        />
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 1,
                            }}
                        >
                            <Button
                                size="small"
                                onClick={() => setShowIdeaPromptEdit(false)}
                                sx={{
                                    textTransform: 'none',
                                    color: 'text.secondary',
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AutoAwesomeIcon />}
                                disabled={!editedPrompt.trim()}
                                onClick={() => {
                                    setRecipePrompt(editedPrompt);
                                    setShowIdeaPromptEdit(false);
                                    handleGenerateRecipeIdeas();
                                }}
                                sx={{
                                    textTransform: 'none',
                                    bgcolor: 'primary.main',
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                Generate New Ideas
                            </Button>
                        </Box>
                    </>
                )}
            </Box>

            {/* Recipe ideas grid with loading states */}
            {isGeneratingIdeas && recipeIdeas.length === 0 ? (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[...Array(4)].map((_, index) => (
                        <Grid item xs={12} sm={6} key={`loading-${index}`}>
                            <RecipeIdeaLoadingCard />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {/* Render recipe cards */}
                    {recipeIdeas.map((idea) => (
                        <Grid item xs={12} sm={6} key={idea.id}>
                            <Paper
                                elevation={selectedIdeaId === idea.id ? 2 : 0}
                                onClick={() => {
                                    // Toggle selection - if already selected, deselect it
                                    setSelectedIdeaId(
                                        selectedIdeaId === idea.id
                                            ? null
                                            : idea.id
                                    );
                                }}
                                sx={{
                                    p: 2.5,
                                    height: 220, // Fixed height for all cards
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor:
                                        selectedIdeaId === idea.id
                                            ? 'primary.main'
                                            : 'divider',
                                    borderRadius: 1,
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    bgcolor:
                                        selectedIdeaId === idea.id
                                            ? 'rgba(44, 62, 80, 0.05)'
                                            : 'background.paper',
                                    overflow: 'hidden',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        transform: 'translateY(-1px)',
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(255,255,255,0.6)',
                                        backdropFilter: 'blur(2px)',
                                        borderRadius: 1,
                                        zIndex: 0,
                                    },
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontFamily: "'Kalam', cursive",
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                        color: 'primary.main',
                                        position: 'relative',
                                        zIndex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        lineHeight: 1.2,
                                        height: 48, // ~2 lines of text with padding
                                        pr: 2,
                                    }}
                                >
                                    {idea.title}
                                </Typography>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        height: 120,
                                        overflow: 'hidden',
                                        mt: 1,
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '2rem',
                                            background:
                                                'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.9))',
                                            pointerEvents: 'none',
                                            zIndex: 2,
                                        },
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '0.9rem',
                                            color: 'text.secondary',
                                            position: 'relative',
                                            zIndex: 1,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {idea.description}
                                    </Typography>
                                </Box>

                                {/* Selection indicator */}
                                {selectedIdeaId === idea.id ? (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '0.75rem',
                                            right: '0.75rem',
                                            width: '1.5rem',
                                            height: '1.5rem',
                                            borderRadius: '50%',
                                            bgcolor: 'primary.main',
                                            color: 'primary.contrastText',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 2,
                                            boxShadow:
                                                '0 2px 4px rgba(0,0,0,0.1)',
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                color: 'inherit',
                                            }}
                                        >
                                            ✓
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '0.75rem',
                                            right: '0.75rem',
                                            width: '1.5rem',
                                            height: '1.5rem',
                                            borderRadius: '50%',
                                            border: '1px solid',
                                            borderColor: 'grey.400',
                                            bgcolor: 'rgba(255,255,255,0.8)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 2,
                                            opacity: 0.7,
                                            transition: 'all 0.2s ease',
                                        }}
                                    />
                                )}
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Single action button that adapts based on selection state */}
            {recipeIdeas.length > 0 && (
                <Grid item xs={12}>
                    <Box
                        sx={{
                            mt: 2,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={
                                selectedIdeaId
                                    ? handleCreateFromSelectedIdea
                                    : handleCreateFromScratch
                            }
                            startIcon={
                                selectedIdeaId ? (
                                    <AutoAwesomeIcon />
                                ) : (
                                    <CreateIcon />
                                )
                            }
                            sx={{
                                height: 48,
                                minWidth: 240,
                                bgcolor: selectedIdeaId
                                    ? 'primary.main'
                                    : 'secondary.main',
                                color: selectedIdeaId
                                    ? 'primary.contrastText'
                                    : 'text.primary',
                                fontWeight: 600,
                                fontSize: '1rem',
                                fontFamily: "'Kalam', cursive",
                                textTransform: 'none',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderBottom: '2px solid',
                                borderBottomColor: 'divider',
                                boxShadow: 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: selectedIdeaId
                                        ? 'primary.dark'
                                        : 'secondary.light',
                                    transform: 'translateY(-1px)',
                                    borderColor: 'rgba(44, 62, 80, 0.15)',
                                    boxShadow:
                                        '0 1px 3px rgba(44, 62, 80, 0.1)',
                                },
                            }}
                        >
                            {selectedIdeaId
                                ? 'Create AI Recipe'
                                : 'Create Blank Recipe'}
                        </Button>
                    </Box>
                </Grid>
            )}

            {/* Toggle to import mode */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mt: 3,
                    pt: 2,
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '25%',
                        right: '25%',
                        height: '1px',
                        background:
                            'repeating-linear-gradient(to right, #ddd 0, #ddd 4px, transparent 4px, transparent 8px)',
                    },
                }}
            >
                <Button
                    onClick={() => toggleSection('import')}
                    startIcon={<LinkIcon sx={{ fontSize: 18 }} />}
                    sx={{
                        fontFamily: "'Kalam', cursive",
                        fontSize: '1rem',
                        color: 'text.secondary',
                        textTransform: 'none',
                        bgcolor: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                            bgcolor: 'transparent',
                            color: 'primary.main',
                            textDecoration: 'underline',
                            textUnderlineOffset: '2px',
                            textDecorationStyle: 'wavy',
                            textDecorationColor: 'primary.light',
                        },
                    }}
                >
                    ...or import from a URL
                </Button>
            </Box>
        </Box>
    );

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
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                Back
            </Typography>
        </Box>
    );

    // Import section content
    const importSectionContent = (
        <Box component="form" onSubmit={handleSubmit}>
            <TextField
                fullWidth
                placeholder="https://example.com/your-favorite-recipe"
                value={url}
                onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                }}
                error={!!error}
                helperText={error}
                disabled={isLoading}
                InputProps={{
                    startAdornment: (
                        <LinkIcon
                            sx={{
                                mr: 1,
                                color: error
                                    ? 'error.main'
                                    : url
                                    ? 'primary.main'
                                    : 'text.secondary',
                                transition: 'color 0.2s ease-in-out',
                            }}
                        />
                    ),
                    sx: {
                        bgcolor: 'background.paper',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1rem',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: error ? 'error.main' : 'divider',
                            borderWidth: 1,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: error ? 'error.main' : 'primary.main',
                        },
                    },
                }}
                sx={{ mb: 3 }}
            />

            {isLoading && (
                <Box sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: {
                                xs: 'column',
                                sm: 'row',
                            },
                            gap: { xs: 2, sm: 3 },
                            mb: 3,
                            position: 'relative',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: { xs: 0, sm: '50%' },
                                left: { xs: '50%', sm: 0 },
                                right: { xs: '50%', sm: 0 },
                                height: {
                                    xs: '100%',
                                    sm: '2px',
                                },
                                width: {
                                    xs: '2px',
                                    sm: '100%',
                                },
                                background:
                                    'repeating-linear-gradient(to right, #ddd 0, #ddd 4px, transparent 4px, transparent 8px)',
                                transform: {
                                    xs: 'none',
                                    sm: 'translateY(-50%)',
                                },
                                zIndex: 0,
                            },
                        }}
                    >
                        {EXTRACTION_STEPS.map((label, index) => (
                            <Paper
                                key={label}
                                elevation={0}
                                sx={{
                                    flex: 1,
                                    p: 2,
                                    position: 'relative',
                                    zIndex: 1,
                                    bgcolor:
                                        index === activeStep
                                            ? 'primary.lighter'
                                            : index < activeStep
                                            ? 'success.lighter'
                                            : 'background.paper',
                                    border: '1px solid',
                                    borderColor:
                                        index === activeStep
                                            ? 'primary.light'
                                            : index < activeStep
                                            ? 'success.light'
                                            : 'divider',
                                    borderRadius: 2,
                                    transform:
                                        index === activeStep
                                            ? 'rotate(-2deg)'
                                            : 'none',
                                    transition: 'all 0.3s ease',
                                    boxShadow:
                                        index === activeStep
                                            ? '0 4px 12px rgba(0,0,0,0.1)'
                                            : '0 1px 3px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1,
                                    minHeight: {
                                        xs: 'auto',
                                        sm: 140,
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(255,255,255,0.7)',
                                        backdropFilter: 'blur(4px)',
                                        borderRadius: 2,
                                        zIndex: 0,
                                    },
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0.1,
                                        backgroundImage: `
                                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.2) 0.5px, transparent 0.5px)
                                        `,
                                        backgroundSize: '12px 12px',
                                        pointerEvents: 'none',
                                        zIndex: 0,
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor:
                                            index === activeStep
                                                ? 'primary.main'
                                                : index < activeStep
                                                ? 'success.main'
                                                : 'grey.300',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: "'Kalam', cursive",
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                        position: 'relative',
                                        zIndex: 1,
                                    }}
                                >
                                    {index < activeStep ? '✓' : index + 1}
                                </Box>
                                <Typography
                                    sx={{
                                        fontFamily: "'Kalam', cursive",
                                        fontSize: '1rem',
                                        fontWeight:
                                            index === activeStep ? 700 : 500,
                                        color:
                                            index === activeStep
                                                ? 'primary.main'
                                                : index < activeStep
                                                ? 'success.dark'
                                                : 'text.secondary',
                                        textAlign: 'center',
                                        position: 'relative',
                                        zIndex: 1,
                                        maxWidth: 160,
                                        mx: 'auto',
                                    }}
                                >
                                    {label}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={(activeStep / 4) * 100}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'background.paper',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundImage:
                                    'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                                backgroundSize: '1rem 1rem',
                                animation:
                                    'progress-stripes 1s linear infinite',
                            },
                            '@keyframes progress-stripes': {
                                '0%': {
                                    backgroundPosition: '1rem 0',
                                },
                                '100%': {
                                    backgroundPosition: '0 0',
                                },
                            },
                        }}
                    />
                </Box>
            )}

            <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={isLoading}
                sx={{
                    height: 48,
                    bgcolor: 'secondary.main',
                    color: 'text.primary',
                    fontWeight: 600,
                    fontSize: '1rem',
                    fontFamily: "'Kalam', cursive",
                    textTransform: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderBottom: '2px solid',
                    borderBottomColor: 'divider',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        bgcolor: 'secondary.light',
                        transform: 'translateY(-1px)',
                        borderColor: 'rgba(44, 62, 80, 0.15)',
                        boxShadow: '0 1px 3px rgba(44, 62, 80, 0.1)',
                    },
                }}
            >
                {isLoading ? (
                    <CircularProgress
                        size={24}
                        sx={{ color: 'text.primary' }}
                    />
                ) : (
                    'Import Recipe'
                )}
            </Button>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mt: 3,
                    pt: 2,
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '25%',
                        right: '25%',
                        height: '1px',
                        background:
                            'repeating-linear-gradient(to right, #ddd 0, #ddd 4px, transparent 4px, transparent 8px)',
                    },
                }}
            >
                <Button
                    onClick={() => toggleSection('create')}
                    disabled={isLoading}
                    startIcon={<CreateIcon sx={{ fontSize: 18 }} />}
                    sx={{
                        fontFamily: "'Kalam', cursive",
                        fontSize: '1rem',
                        color: 'text.secondary',
                        textTransform: 'none',
                        bgcolor: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                            bgcolor: 'transparent',
                            color: 'primary.main',
                            textDecoration: 'underline',
                            textUnderlineOffset: '2px',
                            textDecorationStyle: 'wavy',
                            textDecorationColor: 'primary.light',
                        },
                        '&.Mui-disabled': {
                            opacity: 0.5,
                        },
                    }}
                >
                    ...or start with a blank or AI recipe
                </Button>
            </Box>
        </Box>
    );

    // Create section content
    const createSectionContent = (
        <Box>
            {/* Show loading state when creating AI recipe */}
            {isLoading && (
                <Box sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: {
                                xs: 'column',
                                sm: 'row',
                            },
                            gap: { xs: 2, sm: 3 },
                            mb: 3,
                            position: 'relative',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: { xs: 0, sm: '50%' },
                                left: { xs: '50%', sm: 0 },
                                right: { xs: '50%', sm: 0 },
                                height: {
                                    xs: '100%',
                                    sm: '2px',
                                },
                                width: {
                                    xs: '2px',
                                    sm: '100%',
                                },
                                background:
                                    'repeating-linear-gradient(to right, #ddd 0, #ddd 4px, transparent 4px, transparent 8px)',
                                transform: {
                                    xs: 'none',
                                    sm: 'translateY(-50%)',
                                },
                                zIndex: 0,
                            },
                        }}
                    >
                        {(activeSection === 'create'
                            ? AI_RECIPE_STEPS
                            : EXTRACTION_STEPS
                        ).map((label, index) => (
                            <Paper
                                key={label}
                                elevation={0}
                                sx={{
                                    flex: 1,
                                    p: 2,
                                    position: 'relative',
                                    zIndex: 1,
                                    bgcolor:
                                        index === activeStep
                                            ? 'primary.lighter'
                                            : index < activeStep
                                            ? 'success.lighter'
                                            : 'background.paper',
                                    border: '1px solid',
                                    borderColor:
                                        index === activeStep
                                            ? 'primary.light'
                                            : index < activeStep
                                            ? 'success.light'
                                            : 'divider',
                                    borderRadius: 2,
                                    transform:
                                        index === activeStep
                                            ? 'rotate(-2deg)'
                                            : 'none',
                                    transition: 'all 0.3s ease',
                                    boxShadow:
                                        index === activeStep
                                            ? '0 4px 12px rgba(0,0,0,0.1)'
                                            : '0 1px 3px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1,
                                    minHeight: {
                                        xs: 'auto',
                                        sm: 140,
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(255,255,255,0.7)',
                                        backdropFilter: 'blur(4px)',
                                        borderRadius: 2,
                                        zIndex: 0,
                                    },
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0.1,
                                        backgroundImage: `
                                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.2) 0.5px, transparent 0.5px)
                                        `,
                                        backgroundSize: '12px 12px',
                                        pointerEvents: 'none',
                                        zIndex: 0,
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor:
                                            index === activeStep
                                                ? 'primary.main'
                                                : index < activeStep
                                                ? 'success.main'
                                                : 'grey.300',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: "'Kalam', cursive",
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                        position: 'relative',
                                        zIndex: 1,
                                    }}
                                >
                                    {index < activeStep ? '✓' : index + 1}
                                </Box>
                                <Typography
                                    sx={{
                                        fontFamily: "'Kalam', cursive",
                                        fontSize: '1rem',
                                        fontWeight:
                                            index === activeStep ? 700 : 500,
                                        color:
                                            index === activeStep
                                                ? 'primary.main'
                                                : index < activeStep
                                                ? 'success.dark'
                                                : 'text.secondary',
                                        textAlign: 'center',
                                        position: 'relative',
                                        zIndex: 1,
                                        maxWidth: 160,
                                        mx: 'auto',
                                    }}
                                >
                                    {label}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={(activeStep / 4) * 100}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'background.paper',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundImage:
                                    'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                                backgroundSize: '1rem 1rem',
                                animation:
                                    'progress-stripes 1s linear infinite',
                            },
                            '@keyframes progress-stripes': {
                                '0%': {
                                    backgroundPosition: '1rem 0',
                                },
                                '100%': {
                                    backgroundPosition: '0 0',
                                },
                            },
                        }}
                    />
                </Box>
            )}

            {/* Show initial prompt input if not generating ideas and not loading */}
            {!isGeneratingIdeas && !isLoading && (
                <>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="A salmon, kale, and avocado bowl that serves four people..."
                        value={recipePrompt}
                        onChange={(e) => setRecipePrompt(e.target.value)}
                        error={!!generationError}
                        helperText={generationError}
                        InputProps={{
                            sx: {
                                bgcolor: 'background.paper',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '1rem',
                                borderRadius: 1,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: generationError
                                        ? 'error.main'
                                        : 'divider',
                                    borderWidth: 1,
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: generationError
                                        ? 'error.main'
                                        : 'primary.main',
                                },
                            },
                        }}
                        sx={{ mb: 3 }}
                    />

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={
                            recipePrompt
                                ? handleGenerateRecipeIdeas
                                : handleCreateFromScratch
                        }
                        startIcon={
                            recipePrompt ? <AutoAwesomeIcon /> : <CreateIcon />
                        }
                        sx={{
                            height: 48,
                            bgcolor: recipePrompt
                                ? 'primary.main'
                                : 'secondary.main',
                            color: recipePrompt
                                ? 'primary.contrastText'
                                : 'text.primary',
                            fontWeight: 600,
                            fontSize: '1rem',
                            fontFamily: "'Kalam', cursive",
                            textTransform: 'none',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderBottom: '2px solid',
                            borderBottomColor: 'divider',
                            boxShadow: 'none',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: recipePrompt
                                    ? 'primary.dark'
                                    : 'secondary.light',
                                transform: 'translateY(-1px)',
                                borderColor: 'rgba(44, 62, 80, 0.15)',
                                boxShadow: '0 1px 3px rgba(44, 62, 80, 0.1)',
                            },
                        }}
                    >
                        {recipePrompt
                            ? 'Generate AI Recipe Ideas'
                            : 'Create Blank Recipe'}
                    </Button>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            mt: 3,
                            pt: 2,
                            position: 'relative',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: '25%',
                                right: '25%',
                                height: '1px',
                                background:
                                    'repeating-linear-gradient(to right, #ddd 0, #ddd 4px, transparent 4px, transparent 8px)',
                            },
                        }}
                    >
                        <Button
                            onClick={() => toggleSection('import')}
                            startIcon={<LinkIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                fontFamily: "'Kalam', cursive",
                                fontSize: '1rem',
                                color: 'text.secondary',
                                textTransform: 'none',
                                bgcolor: 'transparent',
                                border: 'none',
                                boxShadow: 'none',
                                '&:hover': {
                                    bgcolor: 'transparent',
                                    color: 'primary.main',
                                    textDecoration: 'underline',
                                    textUnderlineOffset: '2px',
                                    textDecorationStyle: 'wavy',
                                    textDecorationColor: 'primary.light',
                                },
                            }}
                        >
                            ...or import from a URL
                        </Button>
                    </Box>
                </>
            )}

            {/* Show recipe ideas (including loading states) but not when loading is true for recipe creation */}
            {isGeneratingIdeas && !isLoading && recipeIdeasContent}
        </Box>
    );

    return (
        <AppLayout headerContent={headerContent}>
            <Box
                sx={{
                    position: 'relative',
                    bgcolor: 'paper.light',
                    minHeight: '100vh',
                    px: { xs: 2, sm: 3, md: 4 },
                    py: { xs: 3, sm: 4 },
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        boxShadow: 'inset 0 0 30px rgba(62, 28, 0, 0.05)',
                        pointerEvents: 'none',
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.8,
                        pointerEvents: 'none',
                        backgroundImage: `
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.05) 0.5px, transparent 0.5px),
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '6px 6px, 14px 14px',
                        backgroundPosition: '0 0',
                        mixBlendMode: 'multiply',
                        filter: 'opacity(1)',
                    },
                }}
            >
                <Container
                    maxWidth="md"
                    sx={{ position: 'relative', zIndex: 1 }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            py: { xs: 4, sm: 6, md: 8 },
                        }}
                    >
                        <Typography
                            variant={isMobile ? 'h4' : 'h3'}
                            component="h1"
                            gutterBottom
                            sx={{
                                fontWeight: 700,
                                color: 'primary.main',
                                textAlign: 'center',
                                fontFamily: "'Kalam', cursive",
                                mb: 2,
                            }}
                        >
                            {activeSection === 'import'
                                ? 'Import Your Recipe'
                                : 'Create New Recipe'}
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{
                                textAlign: 'center',
                                fontSize: { xs: '1rem', sm: '1.125rem' },
                                mx: 'auto',
                                mb: 6,
                                lineHeight: 1.6,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {activeSection === 'import'
                                ? 'Transform any recipe from the web into your personal collection.'
                                : recipePrompt
                                ? 'Describe your recipe idea and AI Chef will do the rest.'
                                : 'Start with a blank recipe or let our AI Chef craft one for you.'}
                        </Typography>

                        <Paper
                            elevation={0}
                            sx={{
                                width: '100%',
                                p: { xs: 2.5, sm: 4 },
                                borderRadius: 1,
                                position: 'relative',
                                bgcolor: 'background.paper',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
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
                                minHeight: 250, // Ensure consistent height during transitions
                            }}
                        >
                            {/* Import section */}
                            <Collapse
                                in={activeSection === 'import'}
                                timeout={500}
                                unmountOnExit
                            >
                                <Fade
                                    in={activeSection === 'import'}
                                    timeout={800}
                                >
                                    {importSectionContent}
                                </Fade>
                            </Collapse>

                            {/* Create section */}
                            <Collapse
                                in={activeSection === 'create'}
                                timeout={500}
                                unmountOnExit
                            >
                                <Fade
                                    in={activeSection === 'create'}
                                    timeout={800}
                                >
                                    {createSectionContent}
                                </Fade>
                            </Collapse>
                        </Paper>
                    </Box>
                </Container>
            </Box>
        </AppLayout>
    );
};

export default NewRecipePage;
