import { FC, useState } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Switch,
    TextField,
    Box,
    Typography,
    InputAdornment,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { RecipeService } from '../../../services/RecipeService';
import { Recipe } from '../../../types/recipe';
import { useAuth } from '../../../context/AuthContext';

interface ShareButtonProps {
    recipe: Recipe;
    onRecipeUpdated?: (updatedRecipe: Recipe) => void;
}

const ShareButton: FC<ShareButtonProps> = ({ recipe, onRecipeUpdated }) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isPublic, setIsPublic] = useState(recipe.is_public || false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Build share URL using window location
    const shareUrl = `${window.location.origin}/recipe/${recipe.id}`;

    const handleOpenDialog = () => {
        setIsOpen(true);
    };

    const handleCloseDialog = () => {
        setIsOpen(false);
    };

    const handleTogglePublic = async () => {
        if (!user || !recipe.id) return;

        setIsUpdating(true);
        try {
            // Update recipe public status
            const success = await RecipeService.updateRecipePublicStatus(
                recipe.id,
                !isPublic,
                user.id
            );

            if (success) {
                // Update local state
                setIsPublic(!isPublic);

                // Update parent component if callback provided
                if (onRecipeUpdated) {
                    const updatedRecipe = { ...recipe, is_public: !isPublic };
                    onRecipeUpdated(updatedRecipe);
                }
            }
        } catch (error) {
            console.error('Error updating recipe public status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setCopySuccess(true);

            // Reset copy icon after 2 seconds
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    return (
        <>
            <Button
                variant="outlined"
                color="primary"
                startIcon={<SendIcon sx={{ transform: 'rotate(-45deg)' }} />}
                onClick={handleOpenDialog}
                sx={{
                    borderRadius: 1,
                    textTransform: 'none',
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                Share
            </Button>

            {/* Share Dialog */}
            <Dialog
                open={isOpen}
                onClose={handleCloseDialog}
                aria-labelledby="share-dialog-title"
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    elevation: 3,
                    sx: {
                        borderRadius: 1,
                        padding: 1,
                    },
                }}
            >
                <DialogTitle
                    id="share-dialog-title"
                    sx={{
                        fontFamily: "'Kalam', cursive",
                        color: 'primary.main',
                    }}
                >
                    Share Recipe
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                mb: 1,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Recipe Visibility
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isPublic}
                                    onChange={handleTogglePublic}
                                    disabled={isUpdating}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography
                                    sx={{
                                        fontFamily: "'Inter', sans-serif",
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {isUpdating ? (
                                        <CircularProgress
                                            size={16}
                                            sx={{ mr: 1 }}
                                        />
                                    ) : null}
                                    {isPublic
                                        ? 'Anyone with the link can view this recipe'
                                        : 'Only you can view this recipe'}
                                </Typography>
                            }
                        />
                    </Box>

                    {isPublic ? (
                        <Box>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    mb: 1,
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                Share Link
                            </Typography>

                            <TextField
                                fullWidth
                                value={shareUrl}
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Button
                                                onClick={handleCopyLink}
                                                color="primary"
                                                size="small"
                                                startIcon={
                                                    copied ? (
                                                        <CheckCircleIcon />
                                                    ) : (
                                                        <ContentCopyIcon />
                                                    )
                                                }
                                                sx={{
                                                    borderRadius: 1,
                                                    textTransform: 'none',
                                                    fontFamily:
                                                        "'Inter', sans-serif",
                                                }}
                                            >
                                                {copied ? 'Copied!' : 'Copy'}
                                            </Button>
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        fontFamily: "'Inter', sans-serif",
                                        borderRadius: 1,
                                    },
                                }}
                            />
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                backgroundColor: 'info.lighter',
                                p: 2,
                                borderRadius: 1,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    color: 'info.main',
                                }}
                            >
                                Enable public access to create a shareable link
                                that anyone can view, even without logging in.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={handleCloseDialog}
                        color="inherit"
                        sx={{
                            borderRadius: 1,
                            textTransform: 'none',
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success notification */}
            <Snackbar
                open={copySuccess}
                autoHideDuration={3000}
                onClose={() => setCopySuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setCopySuccess(false)}
                    severity="success"
                    sx={{ width: '100%', fontFamily: "'Inter', sans-serif" }}
                >
                    Link copied to clipboard!
                </Alert>
            </Snackbar>
        </>
    );
};

export default ShareButton;
