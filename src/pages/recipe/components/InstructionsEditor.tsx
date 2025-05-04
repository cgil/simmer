import { FC, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Stack,
    IconButton,
    Menu,
    MenuItem,
    Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import FontAwesomeIcon from '../../../components/icons/FontAwesomeIcon';
import CarrotPlusIcon from '../../../components/icons/CarrotPlusIcon';
import NotebookButton from '../../../components/common/NotebookButton';
import IngredientReferenceInput from './IngredientReferenceInput';
import { Recipe, InstructionSection, Step } from '../../../types/recipe';
import { generateUuidV4, isValidUuid, ensureUuid } from '../../../utils/uuid';

interface InstructionsEditorProps {
    instructions: Recipe['instructions'];
    setInstructions: React.Dispatch<
        React.SetStateAction<Recipe['instructions']>
    >;
    ingredients: Recipe['ingredients'];
}

const InstructionsEditor: FC<InstructionsEditorProps> = ({
    instructions,
    setInstructions,
    ingredients,
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [activeStepIndex, setActiveStepIndex] = useState<
        [number, number] | null
    >(null);
    const [cursorPositions, setCursorPositions] = useState<
        Record<string, number>
    >({});

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

    return (
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
                {instructions.map((section, sectionIndex) => (
                    <Box
                        key={section.id || `section-${sectionIndex}`}
                        sx={{
                            position: 'relative',
                            '&:hover .delete-section': {
                                opacity: 1,
                                transform: 'translateX(0)',
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
                                value={section.section_title}
                                variant="standard"
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontFamily: "'Kalam', cursive",
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        textShadow:
                                            '1px 1px 1px rgba(0,0,0,0.05)',
                                    },
                                }}
                                onChange={(e) =>
                                    handleSectionTitleChange(sectionIndex, e)
                                }
                            />
                            <IconButton
                                className="delete-section"
                                size="small"
                                onClick={() =>
                                    handleDeleteSection(sectionIndex)
                                }
                                sx={{
                                    opacity: 0,
                                    transform: 'translateX(-10px)',
                                    transition: 'all 0.2s',
                                    width: 32,
                                    height: 32,
                                    bgcolor: 'paper.light',
                                    '&:hover': {
                                        transform: 'translateY(-1px)',
                                        bgcolor: 'paper.dark',
                                        '&::before': {
                                            opacity: 1,
                                        },
                                    },
                                    '& svg': {
                                        color: 'error.main',
                                        transition: 'color 0.2s',
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
                            {section.steps.map((step, stepIndex) => (
                                <Box
                                    key={
                                        step.id ||
                                        `step-${sectionIndex}-${stepIndex}`
                                    }
                                    sx={{
                                        display: 'flex',
                                        gap: 2,
                                        alignItems: 'flex-start',
                                        position: 'relative',
                                        '&:hover .step-actions': {
                                            opacity: 1,
                                            transform: 'translateX(0)',
                                        },
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            mt: 1,
                                            minWidth: 28,
                                            color: 'text.secondary',
                                            fontWeight: 500,
                                            fontSize: '1rem',
                                        }}
                                    >
                                        {stepIndex + 1}.
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 1,
                                            flex: 1,
                                        }}
                                    >
                                        <IngredientReferenceInput
                                            value={step.text}
                                            onChange={(value) =>
                                                handleStepChange(
                                                    sectionIndex,
                                                    stepIndex,
                                                    value
                                                )
                                            }
                                            ingredients={ingredients}
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
                                                display: 'flex',
                                                gap: 1,
                                                opacity: 0,
                                                transform: 'translateX(-10px)',
                                                transition: 'all 0.2s',
                                                ml: 1,
                                            }}
                                        >
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    setActiveStepIndex([
                                                        sectionIndex,
                                                        stepIndex,
                                                    ]);
                                                    setAnchorEl(
                                                        e.currentTarget
                                                    );
                                                }}
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    mt: 1,
                                                    color: 'text.secondary',
                                                    bgcolor: 'paper.light',
                                                    '&:hover': {
                                                        bgcolor: 'paper.dark',
                                                    },
                                                }}
                                            >
                                                <CarrotPlusIcon fontSize={20} />
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
                                                    bgcolor: 'paper.light',
                                                    '&:hover': {
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
                                                    sx={{
                                                        fontSize: 18,
                                                    }}
                                                />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                            <NotebookButton
                                startIcon={<AddIcon sx={{ fontSize: 20 }} />}
                                onClick={() => handleAddStep(sectionIndex)}
                                buttonStyle="primary"
                                sx={{ ml: 4 }}
                            >
                                Add Step
                            </NotebookButton>
                        </Stack>
                    </Box>
                ))}
                <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 3 }} />
                    <NotebookButton
                        startIcon={<PlaylistAddIcon sx={{ fontSize: 22 }} />}
                        onClick={handleAddSection}
                        buttonStyle="primary"
                    >
                        Add New Section
                    </NotebookButton>
                </Box>
            </Stack>

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
        </Box>
    );
};

export default InstructionsEditor;
