import React, { FC } from 'react';
import {
    Box,
    Button,
    IconButton,
    Tooltip,
    Fade,
    Zoom,
    Paper,
    Skeleton,
    alpha,
    Theme,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

interface CollectionsDrawerFooterProps {
    isOpen: boolean;
    isLoading: boolean;
    onCreateCollection?: () => void; // Keep optional if applicable
    theme: Theme; // Pass theme explicitly
}

const CollectionsDrawerFooter: FC<CollectionsDrawerFooterProps> = React.memo(
    ({ isOpen, isLoading, onCreateCollection, theme }) => {
        return (
            <Box
                sx={{
                    position: 'sticky',
                    bottom: 0,
                    borderTop: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.08),
                    p: isOpen ? 1.5 : 1,
                    bgcolor: alpha(theme.palette.paper.main, 0.9),
                    backdropFilter: 'blur(8px)',
                    zIndex: 1,
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: theme.transitions.create(['padding'], {
                        easing: theme.transitions.easing.easeInOut,
                        duration: theme.transitions.duration.standard,
                    }),
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        height: '36px',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.8, // Keep opacity for consistency
                    }}
                >
                    {isLoading ? (
                        <>
                            {/* Skeleton for open drawer */}
                            <Fade
                                in={isOpen}
                                timeout={{ enter: 400, exit: 200 }}
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    transitionDelay: isOpen ? '100ms' : '0ms',
                                }}
                                unmountOnExit
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        width: '100%',
                                        height: '36px',
                                        borderRadius: 2,
                                        border: '1px dashed',
                                        borderColor: alpha(
                                            theme.palette.primary.light,
                                            0.3
                                        ),
                                        display: 'flex',
                                        alignItems: 'center',
                                        pl: 1.5,
                                        bgcolor: alpha(
                                            theme.palette.primary.light,
                                            0.04
                                        ),
                                    }}
                                >
                                    <Skeleton
                                        variant="circular"
                                        width={20}
                                        height={20}
                                        animation="pulse"
                                        sx={{
                                            mr: 1,
                                            bgcolor: alpha(
                                                theme.palette.primary.light,
                                                0.1
                                            ),
                                        }}
                                    />
                                    <Skeleton
                                        variant="text"
                                        width="60%"
                                        height={20}
                                        animation="wave"
                                        sx={{
                                            bgcolor: alpha(
                                                theme.palette.primary.light,
                                                0.1
                                            ),
                                        }}
                                    />
                                </Paper>
                            </Fade>

                            {/* Skeleton for collapsed drawer */}
                            <Zoom
                                in={!isOpen}
                                timeout={{ enter: 300, exit: 200 }}
                                style={{
                                    transitionDelay: !isOpen ? '75ms' : '0ms',
                                }}
                                unmountOnExit
                            >
                                <Skeleton
                                    variant="circular"
                                    width={36}
                                    height={36}
                                    animation="pulse"
                                    sx={{
                                        bgcolor: alpha(
                                            theme.palette.primary.light,
                                            0.1
                                        ),
                                        border: '1px dashed',
                                        borderColor: alpha(
                                            theme.palette.primary.light,
                                            0.3
                                        ),
                                    }}
                                />
                            </Zoom>
                        </>
                    ) : (
                        <>
                            <Fade
                                in={isOpen}
                                timeout={{ enter: 400, exit: 200 }}
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    transitionDelay: isOpen ? '100ms' : '0ms',
                                }}
                                unmountOnExit
                            >
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={
                                        <AddRoundedIcon fontSize="small" />
                                    }
                                    fullWidth
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        height: '36px',
                                        py: 0.5,
                                        border: '1px dashed',
                                        borderColor: 'primary.light',
                                        boxShadow: 'none',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        fontSize: '0.9rem',
                                        '&:hover': {
                                            border: '1px dashed',
                                            borderColor: 'primary.dark',
                                            bgcolor: alpha(
                                                theme.palette.primary.main,
                                                0.04
                                            ),
                                        },
                                        '& .MuiButton-startIcon': {
                                            marginRight: 0.5,
                                            transform: 'scale(0.9)',
                                        },
                                    }}
                                    onClick={onCreateCollection}
                                >
                                    New Collection
                                </Button>
                            </Fade>

                            <Zoom
                                in={!isOpen}
                                timeout={{ enter: 300, exit: 200 }}
                                style={{
                                    transitionDelay: !isOpen ? '75ms' : '0ms',
                                }}
                                unmountOnExit
                            >
                                <Tooltip title="New Collection">
                                    <IconButton
                                        color="primary"
                                        size="medium"
                                        sx={{
                                            width: '36px',
                                            height: '36px',
                                            border: '1px dashed',
                                            borderColor: 'primary.light',
                                            padding: 0.75,
                                            '&:hover': {
                                                bgcolor: alpha(
                                                    theme.palette.primary.main,
                                                    0.04
                                                ),
                                                borderColor: 'primary.dark',
                                            },
                                            '& .MuiSvgIcon-root': {
                                                fontSize: '1.25rem',
                                            },
                                        }}
                                        onClick={onCreateCollection}
                                    >
                                        <AddRoundedIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </Zoom>
                        </>
                    )}
                </Box>
            </Box>
        );
    }
);

CollectionsDrawerFooter.displayName = 'CollectionsDrawerFooter';

export default CollectionsDrawerFooter;
