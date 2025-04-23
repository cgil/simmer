import { FC, useState, useEffect, useCallback } from 'react';
import {
    Grid,
    Typography,
    Box,
    Chip,
    Card,
    CardMedia,
    CardContent,
    Theme,
    Tooltip,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CreateIcon from '@mui/icons-material/DriveFileRenameOutlineOutlined';
import { formatTimeDisplay } from '../../utils/time';
import { Recipe } from '../../types/recipe';
import MatchCornerFold, { MatchType } from './MatchCornerFold';
import ShareBadge from '../sharing/ShareBadge';
import { useDrag, useDrop } from 'react-dnd';
import { ItemTypes, RecipeDragItem } from '../../types/dnd';
import { ALL_RECIPES_ID } from '../../types/collection';
import { memo } from 'react';

// Add a PermissionBadge component to show viewer/editor status
interface PermissionBadgeProps {
    accessLevel: string;
    searchActive: boolean;
    isShared: boolean;
}

const PermissionBadge: FC<PermissionBadgeProps> = ({
    accessLevel,
    searchActive,
    isShared,
}) => {
    // Handle both formats: "editor"/"viewer" and "edit"/"view"
    const isEditor = accessLevel === 'editor' || accessLevel === 'edit';
    const tooltipText = `This recipe is shared with you (${
        isEditor ? 'Editor' : 'Viewer'
    })`;

    return (
        <Tooltip title={tooltipText} placement="top">
            <Box
                sx={{
                    position: 'absolute',
                    top: 8,
                    // Adjust position based on whether there's a search match or share badge
                    right: (() => {
                        // Base position
                        let position = 8;

                        // Move right if there's a share badge
                        if (isShared) position += 28;

                        // Move right if there's a search match corner
                        if (searchActive) position += 32;

                        return position;
                    })(),
                    zIndex: 10,
                    color: 'primary.main',
                    opacity: 0.6,
                    '&:hover': {
                        opacity: 0.9,
                    },
                    transition:
                        'opacity 0.2s ease-in-out, right 0.2s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(2px)',
                }}
            >
                {isEditor ? (
                    <CreateIcon sx={{ fontSize: '0.875rem' }} />
                ) : (
                    <MenuBookIcon sx={{ fontSize: '0.875rem' }} />
                )}
            </Box>
        </Tooltip>
    );
};

export interface DraggableRecipeCardProps {
    recipe: Recipe;
    isLastElement: boolean;
    lastRecipeElementRef: (node: HTMLDivElement | null) => void;
    handleRecipeClick: (recipe: Recipe) => void;
    determineMatchType: (recipe: Recipe, searchQuery: string) => MatchType;
    searchQuery: string;
    selectedCollection: string;
    theme: Theme;
    recipePosition?: number;
    onRecipeReorder?: (
        draggedId: string,
        targetId: string,
        newPosition: number
    ) => void;
    isFirstItem?: boolean;
    isLastItem?: boolean;
}

const DraggableRecipeCard: FC<DraggableRecipeCardProps> = ({
    recipe,
    isLastElement,
    lastRecipeElementRef,
    handleRecipeClick,
    determineMatchType,
    searchQuery,
    selectedCollection,
    theme,
    recipePosition,
    onRecipeReorder,
    isFirstItem = false,
    isLastItem = false,
}) => {
    // Determine match type if search is active
    const matchType = searchQuery
        ? determineMatchType(recipe, searchQuery)
        : null;

    // State to track mouse position for determining left/right drop position
    const [dropPosition, setDropPosition] = useState<'left' | 'right' | null>(
        null
    );

    // Reference for the drag source
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.RECIPE_CARD,
        item: {
            type: ItemTypes.RECIPE_CARD,
            recipeId: recipe.id,
            sourceCollectionId: selectedCollection,
            currentPosition: recipePosition,
            isReordering: selectedCollection !== ALL_RECIPES_ID,
        } as RecipeDragItem,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    // Reference for drop target (to enable reordering within same collection)
    const [{ isOver, canDrop }, drop] = useDrop(
        () => ({
            accept: ItemTypes.RECIPE_CARD,
            canDrop: (item: RecipeDragItem) => {
                return (
                    item.sourceCollectionId === selectedCollection &&
                    selectedCollection !== ALL_RECIPES_ID &&
                    item.recipeId !== recipe.id
                );
            },
            hover: (_item: RecipeDragItem, monitor) => {
                // Get current mouse position
                const clientOffset = monitor.getClientOffset();
                if (!clientOffset) return;

                // Set left/right based on which half of the screen we're in
                const screenMiddleX = window.innerWidth / 2;
                const newPosition =
                    clientOffset.x < screenMiddleX ? 'left' : 'right';
                setDropPosition(newPosition);
            },
            drop: (item: RecipeDragItem) => {
                // Reset drop position after drop
                const position = dropPosition;
                setDropPosition(null);

                // Skip if we don't have the required data
                if (
                    !onRecipeReorder ||
                    !item.recipeId ||
                    item.sourceCollectionId !== selectedCollection ||
                    selectedCollection === ALL_RECIPES_ID ||
                    recipePosition === undefined
                ) {
                    return;
                }

                // All checks passed, item.recipeId and recipe.id are both defined strings
                const safeRecipeId = item.recipeId as string;
                const safeTargetId = recipe.id as string;

                // Special handling for first and last positions
                if (position === 'left' && isFirstItem) {
                    // When dropping at the left of the first item, use a position before this item
                    onRecipeReorder(
                        safeRecipeId,
                        safeTargetId,
                        recipePosition - 1000
                    );
                } else if (position === 'right' && isLastItem) {
                    // When dropping at the right of the last item, use a position after this item
                    onRecipeReorder(
                        safeRecipeId,
                        safeTargetId,
                        recipePosition + 1000
                    );
                } else {
                    // Normal case - use the current recipe's position
                    onRecipeReorder(safeRecipeId, safeTargetId, recipePosition);
                }
            },
            collect: (monitor) => ({
                isOver: !!monitor.isOver(),
                canDrop: !!monitor.canDrop(),
            }),
        }),
        [
            selectedCollection,
            recipe.id,
            recipePosition,
            onRecipeReorder,
            isLastItem,
            isFirstItem,
            dropPosition,
        ]
    );

    // Combine drag and drop refs using React DnD's method
    const dragDropRef = useCallback(
        (node: HTMLDivElement | null) => {
            // Apply the drag and drop refs
            drag(node);
            drop(node);

            // Apply the last element ref if needed
            if (isLastElement && node) {
                lastRecipeElementRef(node);
            }
        },
        [drag, drop, isLastElement, lastRecipeElementRef]
    );

    // Reset drop position when no longer over the component
    useEffect(() => {
        if (!isOver) {
            setDropPosition(null);
        }
    }, [isOver]);

    return (
        <Grid
            item
            xs={1}
            key={recipe.id}
            ref={dragDropRef}
            sx={{
                opacity: isDragging ? 0.5 : 1,
                cursor: 'move',
                transition: theme.transitions.create('opacity', {
                    duration: theme.transitions.duration.short,
                }),
                position: 'relative',
                // Left highlight
                ...(canDrop && isOver && dropPosition === 'left'
                    ? {
                          '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: '10%',
                              left: 10,
                              width: 2,
                              height: '80%',
                              backgroundColor: theme.palette.primary.light,
                              borderRadius: 4,
                              zIndex: 10,
                              opacity: 0.5,
                          },
                      }
                    : {}),
                // Right highlight
                ...(canDrop && isOver && dropPosition === 'right'
                    ? {
                          '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: '10%',
                              right: -12,
                              width: 2,
                              height: '80%',
                              backgroundColor: theme.palette.primary.light,
                              borderRadius: 4,
                              zIndex: 10,
                              opacity: 0.5,
                          },
                      }
                    : {}),
                // Special case for first item - left edge
                ...(canDrop && isOver && dropPosition === 'left' && isFirstItem
                    ? {
                          '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: '10%',
                              left: 10,
                              width: 2,
                              height: '80%',
                              backgroundColor: theme.palette.primary.light,
                              borderRadius: 4,
                              zIndex: 10,
                              opacity: 0.5,
                          },
                      }
                    : {}),
                // Special case for last item - right edge
                ...(canDrop && isOver && dropPosition === 'right' && isLastItem
                    ? {
                          '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: '10%',
                              right: -10,
                              width: 2,
                              height: '80%',
                              backgroundColor: theme.palette.primary.light,
                              borderRadius: 4,
                              zIndex: 10,
                              opacity: 0.5,
                          },
                      }
                    : {}),
            }}
        >
            <div // Non-draggable container for the last element ref
                ref={isLastElement ? lastRecipeElementRef : null}
                style={{ height: '100%' }} // Ensure div takes full height for Card
            >
                <Card
                    onClick={() => handleRecipeClick(recipe)}
                    sx={{
                        position: 'relative',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        borderRadius: 1,
                        overflow: 'hidden',
                        boxShadow: `
                            0 1px 2px rgba(0,0,0,0.03),
                            0 4px 20px rgba(0,0,0,0.06),
                            inset 0 0 0 1px rgba(255,255,255,0.9)
                        `,
                        transition: 'all 0.15s ease-in-out',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
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
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            borderColor: 'rgba(44, 62, 80, 0.15)',
                        },
                        // Apply subtle elevation when being targeted
                        ...(canDrop && isOver
                            ? {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.09)',
                                  transition: 'all 0.2s ease-out',
                              }
                            : {}),
                    }}
                >
                    {/* Match Corner Fold - only appears during search */}
                    {searchQuery && <MatchCornerFold matchType={matchType} />}

                    {recipe.images && recipe.images.length > 0 ? (
                        <CardMedia
                            component="img"
                            height="180"
                            image={recipe.images[0]}
                            alt={recipe.title}
                            sx={{
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <Box
                            sx={{
                                height: 180,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                                position: 'relative',
                                overflow: 'hidden',
                                padding: 2,
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundImage: `repeating-linear-gradient(
                                        -45deg,
                                        rgba(255, 255, 255, 0.3),
                                        rgba(255, 255, 255, 0.3) 5px,
                                        transparent 5px,
                                        transparent 10px
                                    )`,
                                    opacity: 0.5,
                                },
                                '&::after': {
                                    content: `"${
                                        recipe.title.length > 20
                                            ? recipe.title.substring(0, 20) +
                                              '...'
                                            : recipe.title
                                    }"`,
                                    position: 'absolute',
                                    fontFamily: "'Kalam', cursive",
                                    fontSize: '1.75rem',
                                    color: theme.palette.primary.main,
                                    opacity: 0.15,
                                    transform: 'rotate(-5deg)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    textAlign: 'center',
                                    width: '100%',
                                    maxWidth: '90%',
                                    left: '5%',
                                    right: '5%',
                                },
                            }}
                        />
                    )}
                    <CardContent
                        sx={{
                            flexGrow: 1,
                            p: { xs: 2, sm: 3 },
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Typography
                            variant="h6"
                            component="h2"
                            gutterBottom
                            sx={{
                                fontWeight: 600,
                                fontSize: {
                                    xs: '1.1rem',
                                    sm: '1.25rem',
                                },
                                mb: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                fontFamily: "'Kalam', cursive",
                                color: 'primary.main',
                            }}
                        >
                            {recipe.title}
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{
                                mb: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                fontSize: {
                                    xs: '0.875rem',
                                    sm: '1rem',
                                },
                                minHeight: {
                                    xs: '40px',
                                    sm: '48px',
                                },
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {recipe.description}
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 0.75,
                                flexWrap: 'wrap',
                                mb: 1,
                                mt: 'auto',
                            }}
                        >
                            {recipe.tags &&
                                recipe.tags.length > 0 &&
                                recipe.tags.slice(0, 3).map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        size="small"
                                        color="secondary"
                                        sx={{
                                            fontSize: '0.75rem',
                                            height: '24px',
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    />
                                ))}
                            {recipe.tags && recipe.tags.length > 3 && (
                                <Chip
                                    label={`+${recipe.tags.length - 3}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        fontSize: '0.75rem',
                                        height: '24px',
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                />
                            )}
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: {
                                    xs: 1.5,
                                    sm: 2,
                                },
                                mt: 2,
                                pt: 2,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                }}
                            >
                                <RestaurantIcon
                                    sx={{
                                        fontSize: {
                                            xs: '1rem',
                                            sm: '1.25rem',
                                        },
                                        color: 'primary.main',
                                    }}
                                />
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        fontSize: {
                                            xs: '0.75rem',
                                            sm: '0.875rem',
                                        },
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    {recipe.servings} servings
                                </Typography>
                            </Box>
                            {recipe.time_estimate && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                    }}
                                >
                                    <AccessTimeIcon
                                        sx={{
                                            fontSize: {
                                                xs: '1rem',
                                                sm: '1.25rem',
                                            },
                                            color: 'primary.main',
                                        }}
                                    />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            fontSize: {
                                                xs: '0.75rem',
                                                sm: '0.875rem',
                                            },
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        {formatTimeDisplay(
                                            recipe.time_estimate.total
                                        )}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                    {recipe.is_shared && (
                        <ShareBadge tooltipText="This recipe is shared" />
                    )}

                    {/* Add Permission Badge for recipes shared with the user */}
                    {recipe.shared_with_me &&
                        recipe.access_level &&
                        recipe.access_level !== 'owner' && (
                            <PermissionBadge
                                accessLevel={recipe.access_level}
                                searchActive={!!searchQuery}
                                isShared={!!recipe.is_shared}
                            />
                        )}
                </Card>
            </div>
        </Grid>
    );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(DraggableRecipeCard);
