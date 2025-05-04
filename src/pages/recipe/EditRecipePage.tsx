import { FC, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Alert,
    Collapse,
    SelectChangeEvent,
} from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import { Recipe, TimeEstimate } from '../../types/recipe';
import { CollectionItem, ALL_RECIPES_ID } from '../../types/collection';
import { convertRecipeIngredientMentions } from '../../utils/ingredientMentions';
import { useAuth } from '../../context/AuthContext';
import { RecipeService } from '../../services/RecipeService';
import { CollectionService } from '../../services/CollectionService';
import { generateUuidV4, ensureUuid, isValidUuid } from '../../utils/uuid';
import { generateRecipeImage } from '../../lib/api';
import { ImageUploadState } from '../../services/UploadService';
import EditRecipeHeader from './components/EditRecipeHeader';
import CollectionSelector from './components/CollectionSelector';
import RecipeTitleDescriptionEditor from './components/RecipeTitleDescriptionEditor';
import RecipeImageManager from './components/RecipeImageManager';
import RecipeMetadataEditor from './components/RecipeMetadataEditor';
import IngredientsEditor from './components/IngredientsEditor';
import InstructionsEditor from './components/InstructionsEditor';
import NotesEditor from './components/NotesEditor';

const EditRecipePage: FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id: routeId } = useParams<{ id?: string }>();

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [instructions, setInstructions] = useState<Recipe['instructions']>(
        []
    );
    const [ingredients, setIngredients] = useState<Recipe['ingredients']>([]);
    const [notes, setNotes] = useState<{ id: string; text: string }[]>([]);
    const [timeEstimate, setTimeEstimate] = useState<TimeEstimate>({
        prep: 0,
        cook: 0,
        rest: 0,
        total: 0,
    });
    const [tags, setTags] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [imageUploads, setImageUploads] = useState<ImageUploadState[]>([]);
    const [servings, setServings] = useState<number>(2);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
    const [isCollectionsChanged, setIsCollectionsChanged] =
        useState<boolean>(false);
    const [selectedCollection, setSelectedCollection] =
        useState<string>(ALL_RECIPES_ID);
    const [selectedCollections, setSelectedCollections] = useState<string[]>(
        []
    );
    const [initialCollectionIds, setInitialCollectionIds] = useState<string[]>(
        []
    );
    const [availableCollections, setAvailableCollections] = useState<
        CollectionItem[]
    >([]);
    const [canEdit, setCanEdit] = useState<boolean>(false);
    const [checkingPermission, setCheckingPermission] = useState<boolean>(true);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);

    useEffect(() => {
        const stateRecipe = location.state?.recipe as Recipe | undefined;

        if (stateRecipe) {
            const validatedIngredients = (stateRecipe.ingredients || []).map(
                (ing) => ({
                    ...ing,
                    id: isValidUuid(ing.id) ? ing.id : generateUuidV4(),
                })
            );
            setRecipe({ ...stateRecipe, ingredients: validatedIngredients });
        } else if (routeId === 'new') {
            if (!user) {
                console.warn('User not yet available for new recipe template.');
            }
            const newRecipeTemplate: Recipe = {
                id: 'new',
                title: '',
                description: '',
                ingredients: [],
                instructions: [],
                notes: [],
                tags: [],
                images: [],
                servings: 2,
                time_estimate: { prep: 0, cook: 0, rest: 0, total: 0 },
                user_id: user?.id || '',
                is_public: true,
                is_shared: false,
                shared_with_me: false,
                access_level: undefined,
            };
            setRecipe(newRecipeTemplate);
        } else if (routeId && isValidUuid(routeId)) {
            const fetchRecipeForEdit = async () => {
                if (!user) {
                    console.error(
                        'User not available to fetch recipe for edit.'
                    );
                    navigate('/login', { state: { from: location } });
                    return;
                }
                setCheckingPermission(true);
                try {
                    const fetchedRecipe = await RecipeService.getRecipeById(
                        routeId,
                        user.id
                    );
                    if (fetchedRecipe) {
                        const hasPermission =
                            await RecipeService.checkEditPermission(routeId);
                        if (hasPermission) {
                            setRecipe(fetchedRecipe);
                        } else {
                            console.warn(
                                `User lacks permission to edit recipe ${routeId}. Redirecting.`
                            );
                            navigate(`/recipe/${routeId}`, {
                                state: {
                                    error: "You don't have permission to edit this recipe.",
                                },
                            });
                        }
                    } else {
                        console.error(`Recipe not found for edit: ${routeId}`);
                        navigate('/', {
                            state: { error: 'Recipe not found.' },
                        });
                    }
                } catch (err) {
                    console.error(
                        `Error fetching recipe ${routeId} for edit:`,
                        err
                    );
                    navigate('/', {
                        state: { error: 'Failed to load recipe for editing.' },
                    });
                }
            };
            fetchRecipeForEdit();
        } else {
            console.error(
                'EditRecipePage loaded with invalid routeId or missing state:',
                routeId
            );
            navigate('/');
        }
    }, [location.state, routeId, user, navigate]);

    useEffect(() => {
        if (recipe) {
            setTitle(recipe.title || '');
            setDescription(recipe.description || '');
            setIngredients(recipe.ingredients || []);

            setInstructions(
                recipe.instructions && recipe.instructions.length > 0
                    ? convertRecipeIngredientMentions(
                          recipe.instructions,
                          recipe.ingredients || []
                      )
                    : []
            );
            setNotes(
                recipe.notes?.map((noteText, index) => ({
                    id: `note-${recipe.id}-${index}-${generateUuidV4()}`,
                    text: noteText,
                })) || []
            );
            setTimeEstimate({
                prep: recipe.time_estimate?.prep ?? 0,
                cook: recipe.time_estimate?.cook ?? 0,
                rest: recipe.time_estimate?.rest ?? 0,
                total: recipe.time_estimate?.total ?? 0,
            });
            setTags(recipe.tags || []);

            // Initialize image uploads from existing images (permanent URLs)
            const initialImageUploads = (recipe.images || []).map((url) => ({
                id: generateUuidV4(),
                status: 'success' as const,
                permanentUrl: url,
            }));
            setImageUploads(initialImageUploads);
            setImages(recipe.images || []);

            if (recipe.id === 'new') {
                setSelectedCollections([]);
                setInitialCollectionIds([]);
                setSelectedCollection(ALL_RECIPES_ID);
            } else {
                setSelectedCollection(ALL_RECIPES_ID);
            }
        }
    }, [recipe]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobileDevice(
                /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
                    window.innerWidth < 768
            );
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const loadCollectionsData = async () => {
            if (!user || !recipe) {
                setAvailableCollections([]);
                setInitialCollectionIds([]);
                setSelectedCollections([]);
                return;
            }

            let available: CollectionItem[] = [];
            let associatedIds: string[] = [];

            try {
                available = await CollectionService.getCollectionItems(user.id);
                setAvailableCollections(available);
            } catch (err) {
                console.error('Error fetching available collections:', err);
                setAvailableCollections([]);
            }

            if (recipe.id !== 'new' && isValidUuid(recipe.id)) {
                try {
                    const recipeCollections =
                        await CollectionService.getCollectionsForRecipe(
                            recipe.id as string
                        );
                    associatedIds = recipeCollections.map((c) => c.id);
                } catch (err) {
                    console.error(
                        `Error loading collections for recipe ${recipe.id}:`,
                        err
                    );
                    associatedIds = [];
                }
            } else {
                associatedIds = [];
            }

            setInitialCollectionIds(associatedIds);
            setSelectedCollections(associatedIds);

            if (associatedIds.length > 0) {
                setSelectedCollection(associatedIds[0]);
            } else {
                setSelectedCollection(ALL_RECIPES_ID);
            }
        };

        loadCollectionsData();
    }, [user, recipe]);

    useEffect(() => {
        const checkEditPermission = async () => {
            if (!user || !recipe) {
                setCheckingPermission(true);
                return;
            }

            setCheckingPermission(true); // Indicate check is starting

            // Grant immediate edit permission for new recipes OR imported recipes (non-UUID IDs)
            if (recipe.id === 'new' || !isValidUuid(recipe.id)) {
                setCanEdit(true);
                setIsOwner(true); // Treat as owner until first save
                setCheckingPermission(false);
                return; // Stop checks here for new/imported
            }

            // --- Proceed with checking permission only for existing recipes (valid UUID) ---
            try {
                const ownerCheck = recipe.user_id === user.id;
                setIsOwner(ownerCheck);
                if (ownerCheck) {
                    setCanEdit(true);
                } else {
                    // Ensure we have a valid UUID before calling the service
                    const recipeIdToCheck = recipe.id as string;
                    const hasEditPermission =
                        await RecipeService.checkEditPermission(
                            recipeIdToCheck
                        );
                    setCanEdit(hasEditPermission);

                    if (!hasEditPermission) {
                        console.warn(
                            `User lacks permission to edit recipe ${recipeIdToCheck}. Redirecting.`
                        );
                        navigate(`/recipe/${recipeIdToCheck}`, {
                            state: {
                                error: "You don't have permission to edit this recipe.",
                            },
                        });
                    }
                }
            } catch (err) {
                console.error(
                    'Error checking edit permission for existing recipe:',
                    err
                );
                setCanEdit(false);
                setIsOwner(false);
                // Use recipe.id safely here as it must be a valid UUID to reach this catch block
                navigate(recipe.id ? `/recipe/${recipe.id}` : '/', {
                    state: { error: 'Could not verify edit permissions' },
                });
            } finally {
                setCheckingPermission(false); // Mark check as complete
            }
        };

        checkEditPermission();
    }, [recipe, user, navigate]); // Depends on recipe state and user

    useEffect(() => {
        if (!recipe) return;

        const initialSet = new Set(initialCollectionIds);
        const selectedSet = new Set(selectedCollections);

        if (initialSet.size !== selectedSet.size) {
            setIsCollectionsChanged(true);
            return;
        }

        let changed = false;
        for (const id of initialSet) {
            if (!selectedSet.has(id)) {
                changed = true;
                break;
            }
        }
        if (!changed) {
            for (const id of selectedSet) {
                if (!initialSet.has(id)) {
                    changed = true;
                    break;
                }
            }
        }

        setIsCollectionsChanged(changed);
    }, [selectedCollections, initialCollectionIds, recipe]);

    const saveCollections = async (recipeId: string) => {
        if (!isValidUuid(recipeId)) {
            console.error(
                'Cannot save collections for invalid recipe ID:',
                recipeId
            );
            return;
        }

        try {
            const currentDbCollections = (
                await CollectionService.getCollectionsForRecipe(recipeId)
            ).map((c) => c.id);
            const currentDbSet = new Set(currentDbCollections);
            const targetSet = new Set(selectedCollections);

            for (const collectionId of currentDbCollections) {
                if (!targetSet.has(collectionId)) {
                    await CollectionService.removeRecipeFromCollection(
                        recipeId,
                        collectionId
                    );
                }
            }

            for (const collectionId of selectedCollections) {
                if (!currentDbSet.has(collectionId)) {
                    await CollectionService.addRecipeToCollection(
                        recipeId,
                        collectionId
                    );
                }
            }
            setInitialCollectionIds([...selectedCollections]);
            setIsCollectionsChanged(false);
        } catch (err) {
            console.error(
                `Error updating collections for recipe ${recipeId}:`,
                err
            );
            setSaveError(
                'Failed to update recipe collections. Please try again.'
            );
        }
    };

    const isLoading = checkingPermission || !recipe;

    // Determine if this is a new recipe
    const isNewRecipe =
        recipe?.id === 'new' || (recipe && !isValidUuid(recipe.id));

    if (isLoading) {
        return (
            <AppLayout>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '50vh',
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {checkingPermission && !recipe
                            ? 'Loading recipe...'
                            : checkingPermission
                            ? 'Checking permissions...'
                            : !recipe
                            ? 'Initializing...'
                            : 'Loading...'}
                    </Typography>
                </Box>
            </AppLayout>
        );
    }

    if (!recipe || !canEdit) {
        return null;
    }

    const handleSave = async () => {
        if (!user) {
            setSaveError('You must be logged in to save recipes');
            return;
        }
        if (!recipe) {
            setSaveError('Recipe data is not loaded.');
            return;
        }

        setIsSaving(true);
        setSaveError(null);

        try {
            // Determine if saving a new recipe based on state
            // A recipe is new if its ID is 'new' OR if it's not a valid UUID (imported case)
            const isSavingNewRecipe =
                recipe.id === 'new' || !isValidUuid(recipe.id);

            const currentImages = [...images];

            // --- AI Image Generation Logic for New Recipes ---
            if (
                isSavingNewRecipe &&
                title.trim() !== '' &&
                currentImages.length === 0
            ) {
                console.log(
                    'Attempting to generate AI image for new recipe...'
                );
                try {
                    const generatedImageUrl = await generateRecipeImage(
                        title,
                        description
                    );
                    if (generatedImageUrl) {
                        // Add the generated image to the uploads state manager
                        const newImageUpload: ImageUploadState = {
                            id: generateUuidV4(), // Give it a unique ID
                            status: 'success' as const,
                            permanentUrl: generatedImageUrl,
                            // previewUrl is not needed as it's immediately permanent
                        };
                        setImageUploads((prevUploads) => [
                            newImageUpload,
                            ...prevUploads,
                        ]);

                        // Also update the main 'images' array used directly by save
                        setImages((prevImages) => [
                            generatedImageUrl,
                            ...prevImages,
                        ]);

                        console.log('AI image generated successfully');
                    } else {
                        console.warn(
                            'AI image generation returned null or failed, saving without image.'
                        );
                    }
                } catch (imgError) {
                    console.error('Error generating AI image:', imgError);
                    // Non-fatal: Log error and continue saving without the AI image
                    setSaveError(
                        'Recipe saved, but failed to generate AI image.'
                    ); // Optional: inform user
                }
            }
            // --- End AI Image Generation Logic ---

            const processedIngredients = ingredients
                .filter(
                    (ingredient) =>
                        ingredient.name && ingredient.name.trim() !== ''
                )
                .map((ingredient) => {
                    if (!isValidUuid(ingredient.id)) {
                        console.warn(
                            `Correcting invalid ingredient ID ${ingredient.id} for ${ingredient.name} on save.`
                        );
                        return {
                            ...ingredient,
                            id: ensureUuid(ingredient.id),
                        };
                    }
                    return ingredient;
                });

            const idMapping = new Map<string, string>();
            ingredients.forEach((originalIngredient) => {
                const processed = processedIngredients.find(
                    (p) =>
                        (isValidUuid(originalIngredient.id) &&
                            p.id === originalIngredient.id) ||
                        (!isValidUuid(originalIngredient.id) &&
                            p.id === ensureUuid(originalIngredient.id))
                );
                if (processed && processed.id !== originalIngredient.id) {
                    idMapping.set(originalIngredient.id, processed.id);
                }
            });

            let processedInstructions = instructions;
            if (idMapping.size > 0) {
                processedInstructions = instructions.map((section) => ({
                    ...section,
                    steps: section.steps.map((step) => ({
                        ...step,
                        text: step.text.replace(
                            /@\[([^\]]+)\]\(([^)]+)\)/g,
                            (match, display, id) => {
                                const newId = idMapping.get(id);
                                return newId
                                    ? `@[${display}](${newId})`
                                    : match;
                            }
                        ),
                    })),
                }));
            }

            const updatedRecipeData: Recipe = {
                ...recipe,
                id: recipe.id, // Preserve original ID ('new' or existing UUID)
                title,
                description,
                ingredients: processedIngredients,
                instructions: processedInstructions,
                notes: notes.map((note) => note.text),
                time_estimate: timeEstimate,
                tags,
                images: currentImages, // Use potentially updated images array
                servings,
                user_id: recipe.user_id || user.id,
                is_public: recipe.is_public ?? true,
            };

            const savedRecipeResult = await RecipeService.saveRecipe(
                updatedRecipeData,
                user.id,
                isSavingNewRecipe // Pass the flag to the service
            );

            // Update local state with the truly saved recipe (including new ID and potentially AI image)
            setRecipe(savedRecipeResult);

            // Update images state explicitly if an AI image was added
            if (currentImages.length > images.length) {
                setImages(currentImages);
            }

            if (savedRecipeResult.id && isValidUuid(savedRecipeResult.id)) {
                // First save collections if needed
                try {
                    if (isCollectionsChanged) {
                        await saveCollections(savedRecipeResult.id);
                    }
                } catch (collectionError) {
                    console.error(
                        'Error managing recipe collections post-save:',
                        collectionError
                    );
                    // Keep the specific image generation error if it exists, otherwise show collection error
                    if (!saveError) {
                        setSaveError(
                            'Failed to update recipe collections. Please try again.'
                        );
                    }
                }
            } else {
                console.error(
                    'Save operation did not return a valid UUID:',
                    savedRecipeResult.id
                );
                // Keep the specific image generation error if it exists, otherwise show save error
                if (!saveError) {
                    setSaveError(
                        'Failed to save recipe (invalid ID returned). Please try again.'
                    );
                }
                setIsSaving(false);
                return; // Stop execution here if save failed fundamentally
            }

            // Navigate only after successful save and collection update (if applicable)
            navigate(`/recipe/${savedRecipeResult.id}`, {
                replace: isSavingNewRecipe, // Replace history if it was a new recipe
                state: { recipe: savedRecipeResult }, // Pass the final saved recipe state
            });
        } catch (error: unknown) {
            console.error('Error during handleSave:', error);
            // Keep the specific image generation error if it exists, otherwise show generic save error
            if (!saveError) {
                let errorMessage = 'Failed to save recipe. Please try again.';
                if (error instanceof Error) {
                    if (error.message.includes('permission')) {
                        errorMessage = error.message;
                    } else if (
                        (error as { code?: string }).code === '42501' ||
                        error.message.includes('RLS')
                    ) {
                        errorMessage =
                            'Permission denied: You cannot modify this recipe.';
                    }
                }
                setSaveError(errorMessage);
            }
        } finally {
            // Always ensure isSaving is reset
            setIsSaving(false);
        }
    };

    const handleCollectionChange = (event: SelectChangeEvent<string>) => {
        if (!isOwner) return;
        const newCollectionId = event.target.value;
        setSelectedCollection(newCollectionId);

        if (newCollectionId === ALL_RECIPES_ID) {
            setSelectedCollections([]);
        } else {
            setSelectedCollections([newCollectionId]);
        }
    };

    const handleGoBack = () => {
        // Use location.state.isNew to identify unsaved AI/Blank recipes
        if (location.state?.isNew === true) {
            // Go back to the creation page
            navigate('/recipe/new');
        } else if (location.state?.from) {
            // If navigated from somewhere specific (like login redirect)
            navigate(location.state.from);
        } else if (recipe && recipe.id && recipe.id !== 'new') {
            // If editing an existing recipe, go to its view page
            navigate(`/recipe/${recipe.id}`);
        } else {
            // Default fallback (e.g., imported recipe, or direct access without state)
            navigate('/');
        }
    };

    const handleGenerateAiCoverImage = async () => {
        if (!title.trim()) {
            setSaveError('Please enter a recipe title first');
            return;
        }

        setIsGeneratingAiImage(true);
        setSaveError(null);

        try {
            // Call the AI image generation function
            const result = await generateRecipeImage(title, description);

            // If we get a valid URL (not a data URI), use it directly
            if (typeof result === 'string' && result.startsWith('http')) {
                // Add the generated image to the uploads state manager
                const newImageUpload: ImageUploadState = {
                    id: generateUuidV4(),
                    status: 'success' as const,
                    permanentUrl: result,
                };

                // Prepend the new image so it appears first
                setImageUploads((prevUploads) => [
                    newImageUpload,
                    ...prevUploads,
                ]);

                // Update the images array used for saving
                setImages((prevImages) => [result, ...prevImages]);

                console.log('AI image generated successfully');
            }
            // For data URIs, we would need to convert and process them, but that's handled in the component now
            else {
                setSaveError(
                    'Failed to generate AI image or invalid format returned. Try again or add your own image.'
                );
            }
        } catch (error: unknown) {
            console.error('Error during AI image generation:', error);
            const message =
                error instanceof Error ? error.message : 'Unknown error';
            setSaveError(
                `Error generating AI image: ${message}. Please try again.`
            );
        } finally {
            setIsGeneratingAiImage(false);
        }
    };

    const handleDeleteIngredient = (ingredientId: string) => {
        // Remove ingredient from list
        setIngredients(ingredients.filter((ing) => ing.id !== ingredientId));

        // Build RegExp to match mentions for this ingredient (with optional surrounding whitespace)
        const mentionRegex = new RegExp(
            `\\s*@\\[[^\\]]+\\]\\(${ingredientId}\\)\\s*`,
            'g'
        );

        // Remove mentions entirely and tidy up extra spaces
        const cleanedInstructions = instructions.map((section) => ({
            ...section,
            steps: section.steps.map((step) => ({
                ...step,
                text: step.text
                    .replace(mentionRegex, ' ') // remove mention and leave single space
                    .replace(/\s{2,}/g, ' ') // collapse multiple spaces
                    .trim(),
            })),
        }));

        setInstructions(cleanedInstructions);
    };

    return (
        <AppLayout
            headerContent={
                <EditRecipeHeader
                    onSave={handleSave}
                    isSaving={isSaving}
                    isLoading={isLoading}
                    onGoBack={handleGoBack}
                />
            }
        >
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
                        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.05) 0.5px, transparent 0.5px), radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.03) 1px, transparent 1px)`,
                        backgroundSize: '6px 6px, 14px 14px',
                        backgroundPosition: '0 0',
                        mixBlendMode: 'multiply',
                        filter: 'opacity(1)',
                    },
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        mb: 2,
                        position: 'relative',
                        zIndex: 2,
                    }}
                >
                    <CollectionSelector
                        selectedCollection={selectedCollection}
                        onCollectionChange={handleCollectionChange}
                        availableCollections={availableCollections}
                        isOwner={isOwner}
                        isLoading={isLoading}
                        allRecipesId={ALL_RECIPES_ID}
                    />
                </Box>

                <Collapse in={!!saveError}>
                    <Alert
                        severity="error"
                        variant="filled"
                        sx={{
                            mb: 3,
                            mt: 2,
                            mx: 2,
                            borderRadius: 2,
                            boxShadow: 3,
                            '& .MuiAlert-message': {
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '1rem',
                            },
                        }}
                        onClose={() => setSaveError(null)}
                    >
                        <Typography fontWeight={500}>{saveError}</Typography>
                    </Alert>
                </Collapse>

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
                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <RecipeTitleDescriptionEditor
                                title={title}
                                description={description}
                                onTitleChange={setTitle}
                                onDescriptionChange={setDescription}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <RecipeImageManager
                                imageUploads={imageUploads}
                                setImageUploads={setImageUploads}
                                images={images}
                                setImages={setImages}
                                isNewRecipe={!!isNewRecipe}
                                title={title}
                                onGenerateAiImage={handleGenerateAiCoverImage}
                                isGeneratingAiImage={isGeneratingAiImage}
                                isMobileDevice={isMobileDevice}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <RecipeMetadataEditor
                                servings={servings}
                                setServings={setServings}
                                timeEstimate={timeEstimate}
                                setTimeEstimate={setTimeEstimate}
                                tags={tags}
                                setTags={setTags}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <IngredientsEditor
                                ingredients={ingredients}
                                setIngredients={setIngredients}
                                onDeleteIngredient={handleDeleteIngredient}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <InstructionsEditor
                                instructions={instructions}
                                setInstructions={setInstructions}
                                ingredients={ingredients}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <NotesEditor notes={notes} setNotes={setNotes} />
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </AppLayout>
    );
};

export default EditRecipePage;
