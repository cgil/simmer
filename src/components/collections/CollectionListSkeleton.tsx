import React, { FC } from 'react';
import {
    Box,
    List,
    ListItem,
    Paper,
    Skeleton,
    alpha,
    Theme,
} from '@mui/material';

interface CollectionListSkeletonProps {
    isOpen: boolean;
    itemCount?: number;
    itemHeight: string; // Pass height as prop for consistency
    theme: Theme;
}

const CollectionListSkeleton: FC<CollectionListSkeletonProps> = React.memo(
    ({ isOpen, itemCount = 5, itemHeight, theme }) => {
        return (
            <List sx={{ px: isOpen ? 1 : 0.75, pt: 1 }}>
                {Array.from({ length: itemCount }).map((_, index) => (
                    <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                        <Box
                            sx={{
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    width: '100%',
                                    height: itemHeight,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: isOpen
                                        ? 'flex-start'
                                        : 'center',
                                    bgcolor: alpha(
                                        theme.palette.primary.light,
                                        0.04
                                    ),
                                }}
                            >
                                {isOpen ? (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            width: '100%',
                                            px: 2,
                                        }}
                                    >
                                        <Skeleton
                                            variant="circular"
                                            width={24}
                                            height={24}
                                            animation="pulse"
                                            sx={{
                                                mr: 2,
                                                bgcolor: alpha(
                                                    theme.palette.primary.light,
                                                    0.1
                                                ),
                                            }}
                                        />
                                        <Box sx={{ width: '100%' }}>
                                            <Skeleton
                                                variant="text"
                                                width="60%"
                                                height={20}
                                                animation="wave"
                                                sx={{
                                                    bgcolor: alpha(
                                                        theme.palette.primary
                                                            .light,
                                                        0.1
                                                    ),
                                                }}
                                            />
                                            <Skeleton
                                                variant="text"
                                                width="40%"
                                                height={16}
                                                animation="wave"
                                                sx={{
                                                    bgcolor: alpha(
                                                        theme.palette.primary
                                                            .light,
                                                        0.07
                                                    ),
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                ) : (
                                    <Skeleton
                                        variant="circular"
                                        width={32}
                                        height={32}
                                        animation="pulse"
                                        sx={{
                                            bgcolor: alpha(
                                                theme.palette.primary.light,
                                                0.1
                                            ),
                                        }}
                                    />
                                )}
                            </Paper>
                        </Box>
                    </ListItem>
                ))}
            </List>
        );
    }
);

CollectionListSkeleton.displayName = 'CollectionListSkeleton';

export default CollectionListSkeleton;
