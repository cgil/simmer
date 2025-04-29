import React, { FC } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Grid,
    Paper,
    IconButton,
    Tooltip,
} from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion, Variants } from 'framer-motion';
import { RecipeIdea } from '../../types'; // Adjust path if needed
import RecipeIdeaLoadingCard from './RecipeIdeaLoadingCard'; // Assuming it's in the same dir
import ProgressStepsDisplay from './ProgressStepsDisplay'; // Assuming it's in the same dir

interface AiSectionProps {
    recipePrompt: string;
    setRecipePrompt: (prompt: string) => void;
    isGeneratingIdeas: boolean;
    recipeIdeas: RecipeIdea[];
    selectedIdeaId: string | null;
    setSelectedIdeaId: (id: string | null) => void;
    showIdeaPromptEdit: boolean;
    setShowIdeaPromptEdit: (show: boolean) => void;
    editedPrompt: string;
    setEditedPrompt: (prompt: string) => void;
    generationError: string | null;
    setGenerationError: (error: string | null) => void;
    isCreatingFromIdea: boolean;
    aiCreateActiveStep: number;
    aiCreateError: string | null;
    handleGenerateRecipeIdeas: () => Promise<void>;
    handleEditPromptSubmit: () => void;
    handleCreateFromSelectedIdea: () => Promise<void>;
    setError: (error: string | null) => void; // If general error needs setting
    customDirection: number;
    getVariants: (direction: number) => Variants; // Use Framer Motion's Variants type
    aiRecipeSteps: string[];
}

const AiSectionComponent: FC<AiSectionProps> = ({
    recipePrompt,
    setRecipePrompt,
    isGeneratingIdeas,
    recipeIdeas,
    selectedIdeaId,
    setSelectedIdeaId,
    showIdeaPromptEdit,
    setShowIdeaPromptEdit,
    editedPrompt,
    setEditedPrompt,
    generationError,
    setGenerationError,
    isCreatingFromIdea,
    aiCreateActiveStep,
    aiCreateError,
    handleGenerateRecipeIdeas,
    handleEditPromptSubmit,
    handleCreateFromSelectedIdea,
    setError,
    customDirection,
    getVariants,
    aiRecipeSteps,
}) => (
    <motion.div
        key="ai"
        custom={customDirection}
        variants={getVariants(customDirection)}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: '100%' }}
    >
        <Box sx={{ width: '100%' }}>
            <Typography
                variant="h6"
                sx={{
                    mb: 2,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: 'text.primary',
                    textAlign: 'center',
                    width: '100%',
                }}
            >
                Ask the Chef
            </Typography>

            {/* Prompt Input Area */}
            {!isGeneratingIdeas &&
                recipeIdeas.length === 0 &&
                !isCreatingFromIdea && (
                    <Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="A quick and healthy salmon bowl with quinoa and roasted broccoli for two..."
                            value={recipePrompt}
                            onChange={(e) => {
                                setRecipePrompt(e.target.value);
                                setGenerationError(null);
                                setError(null);
                            }}
                            error={!!generationError}
                            helperText={generationError}
                            InputProps={{
                                sx: {
                                    bgcolor: 'background.paper',
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '1rem',
                                },
                            }}
                            sx={{ mb: 2 }}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleGenerateRecipeIdeas}
                            disabled={!recipePrompt.trim() || isGeneratingIdeas}
                            sx={{
                                height: 48,
                                fontFamily: "'Kalam', cursive",
                                fontSize: '1.1rem',
                            }}
                            startIcon={
                                isGeneratingIdeas ? (
                                    <CircularProgress
                                        size={20}
                                        color="inherit"
                                    />
                                ) : (
                                    <AutoAwesomeIcon />
                                )
                            }
                        >
                            {isGeneratingIdeas
                                ? 'Getting Recipe Ideas...'
                                : 'Get Recipe Ideas'}
                        </Button>
                    </Box>
                )}

            {/* Ideas Display Area */}
            {(isGeneratingIdeas || recipeIdeas.length > 0) &&
                !isCreatingFromIdea && (
                    <Box sx={{ mt: 4 }}>
                        {/* Prompt Display/Edit */}
                        <Box
                            sx={{
                                mb: 3,
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                position: 'relative',
                                opacity: isGeneratingIdeas ? 0.7 : 1,
                                transition: 'opacity 0.3s ease',
                            }}
                        >
                            {!showIdeaPromptEdit ? (
                                <>
                                    <Typography
                                        sx={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '0.9rem',
                                            mb: 0.5,
                                            fontWeight: 600,
                                            color: 'text.secondary',
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
                                                fontFamily:
                                                    "'Inter', sans-serif",
                                                color: 'text.primary',
                                                pr: 2,
                                                flex: 1,
                                                lineHeight: 1.5,
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {recipePrompt}
                                        </Typography>
                                        <Tooltip title="Edit Prompt">
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setShowIdeaPromptEdit(
                                                            true
                                                        );
                                                        setEditedPrompt(
                                                            recipePrompt
                                                        );
                                                    }}
                                                    disabled={isGeneratingIdeas}
                                                    sx={{
                                                        color: 'text.secondary',
                                                        '&:hover': {
                                                            color: 'primary.main',
                                                            bgcolor:
                                                                'action.hover',
                                                        },
                                                        '&.Mui-disabled': {
                                                            color: 'text.disabled',
                                                        },
                                                    }}
                                                >
                                                    <CreateIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                </>
                            ) : (
                                <>
                                    <Typography
                                        sx={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '0.9rem',
                                            mb: 1,
                                            fontWeight: 600,
                                            color: 'text.secondary',
                                        }}
                                    >
                                        Edit description:
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        value={editedPrompt}
                                        onChange={(e) =>
                                            setEditedPrompt(e.target.value)
                                        }
                                        variant="outlined"
                                        size="small"
                                        autoFocus
                                        InputProps={{
                                            sx: {
                                                fontFamily:
                                                    "'Inter', sans-serif",
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
                                            onClick={() =>
                                                setShowIdeaPromptEdit(false)
                                            }
                                            sx={{
                                                textTransform: 'none',
                                                color: 'text.secondary',
                                                fontFamily:
                                                    "'Inter', sans-serif",
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<AutoAwesomeIcon />}
                                            disabled={
                                                !editedPrompt.trim() ||
                                                isGeneratingIdeas
                                            }
                                            onClick={handleEditPromptSubmit}
                                            sx={{
                                                textTransform: 'none',
                                                fontFamily:
                                                    "'Inter', sans-serif",
                                            }}
                                        >
                                            {isGeneratingIdeas
                                                ? 'Getting Recipe Ideas...'
                                                : 'Generate New Ideas'}
                                        </Button>
                                    </Box>
                                </>
                            )}
                        </Box>

                        {/* Ideas Grid */}
                        {isGeneratingIdeas && recipeIdeas.length === 0 && (
                            <Grid container spacing={2}>
                                {[...Array(4)].map((_, index) => (
                                    <Grid
                                        item
                                        xs={12}
                                        sm={6}
                                        key={`loading-${index}`}
                                    >
                                        <RecipeIdeaLoadingCard />
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                        {!isGeneratingIdeas && recipeIdeas.length > 0 && (
                            <Grid container spacing={2}>
                                {recipeIdeas.map((idea) => (
                                    <Grid item xs={12} sm={6} key={idea.id}>
                                        <Paper
                                            elevation={
                                                selectedIdeaId === idea.id
                                                    ? 3
                                                    : 0
                                            }
                                            onClick={() => {
                                                if (
                                                    selectedIdeaId !== idea.id
                                                ) {
                                                    setSelectedIdeaId(idea.id);
                                                }
                                            }}
                                            sx={{
                                                p: 2.5,
                                                height: 220,
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
                                                    borderColor:
                                                        'primary.light',
                                                    boxShadow:
                                                        '0 2px 6px rgba(0,0,0,0.1)',
                                                    transform:
                                                        'translateY(-2px)',
                                                },
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background:
                                                        'rgba(255,255,255,0.7)',
                                                    backdropFilter: 'blur(1px)',
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
                                                sx={{
                                                    fontFamily:
                                                        "'Kalam', cursive",
                                                    fontSize: '1.2rem',
                                                    fontWeight: 700,
                                                    color: 'primary.main',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    lineHeight: 1.3,
                                                    height: 48,
                                                }}
                                            >
                                                {idea.title}
                                            </Typography>
                                            <Box
                                                sx={{
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
                                                            'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))',
                                                        pointerEvents: 'none',
                                                        zIndex: 2,
                                                    },
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontFamily:
                                                            "'Inter', sans-serif",
                                                        fontSize: '0.9rem',
                                                        color: 'text.secondary',
                                                        lineHeight: 1.5,
                                                    }}
                                                >
                                                    {idea.description}
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: '0.75rem',
                                                    right: '0.75rem',
                                                    width: '1.75rem',
                                                    height: '1.75rem',
                                                    borderRadius: '50%',
                                                    border: '1px solid',
                                                    borderColor:
                                                        selectedIdeaId ===
                                                        idea.id
                                                            ? 'primary.main'
                                                            : 'grey.400',
                                                    bgcolor:
                                                        selectedIdeaId ===
                                                        idea.id
                                                            ? 'primary.main'
                                                            : 'rgba(255,255,255,0.8)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 2,
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                {selectedIdeaId === idea.id && (
                                                    <Typography
                                                        sx={{
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold',
                                                            color: 'primary.contrastText',
                                                        }}
                                                    >
                                                        ✓
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        )}

                        {/* Action Button */}
                        {!isGeneratingIdeas && recipeIdeas.length > 0 && (
                            <Box
                                sx={{
                                    mt: 3,
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleCreateFromSelectedIdea}
                                    disabled={
                                        !selectedIdeaId || isCreatingFromIdea
                                    }
                                    sx={{
                                        height: 48,
                                        minWidth: 240,
                                        fontFamily: "'Kalam', cursive",
                                        fontSize: '1.1rem',
                                    }}
                                    startIcon={
                                        isCreatingFromIdea ? (
                                            <CircularProgress
                                                size={20}
                                                color="inherit"
                                            />
                                        ) : (
                                            <AutoAwesomeIcon />
                                        )
                                    }
                                >
                                    {isCreatingFromIdea
                                        ? 'Creating Recipe...'
                                        : 'Create Recipe'}
                                </Button>
                            </Box>
                        )}
                        {aiCreateError && (
                            <Typography
                                color="error"
                                sx={{
                                    textAlign: 'center',
                                    mt: 2,
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                {aiCreateError}
                            </Typography>
                        )}
                    </Box>
                )}

            {/* AI Creation Loading State */}
            {isCreatingFromIdea && (
                <Box
                    sx={{
                        mt: 4,
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
                        Chef is cooking up your recipe...
                    </Typography>
                    <ProgressStepsDisplay
                        steps={aiRecipeSteps}
                        activeStep={aiCreateActiveStep}
                        isFinalizing={
                            aiCreateActiveStep === aiRecipeSteps.length - 1
                        }
                    />
                </Box>
            )}
        </Box>
    </motion.div>
);

const AiSection = React.memo(AiSectionComponent);
export default AiSection;
