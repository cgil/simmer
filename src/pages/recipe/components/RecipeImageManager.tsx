import React, { useState, useRef, DragEvent } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { generateUuidV4 } from '../../../utils/uuid';
import {
    UploadService,
    ImageUploadState,
} from '../../../services/UploadService';

// Define allowed image types for validation
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
];

interface RecipeImageManagerProps {
    imageUploads: ImageUploadState[];
    setImageUploads: React.Dispatch<React.SetStateAction<ImageUploadState[]>>;
    images: string[];
    setImages: React.Dispatch<React.SetStateAction<string[]>>;
    isNewRecipe: boolean;
    title: string;
    onGenerateAiImage: () => Promise<void>;
    isGeneratingAiImage: boolean;
    isMobileDevice: boolean;
}

const RecipeImageManager: React.FC<RecipeImageManagerProps> = ({
    imageUploads,
    setImageUploads,
    images,
    setImages,
    isNewRecipe,
    title,
    onGenerateAiImage,
    isGeneratingAiImage,
    isMobileDevice,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleMoveImage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= imageUploads.length) return;

        // Move the image in imageUploads array
        const newImageUploads = [...imageUploads];
        const [movedImage] = newImageUploads.splice(fromIndex, 1);
        newImageUploads.splice(toIndex, 0, movedImage);
        setImageUploads(newImageUploads);

        // Update images array with permanent URLs
        const permanentUrls = newImageUploads
            .filter((img) => img.status === 'success' && img.permanentUrl)
            .map((img) => img.permanentUrl as string);
        setImages(permanentUrls);
    };

    const handleImageUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        // Create an array to store the new uploads
        const newUploads: ImageUploadState[] = [];

        // Process each file
        Array.from(files).forEach((file) => {
            // Validate file type
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                console.warn(
                    `Skipping unsupported file type: ${file.name} (${file.type})`
                );
                return;
            }

            // Validate file size (5MB limit example)
            if (file.size > 5 * 1024 * 1024) {
                console.warn(
                    `Skipping large file: ${file.name} (${(
                        file.size /
                        1024 /
                        1024
                    ).toFixed(2)}MB)`
                );
                return;
            }

            // Create a unique ID and preview URL for this upload
            const newImageId = generateUuidV4();
            const previewUrl = URL.createObjectURL(file);

            // Add to the array of new uploads
            newUploads.push({
                id: newImageId,
                file,
                previewUrl,
                status: 'pending' as const,
            });
        });

        if (newUploads.length === 0) return;

        // Add all new uploads to state
        setImageUploads((prevUploads) => [...prevUploads, ...newUploads]);

        // Start the upload process for each new upload
        newUploads.forEach((upload) => {
            if (upload.file) {
                startImageUploadProcess(upload.id, upload.file);
            }
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleImageUpload(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleAddImageClick = async () => {
        if (isMobileDevice) {
            galleryInputRef.current?.click();
        } else {
            fileInputRef.current?.click();
        }
    };

    // Helper function to initiate and manage the upload steps for a single image
    const startImageUploadProcess = async (imageId: string, file: File) => {
        try {
            // 1. Set status to 'uploading'
            setImageUploads((prev) =>
                prev.map((img) =>
                    img.id === imageId
                        ? {
                              ...img,
                              status: 'uploading' as const,
                              error: undefined,
                          }
                        : img
                )
            );

            // 2. Upload file via Edge function
            const { permanentUrl } = await UploadService.uploadFileViaFunction(
                file
            );

            // 3. Update state on success
            setImageUploads((prev) => {
                const updatedUploads = prev.map((img) =>
                    img.id === imageId
                        ? {
                              ...img,
                              status: 'success' as const,
                              permanentUrl,
                              file: undefined, // Remove file object after success to free memory
                          }
                        : img
                );

                // Also update the images array used for saving
                const permanentUrls = updatedUploads
                    .filter(
                        (img) => img.status === 'success' && img.permanentUrl
                    )
                    .map((img) => img.permanentUrl as string);
                setImages(permanentUrls);

                return updatedUploads;
            });
        } catch (err) {
            console.error(`Upload failed for image ${imageId}:`, err);
            // 5. Update state on error
            setImageUploads((prev) =>
                prev.map((img) =>
                    img.id === imageId
                        ? {
                              ...img,
                              status: 'error' as const,
                              error:
                                  err instanceof Error
                                      ? err.message
                                      : 'Upload failed',
                          }
                        : img
                )
            );
        }
    };

    // Function to allow retrying a failed upload
    const handleRetryUpload = (imageId: string) => {
        const imageToRetry = imageUploads.find((img) => img.id === imageId);
        if (imageToRetry?.file && imageToRetry.status === 'error') {
            startImageUploadProcess(imageId, imageToRetry.file);
        } else {
            console.warn(
                `Could not retry upload for image ID: ${imageId}. Invalid state or file missing.`
            );
        }
    };

    // Add function to delete an image by ID
    const handleDeleteImage = (imageId: string) => {
        setImageUploads((prevUploads) => {
            // Find the image to delete
            const imageToDelete = prevUploads.find((img) => img.id === imageId);

            // If the image has a preview URL, revoke it to free memory
            if (imageToDelete?.previewUrl) {
                URL.revokeObjectURL(imageToDelete.previewUrl);
            }

            // Filter out the deleted image
            const updatedUploads = prevUploads.filter(
                (img) => img.id !== imageId
            );

            // Update the images array with permanent URLs
            const permanentUrls = updatedUploads
                .filter((img) => img.status === 'success' && img.permanentUrl)
                .map((img) => img.permanentUrl as string);
            setImages(permanentUrls);

            return updatedUploads;
        });
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

            {/* AI Image Generation Button - Show only for new recipes with no images */}
            {isNewRecipe && images.length === 0 && title.trim() && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: { xs: 12, sm: 16 },
                        right: { xs: 12, sm: 16 },
                        zIndex: 2,
                    }}
                >
                    <Tooltip title="Generate an AI image based on your recipe title">
                        <Button
                            onClick={onGenerateAiImage}
                            variant="outlined"
                            size="small"
                            disabled={isGeneratingAiImage}
                            startIcon={
                                isGeneratingAiImage ? (
                                    <CircularProgress
                                        size={16}
                                        color="inherit"
                                    />
                                ) : (
                                    <AutoAwesomeIcon fontSize="small" />
                                )
                            }
                            sx={{
                                fontFamily: "'Inter', sans-serif",
                                borderRadius: 1,
                                textTransform: 'none',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                padding: '4px 10px',
                                borderColor: 'divider',
                                color: 'text.primary',
                                bgcolor: 'background.paper',
                                boxShadow: 'none',
                                '&:hover': {
                                    borderColor: 'divider',
                                    bgcolor: 'action.hover',
                                    color: 'text.primary',
                                },
                            }}
                        >
                            {isGeneratingAiImage ? 'Sketching...' : 'Sketch It'}
                        </Button>
                    </Tooltip>
                </Box>
            )}

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
                {imageUploads.map((imageState, index) => (
                    <Box
                        key={imageState.id}
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
                        {/* Show image based on status */}
                        {imageState.status === 'success' ? (
                            <Box
                                component="img"
                                src={imageState.permanentUrl}
                                alt={`Recipe image ${index + 1}`}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        ) : imageState.previewUrl ? (
                            <Box
                                component="img"
                                src={imageState.previewUrl}
                                alt={`Recipe image ${index + 1} (preview)`}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    opacity:
                                        imageState.status === 'uploading'
                                            ? 0.7
                                            : 1,
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'background.paper',
                                }}
                            >
                                <ImageIcon
                                    sx={{
                                        fontSize: 40,
                                        color: 'text.disabled',
                                    }}
                                />
                            </Box>
                        )}

                        {/* Loading indicator */}
                        {imageState.status === 'uploading' && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'rgba(255, 255, 255, 0.5)',
                                }}
                            >
                                <CircularProgress size={40} />
                            </Box>
                        )}

                        {/* Error overlay */}
                        {imageState.status === 'error' && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'rgba(255, 0, 0, 0.7)',
                                    color: 'white',
                                    p: 2,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        mb: 2,
                                        textAlign: 'center',
                                    }}
                                >
                                    Upload Failed
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        mb: 2,
                                        textAlign: 'center',
                                    }}
                                >
                                    {imageState.error || 'Unknown error'}
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() =>
                                        handleRetryUpload(imageState.id)
                                    }
                                    sx={{
                                        bgcolor: 'white',
                                        color: 'error.main',
                                    }}
                                >
                                    Retry
                                </Button>
                            </Box>
                        )}

                        {/* Action buttons */}
                        {(imageState.status === 'success' ||
                            imageState.status === 'pending') && (
                            <Box
                                className="image-actions"
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1,
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease-in-out',
                                }}
                            >
                                <IconButton
                                    onClick={() =>
                                        handleMoveImage(index, index - 1)
                                    }
                                    disabled={index === 0}
                                    size="small"
                                    sx={{
                                        color: 'white',
                                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.7)',
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
                                        handleDeleteImage(imageState.id)
                                    }
                                    size="small"
                                    sx={{
                                        color: 'white',
                                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                                        },
                                    }}
                                >
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    onClick={() =>
                                        handleMoveImage(index, index + 1)
                                    }
                                    disabled={index === imageUploads.length - 1}
                                    size="small"
                                    sx={{
                                        color: 'white',
                                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                                        },
                                        '&.Mui-disabled': {
                                            opacity: 0.3,
                                        },
                                    }}
                                >
                                    <ArrowForwardIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}
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
                        onChange={(e) => handleImageUpload(e.target.files)}
                        style={{ display: 'none' }}
                    />
                    <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e.target.files)}
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
                        <AddPhotoAlternateIcon sx={{ fontSize: 24 }} />
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Inter', sans-serif",
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
    );
};

export default React.memo(RecipeImageManager);
