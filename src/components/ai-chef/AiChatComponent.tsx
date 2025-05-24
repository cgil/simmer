import { FC, useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Typography,
    Paper,
    Avatar,
    CircularProgress,
    Button,
    alpha,
    Divider,
    useTheme,
    Alert,
    Collapse,
    useMediaQuery,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PolylineIcon from '@mui/icons-material/Polyline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import SuggestionPills from './SuggestionPills';
import { RecipeChanges } from './index';
import { GiChefToque, GiSparkles } from 'react-icons/gi';
import { Recipe, InstructionSection } from '../../types/recipe';
import {
    sendAiChefMessage,
    ChatMessage as ApiChatMessage,
} from '../../lib/api';
import RecipeChangePreview from './RecipeChangePreview';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    isLoading?: boolean;
    hasActions?: boolean;
    suggestedChanges?: RecipeChanges;
}

interface AiChatComponentProps {
    onApplyChanges: (changes: RecipeChanges) => void;
    onAnimationStart?: () => void;
    currentRecipe?: Recipe;
}

const AiChatComponent: FC<AiChatComponentProps> = ({
    onApplyChanges,
    onAnimationStart = () => {},
    currentRecipe, // Now used for the API call
}) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hi! I'm your AI Chef assistant. How would you like to improve this recipe?",
            sender: 'ai',
            timestamp: new Date(),
            hasActions: false,
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Format messages for API call
    const formatMessagesForApi = (msgs: Message[]): ApiChatMessage[] => {
        return msgs.map((msg) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.sender,
            timestamp: msg.timestamp.toISOString(),
        }));
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !currentRecipe) return;

        // Clear any previous errors
        setError(null);

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            text: message,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setMessage('');
        setIsLoading(true);

        try {
            // Prepare chat history for API call
            const chatHistory = formatMessagesForApi([
                ...messages,
                userMessage,
            ]);

            // Create a deep clone of the recipe to avoid modifying the original
            const recipeToSend = JSON.parse(JSON.stringify(currentRecipe));

            // Ensure all instruction sections have IDs
            if (
                recipeToSend.instructions &&
                Array.isArray(recipeToSend.instructions)
            ) {
                recipeToSend.instructions = recipeToSend.instructions.map(
                    (section: Partial<InstructionSection>, index: number) => {
                        // If section has no ID, generate one
                        if (!section.id) {
                            section.id = `section-${index}-${Date.now()}`;
                        }

                        // Ensure all steps have IDs
                        if (section.steps && Array.isArray(section.steps)) {
                            section.steps = section.steps.map(
                                (step, stepIndex) => {
                                    if (!step.id) {
                                        return {
                                            ...step,
                                            id: `step-${index}-${stepIndex}-${Date.now()}`,
                                        };
                                    }
                                    return step;
                                }
                            );
                        }

                        return section;
                    }
                );
            }

            // Call the Edge Function
            const response = await sendAiChefMessage(
                recipeToSend as unknown as Record<string, unknown>,
                chatHistory
            );

            // Create AI message from response
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.aiResponseText,
                sender: 'ai',
                timestamp: new Date(),
                hasActions: response.hasRecipeChanges,
                suggestedChanges: response.hasRecipeChanges
                    ? (response.suggestedRecipeChanges as RecipeChanges)
                    : undefined,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            console.error('Error sending message to AI Chef:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to communicate with AI Chef'
            );

            // Add error message from AI
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm sorry, I encountered an error processing your request. Please try again later.",
                sender: 'ai',
                timestamp: new Date(),
                hasActions: false,
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionSelect = (suggestion: string) => {
        setMessage(suggestion);
        // Optional: Auto-send the suggestion
        // setMessage(suggestion);
        // handleSendMessage();
    };

    const handleApplyChanges = (changes: RecipeChanges) => {
        // Trigger animation in parent component
        onAnimationStart();

        // Pass the changes to the parent component
        onApplyChanges(changes);
    };

    // Custom chef avatar component for better styling
    const ChefAvatar = () => (
        <Avatar
            sx={{
                width: 38,
                height: 38,
                bgcolor: alpha(theme.palette.secondary.main, 0.8),
                border: '1px solid',
                borderColor: alpha(theme.palette.secondary.dark, 0.3),
                boxShadow: `0 2px 4px ${alpha(
                    theme.palette.common.black,
                    0.1
                )}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0.5,
                position: 'relative',
            }}
        >
            <GiChefToque
                style={{
                    color: theme.palette.primary.main,
                    width: 24,
                    height: 24,
                }}
            />
            <GiSparkles
                style={{
                    color: theme.palette.primary.main,
                    width: 12,
                    height: 12,
                    position: 'absolute',
                    top: 2,
                    right: 4,
                    opacity: 0.9,
                }}
            />
        </Avatar>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '100%',
            }}
        >
            {error && (
                <Collapse in={!!error}>
                    <Alert
                        severity="error"
                        onClose={() => setError(null)}
                        sx={{ mb: 1 }}
                    >
                        {error}
                    </Alert>
                </Collapse>
            )}

            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {messages.map((msg) => (
                    <Box
                        key={msg.id}
                        sx={{
                            display: 'flex',
                            flexDirection:
                                msg.sender === 'user' ? 'row-reverse' : 'row',
                            alignItems: 'flex-start',
                            gap: isSmallScreen ? 0 : 1.5,
                        }}
                    >
                        {!isSmallScreen && (
                            <>
                                {msg.sender === 'user' ? (
                                    user?.user_metadata?.avatar_url ? (
                                        <Avatar
                                            src={user.user_metadata.avatar_url}
                                            alt="User"
                                            sx={{
                                                width: 38,
                                                height: 38,
                                                border: '1px solid',
                                                borderColor: alpha(
                                                    theme.palette.primary.main,
                                                    0.1
                                                ),
                                                boxShadow: `0 2px 4px ${alpha(
                                                    theme.palette.common.black,
                                                    0.05
                                                )}`,
                                            }}
                                        />
                                    ) : (
                                        <Avatar
                                            sx={{
                                                width: 38,
                                                height: 38,
                                                bgcolor: alpha(
                                                    theme.palette.primary.main,
                                                    0.9
                                                ),
                                                border: '1px solid',
                                                borderColor: alpha(
                                                    theme.palette.primary.dark,
                                                    0.2
                                                ),
                                                boxShadow: `0 2px 4px ${alpha(
                                                    theme.palette.common.black,
                                                    0.05
                                                )}`,
                                            }}
                                        >
                                            <AccountCircleIcon
                                                sx={{ color: 'white' }}
                                            />
                                        </Avatar>
                                    )
                                ) : (
                                    <ChefAvatar />
                                )}
                            </>
                        )}

                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                width: isSmallScreen ? 'auto' : 'auto',
                                maxWidth: isSmallScreen
                                    ? msg.sender === 'ai'
                                        ? '90%'
                                        : '75%'
                                    : '75%',
                                borderRadius:
                                    msg.sender === 'user'
                                        ? '16px 16px 4px 16px'
                                        : '16px 16px 16px 4px',
                                bgcolor:
                                    msg.sender === 'user'
                                        ? alpha(
                                              theme.palette.primary.main,
                                              0.08
                                          )
                                        : alpha(
                                              theme.palette.secondary.light,
                                              0.5
                                          ),
                                borderColor:
                                    msg.sender === 'user'
                                        ? alpha(
                                              theme.palette.primary.main,
                                              0.12
                                          )
                                        : alpha(
                                              theme.palette.secondary.main,
                                              0.3
                                          ),
                                borderWidth: 1,
                                borderStyle: 'solid',
                                boxShadow: `0 1px 2px ${alpha(
                                    theme.palette.common.black,
                                    0.05
                                )}`,
                                ml:
                                    msg.sender === 'ai' && isSmallScreen
                                        ? 0
                                        : 'auto',
                                mr:
                                    msg.sender === 'user' && isSmallScreen
                                        ? 0
                                        : 'auto',
                            }}
                        >
                            {msg.sender === 'ai' ? (
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            ) : (
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: theme.palette.text.primary,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {msg.text}
                                </Typography>
                            )}

                            {msg.hasActions &&
                                msg.suggestedChanges &&
                                currentRecipe && (
                                    <>
                                        {/* Recipe Change Preview */}
                                        <RecipeChangePreview
                                            currentRecipe={currentRecipe}
                                            suggestedChanges={
                                                msg.suggestedChanges
                                            }
                                        />

                                        <Box
                                            sx={{
                                                mt: 2,
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                            }}
                                        >
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                onClick={() =>
                                                    handleApplyChanges(
                                                        msg.suggestedChanges!
                                                    )
                                                }
                                                startIcon={<PolylineIcon />}
                                                sx={{
                                                    boxShadow: 'none',
                                                    textTransform: 'none',
                                                    borderRadius: 8,
                                                }}
                                            >
                                                Apply Changes
                                            </Button>
                                        </Box>
                                    </>
                                )}
                        </Paper>
                    </Box>
                ))}

                {isLoading && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                        }}
                    >
                        <ChefAvatar />
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: '16px 16px 16px 4px',
                                bgcolor: alpha(
                                    theme.palette.secondary.light,
                                    0.5
                                ),
                                borderColor: alpha(
                                    theme.palette.secondary.main,
                                    0.3
                                ),
                                borderWidth: 1,
                                borderStyle: 'solid',
                                display: 'flex',
                                justifyContent: 'center',
                                width: 80,
                                boxShadow: `0 1px 2px ${alpha(
                                    theme.palette.common.black,
                                    0.05
                                )}`,
                            }}
                        >
                            <CircularProgress size={20} color="primary" />
                        </Paper>
                    </Box>
                )}

                <div ref={messagesEndRef} />
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
                <SuggestionPills onSelect={handleSuggestionSelect} />
            </Box>

            <Box
                sx={{
                    p: 2,
                    pt: 0,
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
            >
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="How would you like to improve this recipe?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                    InputProps={{
                        endAdornment: (
                            <IconButton
                                color="primary"
                                onClick={handleSendMessage}
                                disabled={!message.trim() || isLoading}
                                sx={{
                                    bgcolor: message.trim()
                                        ? 'secondary.main'
                                        : 'transparent',
                                    '&:hover': {
                                        bgcolor: message.trim()
                                            ? 'secondary.light'
                                            : 'transparent',
                                    },
                                    visibility: message.trim()
                                        ? 'visible'
                                        : 'hidden',
                                }}
                            >
                                <SendIcon
                                    sx={{
                                        fontSize: 18,
                                        color: message.trim()
                                            ? 'primary.main'
                                            : 'inherit',
                                    }}
                                />
                            </IconButton>
                        ),
                        sx: {
                            bgcolor: 'paper.main',
                            borderRadius: 4,
                            pr: 0.5,
                        },
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: alpha(theme.palette.divider, 0.2),
                            },
                            '&:hover fieldset': {
                                borderColor: alpha(
                                    theme.palette.primary.main,
                                    0.3
                                ),
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: theme.palette.primary.main,
                                borderWidth: 1,
                            },
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

export default AiChatComponent;
