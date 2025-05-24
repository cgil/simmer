import { FC, useState, useEffect, useCallback, useRef } from 'react';
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
import { ImageUploadState, UploadService } from '../../services/UploadService';
import { dataURIToBlob } from '../../utils/imageUtils';
import EditRecipeHeader from './components/EditRecipeHeader';
import CollectionSelector from './components/CollectionSelector';
import RecipeTitleDescriptionEditor from './components/RecipeTitleDescriptionEditor';
import RecipeImageManager from './components/RecipeImageManager';
import RecipeMetadataEditor from './components/RecipeMetadataEditor';
import IngredientsEditor from './components/IngredientsEditor';
import InstructionsEditor from './components/InstructionsEditor';
import NotesEditor from './components/NotesEditor';
import {
    AiChefDrawer,
    AiChefFab,
    RecipeChanges,
    ApplyChangesAnimation,
} from '../../components/ai-chef';

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

// --- Helper function to handle the upload process for generated images ---
const uploadGeneratedImage = async (
    imageDataUri: string,
    setImageUploads: React.Dispatch<React.SetStateAction<ImageUploadState[]>>,
    setImages: React.Dispatch<React.SetStateAction<string[]>>
): Promise<string | null> => {
    const blob = dataURIToBlob(imageDataUri);
    if (!blob) {
        console.error('Failed to convert Data URI to Blob');
        return null;
    }

    const generatedFile = new File([blob], 'generated_recipe_image.png', {
        type: blob.type,
    });

    const tempId = generateUuidV4();

    // Add temporary uploading state
    setImageUploads((prev) => [
        {
            id: tempId,
            previewUrl: imageDataUri, // Use data URI as preview during upload
            status: 'uploading' as const,
            file: generatedFile, // Keep the file temporarily for potential retry
        },
        ...prev,
    ]);

    try {
        const { permanentUrl } = await UploadService.uploadFileViaFunction(
            generatedFile
        );

        // Update state on success
        setImageUploads((prev) =>
            prev.map((img) =>
                img.id === tempId
                    ? {
                          ...img,
                          status: 'success' as const,
                          permanentUrl,
                          previewUrl: undefined, // Clear preview URL
                          file: undefined, // Clear file
                      }
                    : img
            )
        );

        // Add the permanent URL to the main images array
        setImages((prevImages) => [permanentUrl, ...prevImages]);
        return permanentUrl;
    } catch (err) {
        console.error('Upload of generated image failed:', err);
        // Update state on error
        setImageUploads((prev) =>
            prev.map((img) =>
                img.id === tempId
                    ? {
                          ...img,
                          status: 'error' as const,
                          error:
                              err instanceof Error
                                  ? err.message
                                  : 'Upload failed',
                      }
                    : img
            )
        );
        return null;
    }
};

const EditRecipePage: FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id: routeId } = useParams<{ id?: string }>();
    const collectionsLoaded = useRef(false); // Track if collections have been loaded at least once

    // --- State ---
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle');
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
    const [fetchError, setFetchError] = useState<string | null>(null);
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
    const [collectionsLoading, setCollectionsLoading] =
        useState<boolean>(false);
    const [canEdit, setCanEdit] = useState<boolean>(false);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);

    // AI Chef state
    const [isAiChefDrawerOpen, setIsAiChefDrawerOpen] = useState(false);
    const [isAnimatingChanges, setIsAnimatingChanges] = useState(false);

    // --- Event Handlers (Memoized) ---
    // Define handlers at the top level, before any potential early returns

    // AI Chef handlers
    const handleToggleAiChefDrawer = useCallback(() => {
        setIsAiChefDrawerOpen(!isAiChefDrawerOpen);
    }, [isAiChefDrawerOpen]);

    const handleStartAnimation = useCallback(() => {
        setIsAnimatingChanges(true);
    }, []);

    const handleAnimationComplete = useCallback(() => {
        setIsAnimatingChanges(false);
    }, []);

    const handleApplyAiChanges = useCallback(
        (changes: RecipeChanges) => {
            // Apply AI-suggested changes to the recipe
            if (changes.title) {
                setTitle(changes.title);
            }

            if (changes.description) {
                setDescription(changes.description);
            }

            if (changes.ingredients && changes.ingredients.length > 0) {
                // Merge with existing ingredients to preserve any that weren't changed
                const updatedIngredients = [...ingredients];

                changes.ingredients.forEach((newIngredient) => {
                    const existingIndex = updatedIngredients.findIndex(
                        (ing) => ing.id === newIngredient.id
                    );

                    if (existingIndex >= 0) {
                        // Update existing ingredient
                        updatedIngredients[existingIndex] = {
                            ...updatedIngredients[existingIndex],
                            ...newIngredient,
                        };
                    } else {
                        // Add new ingredient with required fields
                        updatedIngredients.push({
                            ...newIngredient,
                            id: newIngredient.id || generateUuidV4(),
                        });
                    }
                });

                setIngredients(updatedIngredients);
            }

            if (changes.instructions && changes.instructions.length > 0) {
                // Similar merging logic for instructions
                setInstructions((prevInstructions) => {
                    const updatedInstructions = [...prevInstructions];

                    changes.instructions?.forEach((newSection) => {
                        const existingSectionIndex =
                            updatedInstructions.findIndex(
                                (section) => section.id === newSection.id
                            );

                        if (existingSectionIndex >= 0) {
                            // Update existing section
                            updatedInstructions[existingSectionIndex] = {
                                ...updatedInstructions[existingSectionIndex],
                                section_title:
                                    newSection.section_title ||
                                    updatedInstructions[existingSectionIndex]
                                        .section_title,
                                steps: newSection.steps.map((step) => ({
                                    ...step,
                                    timing: step.timing,
                                })),
                            };
                        } else {
                            // Add new section
                            updatedInstructions.push({
                                id: newSection.id || generateUuidV4(),
                                section_title: newSection.section_title || '',
                                steps: newSection.steps.map((step) => ({
                                    id: step.id || generateUuidV4(),
                                    text: step.text,
                                    timing: step.timing,
                                })),
                            });
                        }
                    });

                    return updatedInstructions;
                });
            }

            if (changes.timeEstimate) {
                setTimeEstimate((prevTime) => ({
                    ...prevTime,
                    ...changes.timeEstimate,
                }));
            }

            if (changes.notes) {
                setNotes(
                    changes.notes.map((noteText, index) => ({
                        id: `note-${
                            recipe?.id || 'new'
                        }-${index}-${generateUuidV4()}`,
                        text: noteText,
                    }))
                );
            }

            if (changes.tags) {
                setTags(changes.tags);
            }

            // Close the drawer after applying changes
            setIsAiChefDrawerOpen(false);
        },
        [ingredients, recipe?.id]
    );

    const saveCollections = useCallback(
        async (recipeId: string) => {
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

                const removals = currentDbCollections
                    .filter((id) => !targetSet.has(id))
                    .map((id) =>
                        CollectionService.removeRecipeFromCollection(
                            recipeId,
                            id
                        )
                    );

                const additions = selectedCollections
                    .filter((id) => !currentDbSet.has(id))
                    .map((id) =>
                        CollectionService.addRecipeToCollection(recipeId, id)
                    );

                await Promise.all([...removals, ...additions]);

                setInitialCollectionIds([...selectedCollections]);
                setIsCollectionsChanged(false);
            } catch (err) {
                console.error(
                    `Error updating collections for recipe ${recipeId}:`,
                    err
                );
                setSaveError(
                    'Your Recipe Collection was not updated. Please try again.'
                );
            }
        },
        [selectedCollections]
    );

    const handleSave = useCallback(async () => {
        // Ensure user and recipe exist before proceeding
        if (!user || !recipe) {
            setSaveError(
                user
                    ? 'Unfortunately your recipe did not load.'
                    : 'You must be logged in to save recipes'
            );
            return;
        }

        setIsSaving(true);
        setSaveError(null);

        try {
            const isSavingNewRecipe =
                recipe.id === 'new' || !isValidUuid(recipe.id);

            let finalImages = [...images]; // Start with current successful images

            // AI Image Generation Logic for New Recipes during Save
            if (
                isSavingNewRecipe &&
                title.trim() !== '' &&
                finalImages.length === 0 // Check if there are no existing successful images
            ) {
                try {
                    const generatedImageDataUri = await generateRecipeImage(
                        title,
                        description
                    );
                    if (
                        generatedImageDataUri &&
                        generatedImageDataUri.startsWith('data:image')
                    ) {
                        // Upload the generated image
                        const uploadedUrl = await uploadGeneratedImage(
                            generatedImageDataUri,
                            setImageUploads,
                            setImages // Pass setImages to update the main array
                        );
                        if (uploadedUrl) {
                            finalImages = [uploadedUrl, ...finalImages]; // Prepend the new GCS URL
                        } else {
                            // Upload failed, set error but continue saving without image
                            setSaveError(
                                'Your Recipe was saved, but failed to upload the Sketched image.'
                            );
                        }
                    } else if (generatedImageDataUri) {
                        console.warn(
                            'AI image generation did not return a Data URI.'
                        );
                    } else {
                        console.warn(
                            'AI image generation returned null or failed, saving without image.'
                        );
                    }
                } catch (imgError) {
                    console.error(
                        'Error generating or uploading AI image:',
                        imgError
                    );
                    setSaveError(
                        'Recipe saved, but failed during AI image generation/upload.'
                    );
                }
            }

            // Process ingredients (ensure valid UUIDs)
            const processedIngredients = ingredients
                .filter((ing) => ing.name && ing.name.trim() !== '')
                .map((ing) => ({
                    ...ing,
                    id: ensureUuid(ing.id),
                }));

            // Create mapping for instructions update
            const idMapping = new Map<string, string>();
            ingredients.forEach((originalIng) => {
                const processedIng = processedIngredients.find(
                    (p) =>
                        (isValidUuid(originalIng.id) &&
                            p.id === originalIng.id) ||
                        (!isValidUuid(originalIng.id) &&
                            p.id === ensureUuid(originalIng.id))
                );
                if (processedIng && processedIng.id !== originalIng.id) {
                    idMapping.set(originalIng.id, processedIng.id);
                }
            });

            // Process instructions
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

            // Construct final recipe data
            const updatedRecipeData: Recipe = {
                ...(recipe as Recipe),
                id: recipe.id,
                title,
                description,
                ingredients: processedIngredients,
                instructions: processedInstructions,
                notes: notes.map((note) => note.text),
                time_estimate: timeEstimate,
                tags,
                images: finalImages, // Use the potentially updated image array
                servings,
                user_id: user.id,
                is_public: recipe.is_public ?? true,
            };

            // Save recipe data
            const savedRecipeResult = await RecipeService.saveRecipe(
                updatedRecipeData,
                user.id,
                isSavingNewRecipe
            );

            // Post-Save Operations
            setRecipe(savedRecipeResult);
            setImages(savedRecipeResult.images || []); // Update images from the *saved* result

            if (savedRecipeResult.id && isValidUuid(savedRecipeResult.id)) {
                if (isCollectionsChanged) {
                    try {
                        await saveCollections(savedRecipeResult.id);
                    } catch (collectionError) {
                        console.error(
                            'Error managing recipe collections post-save:',
                            collectionError
                        );
                        if (!saveError) {
                            // Prioritize AI image errors if they occurred
                            setSaveError(
                                'Failed to update recipe collections. Please try again.'
                            );
                        }
                    }
                }
            } else {
                console.error(
                    'Save operation did not return a valid UUID:',
                    savedRecipeResult.id
                );
                if (!saveError) {
                    setSaveError(
                        'Failed to save recipe (invalid ID returned). Please try again.'
                    );
                }
                setIsSaving(false);
                return;
            }

            // Navigate after success
            navigate(`/recipe/${savedRecipeResult.id}`, {
                replace: isSavingNewRecipe,
                state: { recipe: savedRecipeResult },
            });
        } catch (error: unknown) {
            console.error('Error during handleSave:', error);
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
            setIsSaving(false);
        }
    }, [
        user,
        recipe,
        title,
        description,
        ingredients,
        instructions,
        notes,
        timeEstimate,
        tags,
        images,
        servings,
        isCollectionsChanged,
        navigate,
        saveCollections,
    ]);

    const handleCollectionChange = useCallback(
        (event: SelectChangeEvent<string>) => {
            if (!isOwner) return;
            const newCollectionId = event.target.value;
            setSelectedCollection(newCollectionId);

            if (newCollectionId === ALL_RECIPES_ID) {
                setSelectedCollections([]);
            } else {
                setSelectedCollections([newCollectionId]);
            }
        },
        [isOwner]
    );

    const handleGoBack = useCallback(() => {
        if (location.state?.isNew === true) {
            navigate('/recipe/new');
        } else if (location.state?.from) {
            navigate(location.state.from);
        } else if (recipe && recipe.id && recipe.id !== 'new') {
            navigate(`/recipe/${recipe.id}`);
        } else {
            navigate('/');
        }
    }, [location.state, recipe, navigate]);

    const handleGenerateAiCoverImage = useCallback(async () => {
        if (!title.trim()) {
            setSaveError('Please enter a recipe title first.');
            return;
        }

        setIsGeneratingAiImage(true);
        setSaveError(null);

        try {
            const result = await generateRecipeImage(title, description);

            if (result && result.startsWith('data:image')) {
                // We have a data URI, now upload it
                const uploadedUrl = await uploadGeneratedImage(
                    result,
                    setImageUploads,
                    setImages
                );
                if (!uploadedUrl) {
                    // uploadGeneratedImage handles setting error state internally
                    setSaveError(
                        'Failed to upload generated image. Please try again or add your own image.'
                    );
                }
                // Success is handled within uploadGeneratedImage
            } else if (result && result.startsWith('http')) {
                // Unexpected: API returned a direct URL?
                console.warn(
                    'AI image generation unexpectedly returned an HTTP URL directly:',
                    result
                );
                // Handle it like a successful upload
                const newImageUpload: ImageUploadState = {
                    id: generateUuidV4(),
                    status: 'success' as const,
                    permanentUrl: result,
                };
                setImageUploads((prevUploads) => [
                    newImageUpload,
                    ...prevUploads,
                ]);
                setImages((prevImages) => [result, ...prevImages]);
            } else {
                setSaveError(
                    'Failed to generate AI image or invalid format returned. Try again or add your own image.'
                );
            }
        } catch (error: unknown) {
            console.error('Error during AI image generation step:', error);
            const message =
                error instanceof Error ? error.message : 'Unknown error';
            setSaveError(
                `Error generating AI image: ${message}. Please try again.`
            );
        } finally {
            setIsGeneratingAiImage(false);
        }
    }, [title, description, setImageUploads, setImages]); // Added state setters as dependencies

    const handleDeleteIngredient = useCallback((ingredientId: string) => {
        setIngredients((prevIngredients) =>
            prevIngredients.filter((ing) => ing.id !== ingredientId)
        );

        const mentionRegex = new RegExp(
            `\\s*@\\[[^\\]]+\\]\\(${ingredientId}\\)\\s*`,
            'g'
        );

        setInstructions((prevInstructions) =>
            prevInstructions.map((section) => ({
                ...section,
                steps: section.steps.map((step) => ({
                    ...step,
                    text: step.text
                        .replace(mentionRegex, ' ')
                        .replace(/\s{2,}/g, ' ')
                        .trim(),
                })),
            }))
        );
    }, []);

    // Memoized function to load collections data
    const loadCollectionsData = useCallback(async () => {
        // Ensure we have a valid, existing recipe ID and user
        if (!user || !recipe?.id || !isValidUuid(recipe.id)) {
            setAvailableCollections([]);
            setInitialCollectionIds([]);
            setSelectedCollections([]);
            collectionsLoaded.current = true; // Mark as loaded/attempted even if skipped
            return;
        }

        const recipeIdToLoad = recipe.id; // Capture the valid ID

        setCollectionsLoading(true);
        let available: CollectionItem[] = [];
        let associatedIds: string[] = [];

        try {
            // Fetch available collections for the user
            available = await CollectionService.getCollectionItems(user.id);
            setAvailableCollections(available);

            // Fetch collections this specific recipe belongs to
            const recipeCollections =
                await CollectionService.getCollectionsForRecipe(recipeIdToLoad);
            associatedIds = recipeCollections.map((c) => c.id);
        } catch (err) {
            console.error(
                `Error loading collections data for recipe ${recipeIdToLoad}:`,
                err
            );
            // Reset on error
            setAvailableCollections([]);
            associatedIds = [];
        } finally {
            setInitialCollectionIds(associatedIds);
            setSelectedCollections(associatedIds);
            // Set the dropdown selection based on fetched data
            if (associatedIds.length > 0) {
                setSelectedCollection(associatedIds[0]);
            } else {
                setSelectedCollection(ALL_RECIPES_ID);
            }
            setCollectionsLoading(false);
            collectionsLoaded.current = true; // Mark collections as loaded
        }
    }, [user, recipe?.id]); // Depend on user and stable recipe ID

    // --- Effects ---

    // Effect to initiate recipe loading/setup
    useEffect(() => {
        if (fetchStatus !== 'idle') {
            return; // Don't restart fetch if already in progress or done
        }

        const stateRecipe = location.state?.recipe as Recipe | undefined;

        // 1. Recipe from location state
        if (stateRecipe) {
            const validatedIngredients = (stateRecipe.ingredients || []).map(
                (ing) => ({
                    ...ing,
                    id: isValidUuid(ing.id) ? ing.id : generateUuidV4(),
                })
            );
            setRecipe({ ...stateRecipe, ingredients: validatedIngredients });
            setFetchStatus('success');
            setCanEdit(true); // Assume editable if passed via state for now
            setIsOwner(!!user && stateRecipe.user_id === user.id);
            return;
        }

        // 2. New recipe template
        if (routeId === 'new') {
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
            setFetchStatus('success');
            setCanEdit(true);
            setIsOwner(true);
            return;
        }

        // 3. Fetch existing recipe by ID
        if (routeId && isValidUuid(routeId)) {
            if (!user) {
                return;
            }

            const fetchRecipeForEdit = async () => {
                setFetchStatus('loading');
                setFetchError(null);
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
                            setCanEdit(true);
                            setIsOwner(fetchedRecipe.user_id === user.id);
                            setFetchStatus('success');
                        } else {
                            console.warn(
                                `User lacks permission to edit recipe ${routeId}. Redirecting.`
                            );
                            setFetchError(
                                "You don't have permission to edit this recipe."
                            );
                            setFetchStatus('error');
                            navigate(`/recipe/${routeId}`, {
                                state: {
                                    error: "You don't have permission to edit this recipe.",
                                },
                                replace: true,
                            });
                        }
                    } else {
                        console.error(`Recipe not found for edit: ${routeId}`);
                        setFetchError('Recipe not found.');
                        setFetchStatus('error');
                        navigate('/', {
                            state: { error: 'Recipe not found.' },
                            replace: true,
                        });
                    }
                } catch (err) {
                    console.error(
                        `Error fetching recipe ${routeId} for edit:`,
                        err
                    );
                    setFetchError('Failed to load recipe for editing.');
                    setFetchStatus('error');
                    navigate('/', {
                        state: { error: 'Failed to load recipe for editing.' },
                        replace: true,
                    });
                }
            };

            fetchRecipeForEdit();
        } else if (routeId && routeId !== 'new') {
            console.error(
                'EditRecipePage loaded with invalid routeId:',
                routeId
            );
            setFetchError('Invalid recipe ID.');
            setFetchStatus('error');
            navigate('/', { replace: true });
        }
    }, [fetchStatus, routeId, user, location.state, navigate]);

    // Effect to populate form fields when recipe is successfully loaded/set
    useEffect(() => {
        if (recipe && fetchStatus === 'success') {
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
            const initialImageUploads = (recipe.images || []).map((url) => ({
                id: generateUuidV4(),
                status: 'success' as const,
                permanentUrl: url,
            }));
            setImageUploads(initialImageUploads);
            setImages(recipe.images || []);
        }
    }, [recipe, fetchStatus]);

    // Effect for mobile device check
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

    // Load collections data - runs when user is available and recipe fetch is successful
    useEffect(() => {
        if (
            user &&
            fetchStatus === 'success' &&
            recipe &&
            !collectionsLoaded.current
        ) {
            loadCollectionsData();
        }
    }, [user, fetchStatus, recipe, loadCollectionsData]); // Depends on fetch status and user/recipe availability

    // Effect to handle changes in selected collections vs initial
    useEffect(() => {
        if (!recipe || fetchStatus !== 'success') return;

        const initialSet = new Set(initialCollectionIds);
        const selectedSet = new Set(selectedCollections);

        let changed = initialSet.size !== selectedSet.size;
        if (!changed) {
            for (const id of initialSet) {
                if (!selectedSet.has(id)) {
                    changed = true;
                    break;
                }
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
    }, [selectedCollections, initialCollectionIds, recipe, fetchStatus]);

    // --- Loading / Error States ---
    const isLoading = fetchStatus === 'loading' || fetchStatus === 'idle';

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
                        {fetchStatus === 'loading'
                            ? 'Loading recipe...'
                            : 'Initializing...'}
                    </Typography>
                </Box>
            </AppLayout>
        );
    }

    if (fetchStatus === 'error') {
        return (
            <AppLayout>
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">
                        {fetchError || 'An unexpected error occurred.'}
                    </Alert>
                </Box>
            </AppLayout>
        );
    }

    // At this point, fetchStatus must be 'success'
    if (!recipe || !canEdit) {
        return (
            <AppLayout>
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">
                        Could not load recipe for editing or permission denied.
                    </Alert>
                </Box>
            </AppLayout>
        );
    }

    // Determine if this is a new recipe (must be done after recipe is loaded)
    const isNewRecipe = recipe.id === 'new' || !isValidUuid(recipe.id);

    // --- Render Logic ---
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
            {/* Animation overlay */}
            <ApplyChangesAnimation
                isAnimating={isAnimatingChanges}
                onAnimationComplete={handleAnimationComplete}
            />

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
                    {isOwner && (
                        <CollectionSelector
                            selectedCollection={selectedCollection}
                            onCollectionChange={handleCollectionChange}
                            availableCollections={availableCollections}
                            isOwner={isOwner}
                            isLoading={collectionsLoading} // Use specific loading state for collections
                            allRecipesId={ALL_RECIPES_ID}
                        />
                    )}
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
                    {/* Main content grid - relies on recipe being loaded */}
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
                                isNewRecipe={isNewRecipe}
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

                {/* AI Chef functionality components */}
                {canEdit && (
                    <>
                        <AiChefFab
                            onClick={handleToggleAiChefDrawer}
                            isOpen={isAiChefDrawerOpen}
                        />

                        <AiChefDrawer
                            open={isAiChefDrawerOpen}
                            onClose={() => setIsAiChefDrawerOpen(false)}
                            onOpen={() => setIsAiChefDrawerOpen(true)}
                            onApplyChanges={handleApplyAiChanges}
                            onAnimationStart={handleStartAnimation}
                            currentRecipe={{
                                id: recipe.id,
                                title,
                                description,
                                ingredients,
                                instructions,
                                notes: notes.map((note) => note.text),
                                time_estimate: timeEstimate,
                                tags,
                                images,
                                servings,
                                user_id: user?.id || '',
                                is_public: recipe.is_public ?? true,
                                is_shared: recipe.is_shared ?? false,
                                shared_with_me: recipe.shared_with_me ?? false,
                                access_level: recipe.access_level,
                            }}
                        />
                    </>
                )}
            </Box>
        </AppLayout>
    );
};

export default EditRecipePage;
