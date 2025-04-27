import React, { FC } from 'react';
import {
    Box,
    Paper,
    Slide,
    Typography,
    IconButton,
    Zoom,
    alpha,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

interface CollectionListItemDeleteConfirmProps {
    collectionId: string;
    deletingCollection: string | null;
    onDeleteCollection: (id: string) => void;
    onCancelDelete: () => void;
    containerRef: React.RefObject<HTMLDivElement>; // Container for Slide animation
    itemHeight: string;
}

const CollectionListItemDeleteConfirm: FC<CollectionListItemDeleteConfirmProps> =
    React.memo(
        ({
            collectionId,
            deletingCollection,
            onDeleteCollection,
            onCancelDelete,
            containerRef,
            itemHeight,
        }) => {
            return (
                <Slide
                    direction="left"
                    in={deletingCollection === collectionId}
                    timeout={300}
                    mountOnEnter
                    unmountOnExit
                    container={containerRef.current} // Use the passed ref
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 5,
                            display: 'flex',
                            alignItems: 'center',
                            pr: 0,
                        }}
                    >
                        <Paper
                            elevation={2}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                height: itemHeight, // Use passed height
                                p: 1,
                                backgroundColor: '#ffebee', // Consider theme color if needed
                                border: '1px solid',
                                borderColor: '#ef9a9a', // Consider theme color if needed
                                borderRadius: 2,
                                animation: 'pulse-delete 1.5s ease-in-out',
                                '@keyframes pulse-delete': {
                                    '0%': {
                                        boxShadow:
                                            '0 0 0 0 rgba(239, 154, 154, 0.4)',
                                    },
                                    '70%': {
                                        boxShadow:
                                            '0 0 0 6px rgba(239, 154, 154, 0)',
                                    },
                                    '100%': {
                                        boxShadow:
                                            '0 0 0 0 rgba(239, 154, 154, 0)',
                                    },
                                },
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    pl: 1,
                                    color: '#d32f2f', // Consider theme color if needed
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                Delete collection?
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0 }}>
                                <Zoom
                                    in={true}
                                    timeout={200}
                                    style={{ transitionDelay: '150ms' }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            onDeleteCollection(collectionId)
                                        }
                                        aria-label="Confirm delete collection"
                                        sx={{
                                            color: alpha('#d32f2f', 0.8), // Adjusted color
                                            transition:
                                                'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                bgcolor: alpha('#ffebee', 0.5), // Adjusted hover
                                                transform: 'scale(1.1)',
                                            },
                                        }}
                                    >
                                        <CheckRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Zoom>
                                <Zoom
                                    in={true}
                                    timeout={200}
                                    style={{ transitionDelay: '250ms' }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={onCancelDelete}
                                        aria-label="Cancel delete collection"
                                        sx={{
                                            color: alpha('#d32f2f', 0.8), // Adjusted color
                                            transition:
                                                'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                bgcolor: alpha('#ffebee', 0.5), // Adjusted hover
                                                transform: 'scale(1.1)',
                                            },
                                        }}
                                    >
                                        <CloseRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Zoom>
                            </Box>
                        </Paper>
                    </Box>
                </Slide>
            );
        }
    );

CollectionListItemDeleteConfirm.displayName = 'CollectionListItemDeleteConfirm';

export default CollectionListItemDeleteConfirm;
