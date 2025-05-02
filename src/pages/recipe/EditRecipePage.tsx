import { FC, useState, useRef, DragEvent, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    TextField,
    Grid,
    IconButton,
    Stack,
    Menu,
    MenuItem,
    Divider,
    Alert,
    Collapse,
    Select,
    FormControl,
    SelectChangeEvent,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FontAwesomeIcon from '../../components/icons/FontAwesomeIcon';
import CarrotPlusIcon from '../../components/icons/CarrotPlusIcon';
import AppLayout from '../../components/layout/AppLayout';
import {
    Recipe,
    TimeEstimate,
    Ingredient,
    InstructionSection,
    Step,
} from '../../types/recipe';
import { CollectionItem, ALL_RECIPES_ID } from '../../types/collection';
import TimeEstimateForm from './components/TimeEstimateForm';
import ServingSizeForm from './components/ServingSizeForm';
import TagInput from './components/TagInput';
import ImageIcon from '@mui/icons-material/Image';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotebookButton from '../../components/common/NotebookButton';
import IngredientReferenceInput from './components/IngredientReferenceInput';
import { convertRecipeIngredientMentions } from '../../utils/ingredientMentions';
import { useAuth } from '../../context/AuthContext';
import { RecipeService } from '../../services/RecipeService';
import { CollectionService } from '../../services/CollectionService';
import { generateUuidV4, ensureUuid, isValidUuid } from '../../utils/uuid';
import { generateRecipeImage } from '../../lib/api';
import { UploadService, ImageUploadState } from '../../services/UploadService';

// Define allowed image types for validation
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
];

// Helper function to convert base64 string and content type to a File object
function base64ToFile(
    base64: string,
    contentType: string,
    filename: string
): File {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    return new File([blob], filename, { type: contentType });
}

const EditRecipePage: FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id: routeId } = useParams<{ id?: string }>();

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [activeStepIndex, setActiveStepIndex] = useState<
        [number, number] | null
    >(null);
    const [cursorPositions, setCursorPositions] = useState<
        Record<string, number>
    >({});
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
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

    // Clean up object URLs when component unmounts or previews change
    useEffect(() => {
        return () => {
            // Clean up any preview URLs to prevent memory leaks
            imageUploads.forEach((img) => {
                if (img.previewUrl) {
                    URL.revokeObjectURL(img.previewUrl);
                }
            });
        };
    }, [imageUploads]);

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

    const handleIngredientClick = (ingredient: Recipe['ingredients'][0]) => {
        if (activeStepIndex) {
            const [sectionIndex, stepIndex] = activeStepIndex;
            const newInstructions = [...instructions];
            const currentStep = newInstructions[sectionIndex].steps[stepIndex];
            const ingredientId = isValidUuid(ingredient.id)
                ? ingredient.id
                : ensureUuid(ingredient.id);
            const textToInsert = `@[${ingredient.name}](${ingredientId})`;

            const stepId = `${sectionIndex}-${stepIndex}`;
            const originalCursorPos =
                cursorPositions[stepId] ?? currentStep.text.length;

            // Adjust cursor position: if it falls inside an existing mention, move it to the end of that mention + 1 (space)
            let cursorPos = originalCursorPos;
            const mentionRegex = /@\[[^\]]+\]\([^)]*\)/g;
            let match: RegExpExecArray | null;
            while ((match = mentionRegex.exec(currentStep.text)) !== null) {
                const start = match.index;
                const end = start + match[0].length; // end is exclusive
                if (cursorPos > start && cursorPos < end) {
                    // Cursor is inside an existing mention
                    cursorPos = Math.min(end + 1, currentStep.text.length);
                    break;
                }
            }

            const newText =
                currentStep.text.substring(0, cursorPos) +
                textToInsert +
                ' ' +
                currentStep.text.substring(cursorPos);

            newInstructions[sectionIndex].steps[stepIndex] = {
                ...currentStep,
                text: newText,
            };

            setInstructions(newInstructions);
            setAnchorEl(null);
        }
    };

    const handleAddIngredient = () => {
        const newIngredient: Ingredient = {
            id: generateUuidV4(),
            name: '',
            quantity: null,
            unit: null,
            notes: '',
            position: (ingredients.length + 1) * 1000,
        };
        setIngredients([...ingredients, newIngredient]);
    };

    const handleAddStep = (sectionIndex: number) => {
        const newInstructions = [...instructions];
        if (!newInstructions[sectionIndex]) return;

        const newStep: Step = {
            id: generateUuidV4(),
            text: '',
            timing: null,
            position: (newInstructions[sectionIndex].steps.length + 1) * 1000,
        };

        newInstructions[sectionIndex].steps.push(newStep);
        setInstructions(newInstructions);

        setTimeout(() => {
            const newStepIndex = newInstructions[sectionIndex].steps.length - 1;
            setActiveStepIndex([sectionIndex, newStepIndex]);
        }, 100);
    };

    const handleAddSection = () => {
        const newSection: InstructionSection = {
            id: generateUuidV4(),
            section_title: 'New Section',
            position: (instructions.length + 1) * 1000,
            steps: [
                {
                    id: generateUuidV4(),
                    text: '',
                    timing: null,
                    position: 1000,
                },
            ],
        };
        setInstructions([...instructions, newSection]);

        setTimeout(() => {
            const newSectionIndex = instructions.length;
            setActiveStepIndex([newSectionIndex, 0]);
        }, 100);
    };

    const handleAddNote = () => {
        setNotes([
            ...notes,
            {
                id: generateUuidV4(),
                text: '',
            },
        ]);
    };

    const handleDeleteNote = (noteId: string) => {
        setNotes(notes.filter((note) => note.id !== noteId));
    };

    const handleNoteChange = (noteId: string, value: string) => {
        setNotes(
            notes.map((note) =>
                note.id === noteId ? { ...note, text: value } : note
            )
        );
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

    const handleDeleteSection = (sectionIndex: number) => {
        const newInstructions = instructions.filter(
            (_, idx) => idx !== sectionIndex
        );
        setInstructions(newInstructions);
    };

    const handleDeleteStep = (sectionIndex: number, stepIndex: number) => {
        const newInstructions = [...instructions];
        if (!newInstructions[sectionIndex]) return;

        newInstructions[sectionIndex].steps = newInstructions[
            sectionIndex
        ].steps.filter((_, idx) => idx !== stepIndex);

        setInstructions(newInstructions);
    };

    const handleMoveImage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= imageUploads.length) return;

        // Move the image in imageUploads array
        const newImageUploads = [...imageUploads];
        const [movedImage] = newImageUploads.splice(fromIndex, 1);
        newImageUploads.splice(toIndex, 0, movedImage);
        setImageUploads(newImageUploads);

        // Update images array with permanent URLs
        const permanentUrls = newImageUploads
            .filter((img) => img.status === 'success' && img.permanentUrl)
            .map((img) => img.permanentUrl as string);
        setImages(permanentUrls);
    };

    const handleImageUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        // Create an array to store the new uploads
        const newUploads: ImageUploadState[] = [];

        // Process each file
        Array.from(files).forEach((file) => {
            // Validate file type
            if (
                ![
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                    'image/gif',
                ].includes(file.type)
            ) {
                console.warn(
                    `Skipping unsupported file type: ${file.name} (${file.type})`
                );
                return;
            }

            // Validate file size (5MB limit example)
            if (file.size > 5 * 1024 * 1024) {
                console.warn(
                    `Skipping large file: ${file.name} (${(
                        file.size /
                        1024 /
                        1024
                    ).toFixed(2)}MB)`
                );
                return;
            }

            // Create a unique ID and preview URL for this upload
            const newImageId = generateUuidV4();
            const previewUrl = URL.createObjectURL(file);

            // Add to the array of new uploads
            newUploads.push({
                id: newImageId,
                file,
                previewUrl,
                status: 'pending' as const,
            });
        });

        if (newUploads.length === 0) return;

        // Add all new uploads to state
        setImageUploads((prevUploads) => [...prevUploads, ...newUploads]);

        // Start the upload process for each new upload
        newUploads.forEach((upload) => {
            if (upload.file) {
                startImageUploadProcess(upload.id, upload.file);
            }
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleImageUpload(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleStepChange = (
        sectionIndex: number,
        stepIndex: number,
        value: string
    ) => {
        const newInstructions = [...instructions];
        if (!newInstructions[sectionIndex]?.steps[stepIndex]) return;
        newInstructions[sectionIndex].steps[stepIndex] = {
            ...newInstructions[sectionIndex].steps[stepIndex],
            text: value,
        };
        setInstructions(newInstructions);
    };

    const handleSectionTitleChange = (
        sectionIndex: number,
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const newInstructions = [...instructions];
        if (!newInstructions[sectionIndex]) return;
        newInstructions[sectionIndex].section_title = e.target.value;
        setInstructions(newInstructions);
    };

    const handleCursorPositionChange = (
        sectionIndex: number,
        stepIndex: number,
        position: number
    ) => {
        setCursorPositions((prev) => ({
            ...prev,
            [`${sectionIndex}-${stepIndex}`]: position,
        }));
    };

    const handleIngredientNameChange = (index: number, value: string) => {
        const newIngredients = [...ingredients];
        if (!newIngredients[index]) return;
        newIngredients[index] = { ...newIngredients[index], name: value };
        setIngredients(newIngredients);
    };

    const handleIngredientQuantityChange = (index: number, value: string) => {
        const newIngredients = [...ingredients];
        if (!newIngredients[index]) return;
        newIngredients[index] = {
            ...newIngredients[index],
            quantity: value === '' ? null : parseFloat(value),
        };
        setIngredients(newIngredients);
    };

    const handleIngredientUnitChange = (index: number, value: string) => {
        const newIngredients = [...ingredients];
        if (!newIngredients[index]) return;
        newIngredients[index] = {
            ...newIngredients[index],
            unit: value === '' ? null : value,
        };
        setIngredients(newIngredients);
    };

    const handleAddImageClick = async () => {
        if (isMobileDevice) {
            galleryInputRef.current?.click();
        } else {
            fileInputRef.current?.click();
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
            // 1. Call the AI image generation function
            const result = await generateRecipeImage(title, description);

            // 2. Check if the result is a valid data URI string
            if (typeof result === 'string' && result.startsWith('data:image')) {
                // 3. Parse the data URI
                const commaIndex = result.indexOf(',');
                if (commaIndex === -1) {
                    throw new Error(
                        'Invalid data URI format returned from AI generation'
                    );
                }
                const metaPart = result.substring(5, commaIndex);
                const base64Data = result.substring(commaIndex + 1);
                const contentType = metaPart.split(';')[0] || 'image/jpeg'; // Default if missing

                // 4. Validate extracted content type
                if (!ALLOWED_IMAGE_TYPES.includes(contentType.toLowerCase())) {
                    throw new Error(
                        `Unsupported image type generated: ${contentType}`
                    );
                }

                // 5. Convert base64 to File
                const filename = `ai-generated-${generateUuidV4()}.${
                    contentType.split('/')[1] || 'jpeg'
                }`;
                const aiImageFile = base64ToFile(
                    base64Data,
                    contentType,
                    filename
                );

                // 6. Prepare for upload management
                const newImageId = generateUuidV4();
                const previewUrl = URL.createObjectURL(aiImageFile);

                // 7. Add to imageUploads state
                const newUpload: ImageUploadState = {
                    id: newImageId,
                    file: aiImageFile,
                    previewUrl,
                    status: 'pending' as const,
                };
                // Prepend the new image so it appears first
                setImageUploads((prevUploads) => [newUpload, ...prevUploads]);

                // 8. Start the actual upload process via Edge function
                // Use await here to ensure the process starts before potentially exiting the try block
                await startImageUploadProcess(newImageId, aiImageFile);
            } else {
                // Handle cases where the result is not a data URI or is null/undefined
                setSaveError(
                    'Failed to generate AI image or invalid format returned. Try again or add your own image.'
                );
            }
        } catch (error: unknown) {
            console.error(
                'Error during AI image generation or upload process:',
                error
            );
            const message =
                error instanceof Error ? error.message : 'Unknown error';
            setSaveError(
                `Error generating AI image: ${message}. Please try again.`
            );
        } finally {
            setIsGeneratingAiImage(false);
        }
    };

    // Helper function to initiate and manage the upload steps for a single image
    const startImageUploadProcess = async (imageId: string, file: File) => {
        try {
            // 1. Set status to 'uploading'
            setImageUploads((prev) =>
                prev.map((img) =>
                    img.id === imageId
                        ? {
                              ...img,
                              status: 'uploading' as const,
                              error: undefined,
                          }
                        : img
                )
            );

            // 2. Upload file via Edge function
            const { permanentUrl } = await UploadService.uploadFileViaFunction(
                file
            );

            // 3. Update state on success
            setImageUploads((prev) => {
                const updatedUploads = prev.map((img) =>
                    img.id === imageId
                        ? {
                              ...img,
                              status: 'success' as const,
                              permanentUrl,
                              file: undefined, // Remove file object after success to free memory
                          }
                        : img
                );

                // Also update the images array used for saving
                const permanentUrls = updatedUploads
                    .filter(
                        (img) => img.status === 'success' && img.permanentUrl
                    )
                    .map((img) => img.permanentUrl as string);
                setImages(permanentUrls);

                return updatedUploads;
            });
        } catch (err) {
            console.error(`Upload failed for image ${imageId}:`, err);
            // 5. Update state on error
            setImageUploads((prev) =>
                prev.map((img) =>
                    img.id === imageId
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
        }
    };

    // Function to allow retrying a failed upload
    const handleRetryUpload = (imageId: string) => {
        const imageToRetry = imageUploads.find((img) => img.id === imageId);
        if (imageToRetry?.file && imageToRetry.status === 'error') {
            startImageUploadProcess(imageId, imageToRetry.file);
        } else {
            console.warn(
                `Could not retry upload for image ID: ${imageId}. Invalid state or file missing.`
            );
        }
    };

    // Add function to delete an image by ID
    const handleDeleteImage = (imageId: string) => {
        setImageUploads((prevUploads) => {
            // Find the image to delete
            const imageToDelete = prevUploads.find((img) => img.id === imageId);

            // If the image has a preview URL, revoke it to free memory
            if (imageToDelete?.previewUrl) {
                URL.revokeObjectURL(imageToDelete.previewUrl);
            }

            // Filter out the deleted image
            const updatedUploads = prevUploads.filter(
                (img) => img.id !== imageId
            );

            // Update the images array with permanent URLs
            const permanentUrls = updatedUploads
                .filter((img) => img.status === 'success' && img.permanentUrl)
                .map((img) => img.permanentUrl as string);
            setImages(permanentUrls);

            return updatedUploads;
        });
    };

    const headerContent = (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
            }}
        >
            <Box
                onClick={handleGoBack}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    color: 'text.primary',
                    '&:hover': { color: 'primary.main' },
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
                startIcon={isSaving ? null : <SaveIcon />}
                onClick={handleSave}
                disabled={isSaving || isLoading}
                sx={{ height: 42, px: 3, minWidth: 140 }}
            >
                {isSaving ? 'Saving...' : 'Save Recipe'}
            </Button>
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
                    <FormControl
                        sx={{
                            minWidth: 220,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'background.paper' },
                            },
                        }}
                        size="small"
                    >
                        <Tooltip
                            title={
                                !isOwner
                                    ? 'Only the recipe owner can change which collection this recipe belongs to'
                                    : ''
                            }
                            placement="top"
                            arrow
                        >
                            <div>
                                <Select
                                    value={selectedCollection}
                                    onChange={handleCollectionChange}
                                    displayEmpty
                                    inputProps={{
                                        'aria-label': 'Select collection',
                                    }}
                                    disabled={!isOwner || isLoading}
                                    sx={{
                                        height: 42,
                                        fontFamily: "'Inter', sans-serif",
                                        '& .MuiSelect-select': {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                        },
                                        ...(!isOwner && {
                                            opacity: 0.7,
                                            cursor: 'not-allowed',
                                        }),
                                    }}
                                >
                                    <MenuItem
                                        key={ALL_RECIPES_ID}
                                        value={ALL_RECIPES_ID}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        <span style={{ fontSize: '1.2rem' }}>
                                            📚
                                        </span>{' '}
                                        All Recipes
                                    </MenuItem>
                                    {availableCollections
                                        .filter(
                                            (collection) =>
                                                collection.id !== ALL_RECIPES_ID
                                        )
                                        .sort((a, b) =>
                                            a.name.localeCompare(b.name)
                                        )
                                        .map((collection) => (
                                            <MenuItem
                                                key={collection.id}
                                                value={collection.id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    fontFamily:
                                                        "'Inter', sans-serif",
                                                }}
                                            >
                                                {collection.emoji && (
                                                    <span
                                                        style={{
                                                            fontSize: '1.2rem',
                                                        }}
                                                    >
                                                        {collection.emoji}
                                                    </span>
                                                )}
                                                {collection.name}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </div>
                        </Tooltip>
                    </FormControl>
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
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: 'background.paper',
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    boxShadow: `0 1px 2px rgba(0,0,0,0.03), 0 4px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.9)`,
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
                                        fontFamily:
                                            "'Inter', system-ui, sans-serif",
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
                                            fontSize: {
                                                xs: '2.5rem',
                                                sm: '3rem',
                                            },
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
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
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
                        </Grid>

                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: 'background.paper',
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    boxShadow: `0 1px 2px rgba(0,0,0,0.03), 0 4px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.9)`,
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
                                    <ImageIcon /> Recipe Images
                                </Typography>

                                {/* AI Image Generation Button - Show only for new recipes with no images */}
                                {isNewRecipe &&
                                    images.length === 0 &&
                                    title.trim() && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: { xs: 12, sm: 16 },
                                                right: { xs: 12, sm: 16 },
                                                zIndex: 2,
                                            }}
                                        >
                                            <Tooltip title="">
                                                <Button
                                                    onClick={
                                                        handleGenerateAiCoverImage
                                                    }
                                                    variant="outlined"
                                                    size="small"
                                                    disabled={
                                                        isGeneratingAiImage
                                                    }
                                                    startIcon={
                                                        isGeneratingAiImage ? (
                                                            <CircularProgress
                                                                size={16}
                                                                color="inherit"
                                                            />
                                                        ) : (
                                                            <AutoAwesomeIcon fontSize="small" />
                                                        )
                                                    }
                                                    sx={{
                                                        fontFamily:
                                                            "'Inter', sans-serif",
                                                        borderRadius: 1,
                                                        textTransform: 'none',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        padding: '4px 10px',
                                                        borderColor: 'divider',
                                                        color: 'text.primary',
                                                        bgcolor:
                                                            'background.paper',
                                                        boxShadow: 'none',
                                                        '&:hover': {
                                                            borderColor:
                                                                'divider',
                                                            bgcolor:
                                                                'action.hover',
                                                            color: 'text.primary',
                                                        },
                                                    }}
                                                >
                                                    {isGeneratingAiImage
                                                        ? 'Sketching...'
                                                        : 'Sketch It'}
                                                </Button>
                                            </Tooltip>
                                        </Box>
                                    )}

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
                                        ></Box>
                                    )}
                                    {imageUploads.map((imageState, index) => (
                                        <Box
                                            key={imageState.id}
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
                                            {/* Show image based on status */}
                                            {imageState.status === 'success' ? (
                                                <Box
                                                    component="img"
                                                    src={
                                                        imageState.permanentUrl
                                                    }
                                                    alt={`Recipe image ${
                                                        index + 1
                                                    }`}
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ) : imageState.previewUrl ? (
                                                <Box
                                                    component="img"
                                                    src={imageState.previewUrl}
                                                    alt={`Recipe image ${
                                                        index + 1
                                                    } (preview)`}
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        opacity:
                                                            imageState.status ===
                                                            'uploading'
                                                                ? 0.7
                                                                : 1,
                                                    }}
                                                />
                                            ) : (
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                        bgcolor:
                                                            'background.paper',
                                                    }}
                                                >
                                                    <ImageIcon
                                                        sx={{
                                                            fontSize: 40,
                                                            color: 'text.disabled',
                                                        }}
                                                    />
                                                </Box>
                                            )}

                                            {/* Loading indicator */}
                                            {imageState.status ===
                                                'uploading' && (
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                        bgcolor:
                                                            'rgba(255, 255, 255, 0.5)',
                                                    }}
                                                >
                                                    <CircularProgress
                                                        size={40}
                                                    />
                                                </Box>
                                            )}

                                            {/* Error overlay */}
                                            {imageState.status === 'error' && (
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                        bgcolor:
                                                            'rgba(255, 0, 0, 0.7)',
                                                        color: 'white',
                                                        p: 2,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            mb: 2,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        Upload Failed
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            mb: 2,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {imageState.error ||
                                                            'Unknown error'}
                                                    </Typography>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={() =>
                                                            handleRetryUpload(
                                                                imageState.id
                                                            )
                                                        }
                                                        sx={{
                                                            bgcolor: 'white',
                                                            color: 'error.main',
                                                        }}
                                                    >
                                                        Retry
                                                    </Button>
                                                </Box>
                                            )}

                                            {/* Action buttons */}
                                            {(imageState.status === 'success' ||
                                                imageState.status ===
                                                    'pending') && (
                                                <Box
                                                    className="image-actions"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        bgcolor:
                                                            'rgba(0, 0, 0, 0.3)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
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
                                                        onClick={() =>
                                                            handleDeleteImage(
                                                                imageState.id
                                                            )
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
                                                            index ===
                                                            imageUploads.length -
                                                                1
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
                                            )}
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
                                            position: 'relative',
                                        }}
                                        onClick={handleAddImageClick}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) =>
                                                handleImageUpload(
                                                    e.target.files
                                                )
                                            }
                                            style={{ display: 'none' }}
                                        />
                                        <input
                                            ref={galleryInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) =>
                                                handleImageUpload(
                                                    e.target.files
                                                )
                                            }
                                            style={{ display: 'none' }}
                                            aria-label="Choose photos from gallery or camera"
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
                                                Click to{' '}
                                                {isMobileDevice
                                                    ? 'add photos from gallery or camera'
                                                    : 'add or drag images'}{' '}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Stack spacing={3}>
                                <ServingSizeForm
                                    servings={servings}
                                    onChange={setServings}
                                />
                                <TimeEstimateForm
                                    timeEstimate={timeEstimate}
                                    onChange={setTimeEstimate}
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TagInput tags={tags} onChange={setTags} />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: 'background.paper',
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    boxShadow: `0 1px 2px rgba(0,0,0,0.03), 0 4px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.9)`,
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
                                    {ingredients.map((ingredient, index) => (
                                        <Box
                                            key={ingredient.id}
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
                                                size="small"
                                                placeholder="amount"
                                                value={
                                                    ingredient.quantity ?? ''
                                                }
                                                onChange={(e) =>
                                                    handleIngredientQuantityChange(
                                                        index,
                                                        e.target.value
                                                    )
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
                                                            { opacity: 1 },
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
                                                value={ingredient.unit || ''}
                                                onChange={(e) =>
                                                    handleIngredientUnitChange(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
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
                                                value={ingredient.name}
                                                onChange={(e) =>
                                                    handleIngredientNameChange(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
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

                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: 'background.paper',
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    boxShadow: `0 1px 2px rgba(0,0,0,0.03), 0 4px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.9)`,
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
                                                key={
                                                    section.id ||
                                                    `section-${sectionIndex}`
                                                }
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
                                                                key={
                                                                    step.id ||
                                                                    `step-${sectionIndex}-${stepIndex}`
                                                                }
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
                                                                    <IngredientReferenceInput
                                                                        value={
                                                                            step.text
                                                                        }
                                                                        onChange={(
                                                                            value
                                                                        ) =>
                                                                            handleStepChange(
                                                                                sectionIndex,
                                                                                stepIndex,
                                                                                value
                                                                            )
                                                                        }
                                                                        ingredients={
                                                                            ingredients
                                                                        }
                                                                        placeholder="Describe step (use @ for ingredients)..."
                                                                        onCursorPositionChange={(
                                                                            position
                                                                        ) =>
                                                                            handleCursorPositionChange(
                                                                                sectionIndex,
                                                                                stepIndex,
                                                                                position
                                                                            )
                                                                        }
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
                                                                            ) => {
                                                                                setActiveStepIndex(
                                                                                    [
                                                                                        sectionIndex,
                                                                                        stepIndex,
                                                                                    ]
                                                                                );
                                                                                setAnchorEl(
                                                                                    e.currentTarget
                                                                                );
                                                                            }}
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

                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    bgcolor: 'background.paper',
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 1,
                                    boxShadow: `0 1px 2px rgba(0,0,0,0.03), 0 4px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.9)`,
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
                                    {notes.map((note) => (
                                        <Box
                                            key={note.id}
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
                                                value={note.text}
                                                variant="standard"
                                                onChange={(e) =>
                                                    handleNoteChange(
                                                        note.id,
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
                                                    handleDeleteNote(note.id)
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
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                    sx: {
                        maxHeight: 300,
                        width: 'auto',
                        minWidth: 200,
                        maxWidth: 400,
                    },
                }}
            >
                {ingredients
                    .filter((ing) => ing.name?.trim())
                    .map((ingredient) => (
                        <MenuItem
                            key={ingredient.id}
                            onClick={() => handleIngredientClick(ingredient)}
                            sx={{
                                display: 'flex',
                                width: '100%',
                                '&:hover': { bgcolor: 'primary.lighter' },
                            }}
                        >
                            <Typography
                                noWrap
                                sx={{
                                    flexGrow: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {ingredient.name}
                            </Typography>
                            {ingredient.quantity !== null &&
                                ingredient.quantity !== undefined && (
                                    <Typography
                                        component="span"
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ ml: 1, flexShrink: 0 }}
                                    >
                                        ({ingredient.quantity}
                                        {ingredient.unit
                                            ? ' ' + ingredient.unit
                                            : ''}
                                        )
                                    </Typography>
                                )}
                        </MenuItem>
                    ))}
            </Menu>
        </AppLayout>
    );
};

export default EditRecipePage;
