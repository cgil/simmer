import { FC, useState, useRef } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    alpha,
    useTheme,
    useMediaQuery,
    Divider,
} from '@mui/material';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import UndoIcon from '@mui/icons-material/Undo';
import IngredientSubstitutionPopover from './IngredientSubstitutionPopover';
import { SubstituteOption } from '../../types/substitution';
import {
    scaleQuantity,
    formatQuantity,
    getCookFriendlyQuantity,
} from '../../utils/recipe';

// Types for the component props
interface IngredientItemWithSubstitutionProps {
    id: string;
    name: string;
    quantity?: number | null;
    unit?: string | null;
    originalServings: number;
    currentServings: number;
    isSubstituted?: boolean;
    onSubstitute?: (
        ingredientId: string,
        substituteOption: SubstituteOption
    ) => void;
    onRevertSubstitution?: (ingredientId: string) => void;
    // New prop to store original ingredient info when substituted
    originalIngredient?: {
        name: string;
        quantity?: number | null;
        unit?: string | null;
    };
    substituteInfo?: SubstituteOption;
}

const IngredientItemWithSubstitution: FC<
    IngredientItemWithSubstitutionProps
> = ({
    id,
    name,
    quantity,
    unit,
    originalServings,
    currentServings,
    isSubstituted = false,
    onSubstitute,
    onRevertSubstitution,
    originalIngredient,
    substituteInfo,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isItemActive, setIsItemActive] = useState(false); // For mobile active state
    const buttonRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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

    // Handle reverting to original ingredient with propagation stop for mobile
    const handleRevertWithStopPropagation = (
        event: React.MouseEvent<HTMLElement>
    ) => {
        // Stop propagation for mobile to prevent row click
        event.stopPropagation();
        handleRevertSubstitution();
    };

    // Handle substitution selection
    const handleSubstitute = (substituteOption: SubstituteOption) => {
        if (onSubstitute) {
            onSubstitute(id, substituteOption);
        }
        handleCloseSubstitutionPopover();
    };

    // Handle reverting to original ingredient
    const handleRevertSubstitution = () => {
        if (onRevertSubstitution) {
            onRevertSubstitution(id);
        }
        handleCloseSubstitutionPopover();
    };

    // Calculate scaled quantities
    const scaledQuantityNum = scaleQuantity(
        quantity ?? null,
        originalServings,
        currentServings
    );
    const scaledOriginalQuantityNum = scaleQuantity(
        originalIngredient?.quantity ?? null,
        originalServings,
        currentServings
    );

    // Get the final "cook-friendly" numeric values
    const friendlyQuantity = getCookFriendlyQuantity(scaledQuantityNum);
    const friendlyOriginalQuantity = getCookFriendlyQuantity(
        scaledOriginalQuantityNum
    );

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

    // To render a regular ingredient
    const renderRegularIngredient = () => (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography
                component="span"
                sx={{
                    display: 'inline',
                    fontSize: { xs: '1rem', sm: '1.05rem' },
                    lineHeight: 1.5,
                    color: 'text.primary',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
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
            </Typography>
        </Box>
    );

    // To render a substituted ingredient with original at top (strikethrough) and substitution below
    const renderSubstitutedIngredient = () => {
        const isMultiSubstitute =
            substituteInfo &&
            Array.isArray(substituteInfo.ingredients) &&
            substituteInfo.ingredients.length > 1;

        return (
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {/* Original ingredient with strikethrough */}
                <Typography
                    component="div"
                    sx={{
                        fontSize: { xs: '1rem', sm: '1.05rem' },
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
                            {formatQuantity(friendlyOriginalQuantity)}
                            {originalIngredient?.unit &&
                                ` ${originalIngredient?.unit}`}
                        </Box>
                    )}
                    {originalIngredient?.name}
                </Typography>

                {/* Divider */}
                <Divider sx={{ my: 1 }} />

                {/* Substitution label */}
                <Typography
                    component="div"
                    sx={{
                        fontSize: { xs: '0.875rem', sm: '0.95rem' },
                        color: 'primary.main',
                        fontFamily: "'Kalam', cursive",
                        fontWeight: 600,
                        mb: 0.5,
                    }}
                >
                    Substitute with:
                </Typography>

                {/* If it's a single ingredient substitute */}
                {!isMultiSubstitute && substituteInfo?.ingredients[0] && (
                    <Box sx={{ pl: 1, mb: 1 }}>
                        <Typography
                            component="div"
                            sx={{
                                fontSize: {
                                    xs: '1rem',
                                    sm: '1.05rem',
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
                            {getCookFriendlyQuantity(
                                scaleQuantity(
                                    substituteInfo.ingredients[0].quantity ??
                                        null,
                                    originalServings,
                                    currentServings
                                )
                            ) !== null && (
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
                                            scaleQuantity(
                                                substituteInfo.ingredients[0]
                                                    .quantity ?? null,
                                                originalServings,
                                                currentServings
                                            )
                                        )
                                    )}
                                    {substituteInfo.ingredients[0].unit &&
                                        ` ${substituteInfo.ingredients[0].unit}`}
                                </Box>
                            )}
                            {substituteInfo.ingredients[0].name.toLowerCase()}
                        </Typography>
                    </Box>
                )}

                {/* If it's a multi-ingredient substitute */}
                {isMultiSubstitute && substituteInfo?.ingredients && (
                    <Box sx={{ position: 'relative', pl: 1 }}>
                        {/* List of ingredients */}
                        <Box sx={{ mb: 1 }}>
                            {substituteInfo.ingredients.map(
                                (ingredient, idx) => (
                                    <Typography
                                        key={ingredient.id || idx}
                                        component="div"
                                        sx={{
                                            fontSize: {
                                                xs: '1rem',
                                                sm: '1.05rem',
                                            },
                                            color: 'text.primary',
                                            display: 'flex',
                                            mb: 0.5,
                                            wordBreak: 'break-word',
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
                                        {getCookFriendlyQuantity(
                                            scaleQuantity(
                                                ingredient.quantity ?? null,
                                                originalServings,
                                                currentServings
                                            )
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
                                                        scaleQuantity(
                                                            ingredient.quantity ??
                                                                null,
                                                            originalServings,
                                                            currentServings
                                                        )
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
                        {substituteInfo.instructions && (
                            <Typography
                                sx={{
                                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                                    color: 'text.secondary',
                                    fontStyle: 'italic',
                                    mt: 0.5,
                                    mb: 1,
                                    pl: 0, // Align with bullet list
                                    wordBreak: 'break-word',
                                }}
                            >
                                {substituteInfo.instructions}
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'relative',
                mb: 2,
                width: '100%',
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
                    width: '100%',
                    justifyContent: 'space-between',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
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

                    {/* Ingredient content - either regular or substituted */}
                    {isSubstituted
                        ? renderSubstitutedIngredient()
                        : renderRegularIngredient()}
                </Box>

                {/* Swap button for regular ingredients or revert button for substituted ingredients */}
                {!isMobile &&
                    (isSubstituted ? (
                        <Tooltip title="Revert to original ingredient">
                            <IconButton
                                size="small"
                                onClick={handleRevertSubstitution}
                                sx={{
                                    alignSelf: 'flex-start',
                                    opacity: isHovered ? 1 : 0.6,
                                    color: 'text.secondary',
                                    ml: 2,
                                    flexShrink: 0,
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
                        </Tooltip>
                    ) : (
                        <Tooltip title="Find substitutes">
                            <IconButton
                                ref={buttonRef}
                                size="small"
                                onClick={handleOpenSubstitutionPopover}
                                sx={{
                                    alignSelf: 'center',
                                    opacity: isHovered ? 1 : 0,
                                    color: 'text.secondary',
                                    ml: 2,
                                    flexShrink: 0,
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
                        </Tooltip>
                    ))}

                {/* Mobile implementation for the revert button if it exists */}
                {isMobile && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignSelf: 'center', // Center vertically
                            mt: 0,
                            ml: 1,
                            flexShrink: 0,
                        }}
                    >
                        {isSubstituted ? (
                            <IconButton
                                size="small"
                                onClick={handleRevertWithStopPropagation}
                                sx={{
                                    p: '4px', // Slightly larger padding for better tap target
                                    color: alpha(
                                        theme.palette.primary.main,
                                        0.6
                                    ),
                                    opacity: 0.8, // Higher opacity for better visibility
                                    transition: 'all 0.2s ease',
                                    flexShrink: 0,
                                    '&:hover': {
                                        color: 'primary.main',
                                        opacity: 1,
                                        bgcolor: alpha(
                                            theme.palette.primary.main,
                                            0.05
                                        ),
                                    },
                                    '&:active': {
                                        bgcolor: alpha(
                                            theme.palette.primary.main,
                                            0.1
                                        ),
                                    },
                                }}
                            >
                                <UndoIcon fontSize="small" />
                            </IconButton>
                        ) : (
                            <IconButton
                                ref={buttonRef}
                                size="small"
                                onClick={handleOpenSubstitutionPopover}
                                sx={{
                                    p: '4px', // Slightly larger padding for better tap target
                                    color: 'text.secondary',
                                    opacity: 0.8, // Higher opacity for better visibility
                                    transition: 'all 0.2s ease',
                                    flexShrink: 0,
                                    '&:hover': {
                                        color: 'primary.main',
                                        opacity: 1,
                                        bgcolor: alpha(
                                            theme.palette.primary.main,
                                            0.05
                                        ),
                                    },
                                    '&:active': {
                                        bgcolor: alpha(
                                            theme.palette.primary.main,
                                            0.1
                                        ),
                                    },
                                }}
                            >
                                <SwapHorizRoundedIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
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

export default IngredientItemWithSubstitution;
