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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
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
            setImages(recipe.images || []);
            setServings(recipe.servings || 2);

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

            // Determine if saving a new recipe based on state
            // A recipe is new if its ID is 'new' OR if it's not a valid UUID (imported case)
            const isSavingNewRecipe =
                recipe.id === 'new' || !isValidUuid(recipe.id);

            const updatedRecipeData: Recipe = {
                ...recipe,
                id: recipe.id,
                title,
                description,
                ingredients: processedIngredients,
                instructions: processedInstructions,
                notes: notes.map((note) => note.text),
                time_estimate: timeEstimate,
                tags,
                images,
                servings,
                user_id: recipe.user_id || user.id,
                is_public: recipe.is_public ?? true,
            };

            const savedRecipeResult = await RecipeService.saveRecipe(
                updatedRecipeData,
                user.id,
                isSavingNewRecipe
            );

            setRecipe(savedRecipeResult);

            if (savedRecipeResult.id && isValidUuid(savedRecipeResult.id)) {
                try {
                    if (isCollectionsChanged) {
                        await saveCollections(savedRecipeResult.id);
                    }
                } catch (collectionError) {
                    console.error(
                        'Error managing recipe collections post-save:',
                        collectionError
                    );
                }
            } else {
                console.error(
                    'Save operation did not return a valid UUID:',
                    savedRecipeResult.id
                );
                setSaveError(
                    'Failed to save recipe (invalid ID returned). Please try again.'
                );
                setIsSaving(false);
                return;
            }

            navigate(`/recipe/${savedRecipeResult.id}`, {
                replace: isSavingNewRecipe,
                state: { recipe: savedRecipeResult },
            });
        } catch (error: unknown) {
            console.error('Error during handleSave:', error);
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
            const cursorPos =
                cursorPositions[stepId] ?? currentStep.text.length;

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
        setIngredients(ingredients.filter((ing) => ing.id !== ingredientId));
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
                                                alt={`Recipe image ${
                                                    index + 1
                                                }`}
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
                                                    bgcolor:
                                                        'rgba(0, 0, 0, 0.3)',
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
                                                    onClick={() =>
                                                        setImages(
                                                            images.filter(
                                                                (_, i) =>
                                                                    i !== index
                                                            )
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
                                                        images.length - 1
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
