import { FC, useRef, useCallback } from 'react';
import {
    SwipeableDrawer,
    Box,
    Typography,
    IconButton,
    alpha,
    useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AiChatComponent from './AiChatComponent';
import { RecipeChanges } from './index';
import { Recipe } from '../../types/recipe';

interface AiChefDrawerProps {
    open: boolean;
    onClose: () => void;
    onOpen: () => void;
    onApplyChanges: (changes: RecipeChanges) => void;
    onAnimationStart?: () => void;
    currentRecipe?: Recipe;
}

const AiChefDrawer: FC<AiChefDrawerProps> = ({
    open,
    onClose,
    onOpen,
    onApplyChanges,
    onAnimationStart = () => {},
    currentRecipe,
}) => {
    const theme = useTheme();
    const drawerRef = useRef<HTMLDivElement>(null);

    const handleClose = useCallback(() => {
        // Ensure any focused elements within the drawer are blurred
        if (drawerRef.current) {
            const focusedElement = drawerRef.current.querySelector(
                ':focus'
            ) as HTMLElement;
            if (focusedElement) {
                focusedElement.blur();
            }
        }
        // Call the original onClose
        onClose();
    }, [onClose]);

    const handleApplyChanges = (changes: RecipeChanges) => {
        // First trigger animation
        onAnimationStart();

        // Blur any focused element
        if (drawerRef.current) {
            const focusedElement = drawerRef.current.querySelector(
                ':focus'
            ) as HTMLElement;
            if (focusedElement) {
                focusedElement.blur();
            }
        }

        // Close drawer
        onClose();

        // Apply changes after a slight delay to allow drawer to close
        setTimeout(() => {
            onApplyChanges(changes);
        }, 100);
    };

    return (
        <SwipeableDrawer
            anchor="bottom"
            open={open}
            onClose={handleClose}
            onOpen={onOpen}
            disableSwipeToOpen
            disableBackdropTransition
            swipeAreaWidth={0}
            ModalProps={{
                keepMounted: true,
            }}
            PaperProps={{
                sx: {
                    height: {
                        xs: 'calc(80vh)',
                        sm: 'calc(75vh)',
                        md: 'calc(75vh)',
                    },
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    overflow: 'hidden',
                    bgcolor: alpha(theme.palette.paper.main, 0.95),
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
                },
            }}
            ref={drawerRef}
        >
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                        position: 'relative',
                        borderBottom: `1px solid ${alpha(
                            theme.palette.divider,
                            0.1
                        )}`,
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 8,
                            left: 0,
                            right: 0,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <Box
                            sx={{
                                width: 50,
                                height: 5,
                                bgcolor: alpha(theme.palette.divider, 0.3),
                                borderRadius: 4,
                            }}
                        />
                    </Box>

                    <Typography
                        variant="h6"
                        sx={{
                            fontFamily: "'Kalam', cursive",
                            color: 'primary.main',
                            mt: 1,
                        }}
                    >
                        AI Chef Assistant
                    </Typography>

                    <IconButton
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            right: 12,
                            top: 12,
                            color: 'text.secondary',
                            '&:hover': {
                                bgcolor: alpha(theme.palette.divider, 0.1),
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <AiChatComponent
                        onApplyChanges={handleApplyChanges}
                        onAnimationStart={onAnimationStart}
                        currentRecipe={currentRecipe}
                    />
                </Box>
            </Box>
        </SwipeableDrawer>
    );
};

export default AiChefDrawer;
