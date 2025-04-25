import { FC, useState, useEffect, useRef } from 'react';
import {
    Popover,
    Box,
    Typography,
    CircularProgress,
    Divider,
    IconButton,
    List,
    ListItem,
    Button,
    alpha,
    Tooltip,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import CloseIcon from '@mui/icons-material/Close';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { SubstituteOption } from '../../types/substitution';
import { supabase } from '../../lib/supabase';
import { formatQuantity } from '../../utils/recipe';

interface IngredientSubstitutionPopoverProps {
    open: boolean;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    ingredientId: string;
    ingredientName: string;
    ingredientQuantity?: number | null;
    ingredientUnit?: string | null;
    originalServings: number;
    currentServings: number;
    recipeTitle?: string;
    recipeDescription?: string;
    onSubstitute: (substituteOption: SubstituteOption) => void;
    onRevertSubstitution?: () => void;
    isSubstituted?: boolean;
}

const IngredientSubstitutionPopover: FC<IngredientSubstitutionPopoverProps> = ({
    open,
    anchorEl,
    onClose,
    ingredientId,
    ingredientName,
    ingredientQuantity,
    ingredientUnit,
    originalServings,
    currentServings,
    recipeTitle,
    recipeDescription,
    onSubstitute,
    onRevertSubstitution,
    isSubstituted = false,
}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [substitutes, setSubstitutes] = useState<SubstituteOption[]>([]);
    const [error, setError] = useState<string | null>(null);
    const requestInProgress = useRef<boolean>(false);
    const requestKey = useRef<string>('');

    // Fetch substitutes from the API
    const fetchSubstitutes = async () => {
        // Generate a request key to prevent duplicate calls
        const currentRequestKey = `${ingredientId}:${originalServings}:${currentServings}`;

        // Skip if this exact request is already in progress or was just made
        if (
            requestInProgress.current &&
            requestKey.current === currentRequestKey
        ) {
            return;
        }

        requestInProgress.current = true;
        requestKey.current = currentRequestKey;
        setLoading(true);
        setError(null);

        try {
            const { data, error: apiError } = await supabase.functions.invoke<
                SubstituteOption[]
            >('ingredient-substitution', {
                body: {
                    ingredientId,
                    ingredientName,
                    ingredientQuantity,
                    ingredientUnit,
                    originalServings,
                    currentServings,
                    recipeTitle,
                    recipeDescription,
                },
            });

            if (apiError) {
                throw new Error(apiError.message);
            }

            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid response format');
            }

            setSubstitutes(data);
        } catch (err) {
            console.error('Error fetching substitutes:', err);
            setError('Failed to fetch substitution options');
            setSubstitutes([]);
        } finally {
            setLoading(false);
            requestInProgress.current = false;
        }
    };

    // Fetch substitutes when the popover opens
    useEffect(() => {
        if (open && !isSubstituted) {
            fetchSubstitutes();
        }

        // On unmount or when popover closes, reset the request tracking
        return () => {
            if (!open) {
                requestKey.current = '';
            }
        };
    }, [open, isSubstituted, ingredientId, originalServings, currentServings]);

    // Helper function to get scaled and properly formatted quantity
    const getScaledQuantity = (qty: number | null | undefined) => {
        if (qty === null || qty === undefined) return null;
        const scaled = qty * (currentServings / originalServings);
        return scaled;
    };

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            PaperProps={{
                elevation: 3,
                sx: {
                    overflow: 'visible',
                    mt: 1.5,
                    borderRadius: 1,
                    minWidth: 280,
                    maxWidth: 350,
                    bgcolor: 'paper.light',
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        boxShadow: 'inset 0 0 30px rgba(62, 28, 0, 0.05)',
                        pointerEvents: 'none',
                        zIndex: 0,
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
                        zIndex: 0,
                    },
                    '& > *': {
                        position: 'relative',
                        zIndex: 1,
                    },
                },
            }}
            disableRestoreFocus
        >
            {/* Header - Improved with better visual distinction */}
            <Box
                sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'relative',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    borderTopLeftRadius: 'inherit',
                    borderTopRightRadius: 'inherit',
                }}
            >
                <Box>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontFamily: "'Kalam', cursive",
                            color: 'primary.main',
                            fontWeight: 600,
                        }}
                    >
                        {isSubstituted
                            ? 'Substituted Ingredient'
                            : 'Substitute For'}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'text.primary',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                        }}
                    >
                        {ingredientQuantity
                            ? `${formatQuantity(
                                  getScaledQuantity(ingredientQuantity)
                              )} ${ingredientUnit || ''} ${ingredientName}`
                            : ingredientName}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {/* If already substituted, show undo button */}
                    {isSubstituted && onRevertSubstitution && (
                        <Tooltip title="">
                            <IconButton
                                size="small"
                                onClick={onRevertSubstitution}
                                sx={{
                                    color: 'text.secondary',
                                    '&:hover': {
                                        color: 'primary.main',
                                        bgcolor: alpha('#2C3E50', 0.04),
                                    },
                                }}
                            >
                                <UndoIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* Close button */}
                    <Tooltip title="">
                        <IconButton
                            size="small"
                            onClick={onClose}
                            aria-label="close"
                            sx={{
                                color: 'text.secondary',
                                '&:hover': {
                                    color: 'primary.main',
                                    bgcolor: alpha('#2C3E50', 0.04),
                                },
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Loading state */}
            {loading && (
                <Box
                    sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 120,
                    }}
                >
                    <CircularProgress
                        size={28}
                        color="primary"
                        sx={{ mb: 2 }}
                    />
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'text.secondary',
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        Finding substitutes...
                    </Typography>
                </Box>
            )}

            {/* Error state */}
            {error && !loading && (
                <Box
                    sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 120,
                    }}
                >
                    <RestaurantIcon
                        sx={{
                            color: alpha('#d32f2f', 0.6),
                            fontSize: 32,
                            mb: 2,
                        }}
                    />
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'error.main',
                            textAlign: 'center',
                        }}
                    >
                        {error}
                    </Typography>
                    <Button
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={fetchSubstitutes}
                    >
                        Try Again
                    </Button>
                </Box>
            )}

            {/* Content */}
            {!loading && !error && (
                <>
                    {substitutes.length > 0 ? (
                        <List sx={{ p: 0 }}>
                            {substitutes.map((option, index) => (
                                <Box key={index}>
                                    {index > 0 && <Divider />}
                                    {option.ingredients.length === 1 ? (
                                        <ListItem
                                            sx={{
                                                px: 2,
                                                py: 1.5,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: alpha(
                                                        '#2C3E50',
                                                        0.04
                                                    ),
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: 'text.primary',
                                                        fontWeight: 500,
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    {option.ingredients[0]
                                                        .quantity && (
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                fontWeight: 600,
                                                                mr: 0,
                                                            }}
                                                        >
                                                            {formatQuantity(
                                                                option
                                                                    .ingredients[0]
                                                                    .quantity
                                                            )}{' '}
                                                            {
                                                                option
                                                                    .ingredients[0]
                                                                    .unit
                                                            }{' '}
                                                        </Box>
                                                    )}
                                                    {option.ingredients[0].name.toLowerCase()}
                                                </Typography>
                                            </Box>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                onClick={() =>
                                                    onSubstitute(option)
                                                }
                                                sx={{
                                                    minWidth: 'auto',
                                                    borderRadius: 1.5,
                                                    px: 2,
                                                    py: 0.3,
                                                    fontSize: '0.75rem',
                                                    boxShadow: 'none',
                                                    ml: 1,
                                                    borderColor: alpha(
                                                        '#2C3E50',
                                                        0.3
                                                    ),
                                                    color: 'primary.main',
                                                    fontWeight: 500,
                                                    '&:hover': {
                                                        borderColor:
                                                            'primary.main',
                                                        bgcolor: alpha(
                                                            '#2C3E50',
                                                            0.04
                                                        ),
                                                        boxShadow: 'none',
                                                    },
                                                }}
                                            >
                                                Use
                                            </Button>
                                        </ListItem>
                                    ) : (
                                        <Box
                                            sx={{
                                                p: 2,
                                                pb: 1.5,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: alpha(
                                                        '#2C3E50',
                                                        0.04
                                                    ),
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent:
                                                        'space-between',
                                                    alignItems: 'flex-start',
                                                    mb: 1,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: 'text.primary',
                                                        fontWeight: 600,
                                                        flex: 1,
                                                    }}
                                                >
                                                    Multiple Ingredients
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() =>
                                                        onSubstitute(option)
                                                    }
                                                    sx={{
                                                        minWidth: 'auto',
                                                        borderRadius: 1.5,
                                                        px: 2,
                                                        py: 0.3,
                                                        fontSize: '0.75rem',
                                                        boxShadow: 'none',
                                                        ml: 1,
                                                        borderColor: alpha(
                                                            '#2C3E50',
                                                            0.3
                                                        ),
                                                        color: 'primary.main',
                                                        fontWeight: 500,
                                                        '&:hover': {
                                                            borderColor:
                                                                'primary.main',
                                                            bgcolor: alpha(
                                                                '#2C3E50',
                                                                0.04
                                                            ),
                                                            boxShadow: 'none',
                                                        },
                                                    }}
                                                >
                                                    Use
                                                </Button>
                                            </Box>

                                            {/* List of ingredients */}
                                            <Box
                                                component="ul"
                                                sx={{
                                                    listStyle: 'none',
                                                    pl: 0,
                                                    mb: 1,
                                                }}
                                            >
                                                {option.ingredients.map(
                                                    (ingredient, idx) => (
                                                        <Box
                                                            component="li"
                                                            key={idx}
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'flex-start',
                                                                mb: 0.5,
                                                                '&::before': {
                                                                    content:
                                                                        '""',
                                                                    width: 3,
                                                                    height: 3,
                                                                    bgcolor:
                                                                        'primary.main',
                                                                    borderRadius:
                                                                        '50%',
                                                                    mr: 1.5,
                                                                    mt: '0.6em',
                                                                    opacity: 0.7,
                                                                    flexShrink: 0,
                                                                },
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: 'text.secondary',
                                                                    fontSize:
                                                                        '0.85rem',
                                                                }}
                                                            >
                                                                {ingredient.quantity && (
                                                                    <Box
                                                                        component="span"
                                                                        sx={{
                                                                            fontWeight: 600,
                                                                            mr: 0,
                                                                        }}
                                                                    >
                                                                        {formatQuantity(
                                                                            ingredient.quantity
                                                                        )}{' '}
                                                                        {
                                                                            ingredient.unit
                                                                        }{' '}
                                                                    </Box>
                                                                )}
                                                                {ingredient.name.toLowerCase()}
                                                            </Typography>
                                                        </Box>
                                                    )
                                                )}
                                            </Box>

                                            {/* Instructions */}
                                            {option.instructions && (
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: 'text.secondary',
                                                        fontSize: '0.85rem',
                                                        fontStyle: 'italic',
                                                        mt: 1,
                                                    }}
                                                >
                                                    {option.instructions}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </List>
                    ) : (
                        <Box
                            sx={{
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: 120,
                            }}
                        >
                            <RestaurantIcon
                                sx={{
                                    color: alpha('#2C3E50', 0.2),
                                    fontSize: 32,
                                    mb: 2,
                                }}
                            />
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    textAlign: 'center',
                                }}
                            >
                                No substitutes found for this ingredient.
                            </Typography>
                        </Box>
                    )}
                </>
            )}
        </Popover>
    );
};

export default IngredientSubstitutionPopover;
