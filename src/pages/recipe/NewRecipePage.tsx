import React, { FC, useState, useCallback, useRef, useEffect } from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppLayout from '../../components/layout/AppLayout';
import {
    extractRecipe,
    generateRecipeIdeas,
    createRecipeFromIdea,
} from '../../lib/api';
import { RecipeIdea } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Import the new components
import MethodSwitcher from '../../components/NewRecipeSections/MethodSwitcher';
import ImportSection from '../../components/NewRecipeSections/ImportSection';
import AiSection from '../../components/NewRecipeSections/AiSection';
import BlankSection from '../../components/NewRecipeSections/BlankSection';
import ImageSection from '../../components/NewRecipeSections/ImageSection';
import ProgressStepsDisplay from '../../components/NewRecipeSections/ProgressStepsDisplay';

// Define the available creation methods
type CreationMethod = 'import' | 'ai' | 'blank' | 'image';

// Define the available creation methods in order for index calculation
const creationMethods: CreationMethod[] = ['import', 'ai', 'blank', 'image'];

// --- Constants ---
const EXTRACTION_STEPS = [
    'Visiting the recipe website',
    'Gathering tasty photos',
    'Having our chef taste test',
    'Personalizing it for you',
    'Writing it in our cookbook',
];
const AI_RECIPE_STEPS = [
    'Gathering ingredients and inspiration',
    'Crafting the perfect recipe structure',
    "Adding chef's special touches",
    'Testing for deliciousness',
    'Finalizing your personal recipe',
];

// --- Progress Step Timing Configuration ---
// The progress indicator felt too quick, so we slow each step down by expanding the random
// duration range. Feel free to tweak these values to fine-tune UX speed.
const STEP_MIN_DURATION_MS = 8000; // 8 seconds
const STEP_MAX_DURATION_MS = 10000; // 10 seconds

const getRandomStepDuration = () =>
    Math.floor(
        Math.random() * (STEP_MAX_DURATION_MS - STEP_MIN_DURATION_MS + 1)
    ) + STEP_MIN_DURATION_MS;

// --- Dynamic Motion Variants Function ---
const getMotionVariants = (direction: number) => ({
    initial: {
        opacity: 0,
        x: direction > 0 ? 50 : -50, // Slide in from right (forward) or left (backward)
        scale: 0.98,
    },
    animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: { duration: 0.4, ease: [0.25, 0.8, 0.5, 1] }, // Custom ease
    },
    exit: {
        opacity: 0,
        x: direction > 0 ? -50 : 50, // Slide out to left (forward) or right (backward)
        scale: 0.98,
        transition: { duration: 0.3, ease: [0.5, 0, 0.75, 0.2] }, // Custom ease
    },
});

// --- Main Page Component ---

const NewRecipePage: FC = () => {
    const navigate = useNavigate();
    const [activeMethod, setActiveMethod] = useState<CreationMethod>('import');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [url, setUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importActiveStep, setImportActiveStep] = useState(0);
    const [importError, setImportError] = useState<string | null>(null);
    const [recipePrompt, setRecipePrompt] = useState('');
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [recipeIdeas, setRecipeIdeas] = useState<RecipeIdea[]>([]);
    const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
    const [showIdeaPromptEdit, setShowIdeaPromptEdit] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [isCreatingFromIdea, setIsCreatingFromIdea] = useState(false);
    const [aiCreateActiveStep, setAiCreateActiveStep] = useState(0);
    const [aiCreateError, setAiCreateError] = useState<string | null>(null);

    // --- Direction Tracking for Animation ---
    const previousMethodIndexRef = useRef<number>(
        creationMethods.indexOf(activeMethod)
    );
    const [direction, setDirection] = useState<number>(1); // Initial direction

    useEffect(() => {
        const currentMethodIndex = creationMethods.indexOf(activeMethod);
        const prevIndex = previousMethodIndexRef.current;
        if (currentMethodIndex !== prevIndex) {
            setDirection(currentMethodIndex > prevIndex ? 1 : -1);
            previousMethodIndexRef.current = currentMethodIndex;
        }
    }, [activeMethod]);

    // --- Memoized Event Handlers ---

    const handleMethodChange = useCallback(
        (method: CreationMethod) => {
            if (isImporting || isGeneratingIdeas || isCreatingFromIdea) return;
            setActiveMethod(method);
            setUrl('');
            setImportError(null);
            setRecipePrompt('');
            setGenerationError(null);
            setRecipeIdeas([]);
            setSelectedIdeaId(null);
            setShowIdeaPromptEdit(false);
            setAiCreateError(null);
            setError(null);
        },
        [isImporting, isGeneratingIdeas, isCreatingFromIdea]
    );

    const handleUrlSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!url.trim()) {
                setImportError('Please enter a URL');
                return;
            }
            let currentIsImporting = true;
            try {
                new URL(url);
                setImportError(null);
                setIsImporting(true);
                setImportActiveStep(0);

                const stepDuration = getRandomStepDuration();
                for (let i = 0; i < EXTRACTION_STEPS.length - 1; i++) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, stepDuration)
                    );
                    if (!currentIsImporting) return;
                    setImportActiveStep(i + 1);
                }

                const importedRecipe = await extractRecipe(url);
                setImportActiveStep(EXTRACTION_STEPS.length - 1);
                setIsLoading(true);
                setTimeout(() => {
                    navigate('/recipe/edit', {
                        state: { recipe: importedRecipe, isImported: true },
                    });
                }, 800);
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to extract recipe';
                setImportError(message);
                setError(message);
                currentIsImporting = false;
                setIsImporting(false);
                setImportActiveStep(0);
            } finally {
                if (!isLoading) {
                    setIsImporting(false);
                }
            }
        },
        [url, navigate, isLoading]
    );

    const handleGenerateRecipeIdeas = useCallback(async () => {
        if (!recipePrompt.trim()) {
            setGenerationError('Please describe the recipe you want.');
            return;
        }
        setIsGeneratingIdeas(true);
        setRecipeIdeas([]);
        setSelectedIdeaId(null);
        setGenerationError(null);
        setAiCreateError(null);
        try {
            const ideas = await generateRecipeIdeas(recipePrompt);
            if (activeMethod === 'ai') {
                setRecipeIdeas(ideas);
            }
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to generate recipe ideas';
            if (activeMethod === 'ai') {
                setGenerationError(message);
                setError(message);
            }
        } finally {
            if (activeMethod === 'ai') {
                setIsGeneratingIdeas(false);
            }
        }
    }, [recipePrompt, activeMethod]);

    const handleEditPromptSubmit = useCallback(() => {
        setRecipePrompt(editedPrompt);
        setShowIdeaPromptEdit(false);
        handleGenerateRecipeIdeas();
    }, [editedPrompt, handleGenerateRecipeIdeas]);

    const handleCreateFromSelectedIdea = useCallback(async () => {
        if (!selectedIdeaId) return;
        const selectedIdea = recipeIdeas.find(
            (idea) => idea.id === selectedIdeaId
        );
        if (!selectedIdea) return;

        let currentIsCreating = true;
        setIsCreatingFromIdea(true);
        setAiCreateActiveStep(0);
        setAiCreateError(null);
        setError(null);

        try {
            const stepDuration = getRandomStepDuration();
            for (let i = 0; i < AI_RECIPE_STEPS.length - 1; i++) {
                await new Promise((resolve) =>
                    setTimeout(resolve, stepDuration)
                );
                if (!currentIsCreating) return;
                setAiCreateActiveStep(i + 1);
            }
            const fullRecipe = await createRecipeFromIdea(
                selectedIdea,
                recipePrompt
            );
            setAiCreateActiveStep(AI_RECIPE_STEPS.length - 1);
            setIsLoading(true);
            setTimeout(() => {
                navigate('/recipe/edit', {
                    state: { recipe: fullRecipe, isNew: true },
                });
            }, 800);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Failed to create recipe';
            setAiCreateError(message);
            setError(message);
            currentIsCreating = false;
            setIsCreatingFromIdea(false);
            setAiCreateActiveStep(0);
        } finally {
            if (!isLoading) {
                setIsCreatingFromIdea(false);
            }
        }
    }, [selectedIdeaId, recipeIdeas, recipePrompt, navigate, isLoading]);

    const handleCreateFromScratch = useCallback(() => {
        const emptyRecipe = {
            title: '',
            description: '',
            servings: 4,
            prep_time: 0,
            cook_time: 0,
            total_time: 0,
            ingredients: [],
            instructions: [{ sectionTitle: '', steps: [''] }],
            notes: [],
            images: [],
        };
        setIsLoading(true);
        setTimeout(() => {
            navigate('/recipe/edit', {
                state: { recipe: emptyRecipe, isNew: true },
            });
        }, 100);
    }, [navigate]);

    // --- Header Content ---
    const headerContent = (
        <Box
            onClick={() => navigate('/')}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
            }}
        >
            <ArrowBackIcon />
            <Typography
                variant="body1"
                sx={{ fontWeight: 500, fontFamily: "'Inter', sans-serif" }}
            >
                Back
            </Typography>
        </Box>
    );

    return (
        <AppLayout headerContent={headerContent}>
            <Box
                sx={{
                    position: 'relative',
                    bgcolor: 'paper.light',
                    minHeight: 'calc(100vh - 64px)',
                    px: { xs: 2, sm: 3, md: 4 },
                    py: { xs: 3, sm: 4 },
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        boxShadow: 'inset 0 0 30px rgba(62, 28, 0, 0.05)',
                        pointerEvents: 'none',
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.8,
                        pointerEvents: 'none',
                        backgroundImage:
                            'radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.05) 0.5px, transparent 0.5px), radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.03) 1px, transparent 1px)',
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
                            py: { xs: 2, sm: 4, md: 6 },
                        }}
                    >
                        {/* Use MethodSwitcher Component */}
                        <MethodSwitcher
                            activeMethod={activeMethod}
                            isLoading={isLoading}
                            isImporting={isImporting}
                            isGeneratingIdeas={isGeneratingIdeas}
                            isCreatingFromIdea={isCreatingFromIdea}
                            handleMethodChange={handleMethodChange}
                        />

                        {/* Main Content Canvas */}
                        <Paper
                            elevation={0}
                            sx={{
                                width: '100%',
                                p: { xs: 2.5, sm: 4 },
                                borderRadius: 2,
                                position: 'relative',
                                bgcolor: 'background.paper',
                                boxShadow: '0 6px 25px rgba(0,0,0,0.08)',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(255,255,255,0.7)',
                                    backdropFilter: 'blur(3px)',
                                    borderRadius: 2,
                                    zIndex: 0,
                                },
                                '& > *': { position: 'relative', zIndex: 1 },
                                minHeight: 350,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                overflow: 'hidden',
                            }}
                        >
                            <AnimatePresence mode="wait" custom={direction}>
                                {activeMethod === 'import' && !isImporting && (
                                    <ImportSection
                                        url={url}
                                        setUrl={setUrl}
                                        isImporting={isImporting}
                                        importError={importError}
                                        setImportError={setImportError}
                                        handleUrlSubmit={handleUrlSubmit}
                                        setError={setError}
                                        customDirection={direction}
                                        getVariants={getMotionVariants}
                                    />
                                )}
                                {activeMethod === 'import' && isImporting && (
                                    <motion.div
                                        key="import-loading"
                                        custom={direction}
                                        variants={getMotionVariants(direction)}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 3,
                                                fontFamily: "'Kalam', cursive",
                                                color: 'primary.main',
                                            }}
                                        >
                                            Getting your recipe...
                                        </Typography>
                                        <ProgressStepsDisplay
                                            steps={EXTRACTION_STEPS}
                                            activeStep={importActiveStep}
                                            isFinalizing={
                                                importActiveStep ===
                                                EXTRACTION_STEPS.length - 1
                                            }
                                        />
                                        {importError && (
                                            <Typography
                                                color="error"
                                                sx={{
                                                    mt: 2,
                                                    fontFamily:
                                                        "'Inter', sans-serif",
                                                }}
                                            >
                                                {importError}
                                            </Typography>
                                        )}
                                    </motion.div>
                                )}

                                {activeMethod === 'ai' && (
                                    <AiSection
                                        recipePrompt={recipePrompt}
                                        setRecipePrompt={setRecipePrompt}
                                        isGeneratingIdeas={isGeneratingIdeas}
                                        recipeIdeas={recipeIdeas}
                                        selectedIdeaId={selectedIdeaId}
                                        setSelectedIdeaId={setSelectedIdeaId}
                                        showIdeaPromptEdit={showIdeaPromptEdit}
                                        setShowIdeaPromptEdit={
                                            setShowIdeaPromptEdit
                                        }
                                        editedPrompt={editedPrompt}
                                        setEditedPrompt={setEditedPrompt}
                                        generationError={generationError}
                                        setGenerationError={setGenerationError}
                                        isCreatingFromIdea={isCreatingFromIdea}
                                        aiCreateActiveStep={aiCreateActiveStep}
                                        aiCreateError={aiCreateError}
                                        handleGenerateRecipeIdeas={
                                            handleGenerateRecipeIdeas
                                        }
                                        handleEditPromptSubmit={
                                            handleEditPromptSubmit
                                        }
                                        handleCreateFromSelectedIdea={
                                            handleCreateFromSelectedIdea
                                        }
                                        setError={setError}
                                        customDirection={direction}
                                        getVariants={getMotionVariants}
                                        aiRecipeSteps={AI_RECIPE_STEPS}
                                    />
                                )}

                                {activeMethod === 'blank' && (
                                    <BlankSection
                                        isLoading={isLoading}
                                        handleCreateFromScratch={
                                            handleCreateFromScratch
                                        }
                                        customDirection={direction}
                                        getVariants={getMotionVariants}
                                    />
                                )}

                                {activeMethod === 'image' && (
                                    <ImageSection
                                        customDirection={direction}
                                        getVariants={getMotionVariants}
                                    />
                                )}
                            </AnimatePresence>

                            {error &&
                                !importError &&
                                !generationError &&
                                !aiCreateError && (
                                    <Typography
                                        color="error"
                                        sx={{
                                            textAlign: 'center',
                                            mt: 2,
                                            fontFamily: "'Inter', sans-serif",
                                            position: 'absolute',
                                            bottom: '1rem',
                                            left: '1rem',
                                            right: '1rem',
                                            zIndex: 2,
                                        }}
                                    >
                                        {error}
                                    </Typography>
                                )}
                        </Paper>
                    </Box>
                </Container>
            </Box>
        </AppLayout>
    );
};

export default NewRecipePage;
