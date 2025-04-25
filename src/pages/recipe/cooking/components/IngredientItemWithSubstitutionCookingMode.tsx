import { FC, useState, useRef } from 'react';
import {
    Box,
    Typography,
    IconButton,
    alpha,
    useTheme,
    useMediaQuery,
    Divider,
} from '@mui/material';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import UndoIcon from '@mui/icons-material/Undo';
import IngredientSubstitutionPopover from '../../../../components/substitution/IngredientSubstitutionPopover';
import { SubstituteOption } from '../../../../types/substitution';
import {
    formatQuantity,
    getCookFriendlyQuantity,
} from '../../../../utils/recipe';
import { useIngredientSubstitution } from '../../../../components/substitution/IngredientSubstitutionContext';

// Types for the component props
interface IngredientItemWithSubstitutionCookingModeProps {
    id: string;
    name: string;
    quantity?: number | null;
    unit?: string | null;
    originalServings: number;
    currentServings: number;
    notes?: string;
    multiIngredients?: Array<{
        id: string;
        name: string;
        quantity?: number | null;
        unit?: string | null;
    }>;
    instructions?: string;
    isSubstituted?: boolean;
    originalIngredient?: {
        name: string;
        quantity?: number | null;
        unit?: string | null;
    };
}

const IngredientItemWithSubstitutionCookingMode: FC<
    IngredientItemWithSubstitutionCookingModeProps
> = ({
    id,
    name,
    quantity,
    unit,
    originalServings,
    currentServings,
    notes,
    multiIngredients,
    instructions,
    isSubstituted = false,
    originalIngredient,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isItemActive, setIsItemActive] = useState(false); // For mobile active state
    const containerRef = useRef<HTMLDivElement>(null);
    const { addSubstitution, removeSubstitution } = useIngredientSubstitution();

    // Get cook-friendly numeric values
    const friendlyQuantity = getCookFriendlyQuantity(quantity ?? null);
    const friendlyOriginalQuantity = getCookFriendlyQuantity(
        originalIngredient?.quantity ?? null
    );

    // Handle opening the substitution popover
    const handleOpenSubstitutionPopover = (
        event: React.MouseEvent<HTMLElement>
    ) => {
        // Stop propagation to prevent click on parent element
        event.stopPropagation();
        setIsPopoverOpen(true);
    };

    // Handle closing the substitution popover
    const handleCloseSubstitutionPopover = () => {
        setIsPopoverOpen(false);
        setIsItemActive(false); // Reset mobile active state when closing popover
    };

    // Handle substitution selection
    const handleSubstitute = (substituteOption: SubstituteOption) => {
        if (originalIngredient) {
            addSubstitution(
                id,
                {
                    id,
                    name: originalIngredient.name,
                    quantity: originalIngredient.quantity,
                    unit: originalIngredient.unit,
                },
                substituteOption
            );
        } else {
            addSubstitution(
                id,
                {
                    id,
                    name,
                    quantity,
                    unit,
                },
                substituteOption
            );
        }
        handleCloseSubstitutionPopover();
    };

    // Handle reverting to original ingredient
    const handleRevertSubstitution = () => {
        removeSubstitution(id);
        handleCloseSubstitutionPopover();
    };

    // Handler for the entire ingredient item click (for mobile)
    const handleItemClick = isMobile
        ? () => {
              setIsItemActive(true); // Set active state for mobile highlighting
              setIsPopoverOpen(true);
          }
        : undefined;

    // Mouse enter/leave handlers for hover state (desktop only)
    const handleMouseEnter = !isMobile
        ? () => {
              setIsHovered(true);
          }
        : undefined;

    const handleMouseLeave = !isMobile
        ? () => {
              setIsHovered(false);
          }
        : undefined;

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'relative',
                mb: 2,
                '&:last-child': {
                    mb: 0,
                },
                ...(isSubstituted && {
                    bgcolor: (theme) =>
                        alpha(theme.palette.primary.light, 0.04),
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    mx: -1,
                }),
                ...(isItemActive &&
                    isMobile && {
                        bgcolor: (theme) =>
                            alpha(theme.palette.primary.light, 0.08),
                        borderRadius: 1,
                    }),
            }}
        >
            <Box
                onClick={handleItemClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    position: 'relative',
                    cursor: isMobile ? 'pointer' : 'default',
                    paddingRight: '28px',
                }}
            >
                {/* Bullet point */}
                <Box
                    sx={{
                        width: { xs: 4, sm: 6 },
                        height: { xs: 4, sm: 6 },
                        bgcolor: isSubstituted
                            ? alpha(theme.palette.primary.main, 0.6)
                            : 'primary.main',
                        borderRadius: '50%',
                        mr: 2,
                        mt: '0.5em',
                        opacity: 0.7,
                        flexShrink: 0,
                    }}
                />

                {/* Ingredient content */}
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    {/* For regular ingredient or if it's not substituted */}
                    {!isSubstituted && (
                        <Typography
                            component="span"
                            sx={{
                                display: 'inline',
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                lineHeight: 1.5,
                                color: 'text.primary',
                                wordBreak: 'break-word',
                            }}
                        >
                            {friendlyQuantity !== null && (
                                <Box
                                    component="span"
                                    sx={{
                                        fontWeight: 500,
                                        display: 'inline-block',
                                        mr: 0.5,
                                    }}
                                >
                                    {formatQuantity(friendlyQuantity)}
                                    {unit && ` ${unit}`}
                                </Box>
                            )}
                            {name}
                            {notes && (
                                <Box
                                    component="span"
                                    sx={{
                                        color: 'text.secondary',
                                        ml: 1,
                                        fontSize: '0.85em',
                                    }}
                                >
                                    ({notes})
                                </Box>
                            )}
                        </Typography>
                    )}

                    {/* For substituted ingredients */}
                    {isSubstituted && (
                        <>
                            {/* Original ingredient with strikethrough */}
                            {originalIngredient && (
                                <Typography
                                    component="div"
                                    sx={{
                                        fontSize: { xs: '0.9rem', sm: '1rem' },
                                        lineHeight: 1.5,
                                        color: 'text.secondary',
                                        textDecoration: 'line-through',
                                        mb: 1,
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {friendlyOriginalQuantity !== null && (
                                        <Box
                                            component="span"
                                            sx={{
                                                fontWeight: 500,
                                                display: 'inline-block',
                                                mr: 0.5,
                                                textDecoration: 'line-through',
                                            }}
                                        >
                                            {formatQuantity(
                                                friendlyOriginalQuantity
                                            )}
                                            {originalIngredient.unit &&
                                                ` ${originalIngredient.unit}`}
                                        </Box>
                                    )}
                                    {originalIngredient.name}
                                </Typography>
                            )}

                            {/* Divider */}
                            <Divider sx={{ my: 1 }} />

                            {/* Substitution label */}
                            <Typography
                                component="div"
                                sx={{
                                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                                    color: 'primary.main',
                                    fontFamily: "'Kalam', cursive",
                                    fontWeight: 600,
                                    mb: 0.5,
                                }}
                            >
                                Substitute with:
                            </Typography>

                            {/* If it's a single ingredient substitute */}
                            {!multiIngredients && (
                                <Box sx={{ pl: 1, mb: 1 }}>
                                    <Typography
                                        component="div"
                                        sx={{
                                            fontSize: {
                                                xs: '0.875rem',
                                                sm: '0.9rem',
                                            },
                                            lineHeight: 1.5,
                                            color: 'text.primary',
                                            fontWeight: 500,
                                            wordBreak: 'break-word',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            '&::before': {
                                                content: '""',
                                                width: 3,
                                                height: 3,
                                                bgcolor: 'primary.main',
                                                borderRadius: '50%',
                                                mr: 1.5,
                                                mt: '0.6em',
                                                opacity: 0.7,
                                                flexShrink: 0,
                                            },
                                        }}
                                    >
                                        {friendlyQuantity !== null && (
                                            <Box
                                                component="span"
                                                sx={{
                                                    fontWeight: 600,
                                                    display: 'inline-block',
                                                    mr: 0.5,
                                                }}
                                            >
                                                {formatQuantity(
                                                    getCookFriendlyQuantity(
                                                        quantity ?? null
                                                    )
                                                )}
                                                {unit && ` ${unit}`}
                                            </Box>
                                        )}
                                        {name.toLowerCase()}
                                    </Typography>

                                    {/* Description for single ingredient substitute */}
                                    {notes && (
                                        <Typography
                                            sx={{
                                                fontSize: {
                                                    xs: '0.8rem',
                                                    sm: '0.85rem',
                                                },
                                                color: 'text.secondary',
                                                fontStyle: 'italic',
                                                mt: 0.5,
                                                pl: 0, // Align with bullet list
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {notes}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* If it's a multi-ingredient substitute */}
                            {multiIngredients && (
                                <Box sx={{ position: 'relative', pl: 1 }}>
                                    {/* List of ingredients */}
                                    <Box sx={{ mb: 1 }}>
                                        {multiIngredients.map(
                                            (ingredient, idx) => (
                                                <Typography
                                                    key={ingredient.id || idx}
                                                    component="div"
                                                    sx={{
                                                        fontSize: {
                                                            xs: '0.875rem',
                                                            sm: '0.9rem',
                                                        },
                                                        color: 'text.primary',
                                                        display: 'flex',
                                                        mb: 0.5,
                                                        wordBreak: 'break-word',
                                                        '&::before': {
                                                            content: '""',
                                                            width: 3,
                                                            height: 3,
                                                            bgcolor:
                                                                'primary.main',
                                                            borderRadius: '50%',
                                                            mr: 1.5,
                                                            mt: '0.6em',
                                                            opacity: 0.7,
                                                            flexShrink: 0,
                                                        },
                                                    }}
                                                >
                                                    {getCookFriendlyQuantity(
                                                        ingredient.quantity ??
                                                            null
                                                    ) !== null && (
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                fontWeight: 600,
                                                                mr: 0.5,
                                                            }}
                                                        >
                                                            {formatQuantity(
                                                                getCookFriendlyQuantity(
                                                                    ingredient.quantity ??
                                                                        null
                                                                )
                                                            )}
                                                            {ingredient.unit &&
                                                                ` ${ingredient.unit}`}
                                                        </Box>
                                                    )}
                                                    {ingredient.name.toLowerCase()}
                                                </Typography>
                                            )
                                        )}
                                    </Box>

                                    {/* Instructions for multi-ingredient substitute */}
                                    {instructions && (
                                        <Typography
                                            sx={{
                                                fontSize: {
                                                    xs: '0.8rem',
                                                    sm: '0.85rem',
                                                },
                                                color: 'text.secondary',
                                                fontStyle: 'italic',
                                                mt: 0.5,
                                                mb: 1,
                                                pl: 0, // Align with bullet list as requested
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {instructions}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </>
                    )}
                </Box>

                {/* Desktop implementation */}
                {!isMobile &&
                    (isSubstituted ? (
                        <IconButton
                            size="small"
                            onClick={handleRevertSubstitution}
                            sx={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                opacity: isHovered ? 1 : 0.6,
                                color: 'text.secondary',
                                '&:hover': {
                                    bgcolor: alpha(
                                        theme.palette.primary.main,
                                        0.08
                                    ),
                                    color: 'primary.main',
                                },
                                transition: 'opacity 0.2s',
                            }}
                        >
                            <UndoIcon fontSize="small" />
                        </IconButton>
                    ) : (
                        <IconButton
                            size="small"
                            onClick={handleOpenSubstitutionPopover}
                            sx={{
                                position: 'absolute',
                                right: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                opacity: isHovered ? 1 : 0,
                                color: 'text.secondary',
                                '&:hover': {
                                    bgcolor: alpha(
                                        theme.palette.primary.main,
                                        0.08
                                    ),
                                    color: 'primary.main',
                                },
                                transition: 'opacity 0.2s',
                            }}
                        >
                            <SwapHorizRoundedIcon fontSize="small" />
                        </IconButton>
                    ))}

                {/* Mobile implementation */}
                {isMobile && (
                    <IconButton
                        size="small"
                        onClick={
                            isSubstituted
                                ? handleRevertSubstitution
                                : handleOpenSubstitutionPopover
                        }
                        sx={{
                            p: '2px',
                            color: isSubstituted
                                ? alpha(theme.palette.primary.main, 0.6)
                                : 'text.secondary',
                            opacity: 0.7,
                            transition: 'opacity 0.2s ease',
                            '&:hover': {
                                color: 'primary.main',
                                opacity: 1,
                                bgcolor: alpha(
                                    theme.palette.primary.main,
                                    0.05
                                ),
                            },
                            position: 'absolute',
                            right: 0,
                            top: '0.5em',
                        }}
                    >
                        {isSubstituted ? (
                            <UndoIcon fontSize="small" />
                        ) : (
                            <SwapHorizRoundedIcon fontSize="small" />
                        )}
                    </IconButton>
                )}
            </Box>

            {/* Substitution popover */}
            {isPopoverOpen && (
                <IngredientSubstitutionPopover
                    open={isPopoverOpen}
                    anchorEl={containerRef.current}
                    onClose={handleCloseSubstitutionPopover}
                    ingredientId={id}
                    ingredientName={originalIngredient?.name || name}
                    ingredientQuantity={getCookFriendlyQuantity(
                        isSubstituted
                            ? originalIngredient?.quantity ?? null
                            : quantity ?? null
                    )}
                    ingredientUnit={originalIngredient?.unit || unit}
                    originalServings={originalServings}
                    currentServings={currentServings}
                    onSubstitute={handleSubstitute}
                    onRevertSubstitution={
                        isSubstituted ? handleRevertSubstitution : undefined
                    }
                    isSubstituted={isSubstituted}
                />
            )}
        </Box>
    );
};

export default IngredientItemWithSubstitutionCookingMode;
