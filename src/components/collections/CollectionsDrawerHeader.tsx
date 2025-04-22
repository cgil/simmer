import React, { FC } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    alpha,
    Theme,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';

interface CollectionsDrawerHeaderProps {
    isOpen: boolean;
    handleToggleDrawer: () => void;
    theme: Theme; // Pass theme explicitly if needed outside styled components
}

const CollectionsDrawerHeader: FC<CollectionsDrawerHeaderProps> = React.memo(
    ({ isOpen, handleToggleDrawer, theme }) => {
        return (
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    bgcolor: alpha(theme.palette.paper.main, 0.9),
                    backdropFilter: 'blur(8px)',
                    p: 2,
                    pr: isOpen ? 1 : 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isOpen ? 'space-between' : 'center',
                    height: { xs: 57, sm: 65 }, // Match header height
                }}
            >
                {isOpen && (
                    <Typography
                        variant="h6"
                        sx={{
                            fontFamily: "'Kalam', cursive",
                            color: 'primary.main',
                            pl: 1,
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                            // Ensure text doesn't wrap unnecessarily
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        Collections
                    </Typography>
                )}
                <Tooltip title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
                    <IconButton
                        onClick={handleToggleDrawer}
                        color="primary"
                        aria-label={
                            isOpen
                                ? 'collapse collections'
                                : 'expand collections'
                        }
                        aria-expanded={isOpen}
                        aria-controls="collections-drawer"
                        sx={{
                            '&:hover': {
                                bgcolor: alpha(
                                    theme.palette.primary.main,
                                    0.08
                                ),
                                borderRadius: 2,
                            },
                        }}
                    >
                        {isOpen ? <MenuOpenRoundedIcon /> : <MenuRoundedIcon />}
                    </IconButton>
                </Tooltip>
            </Box>
        );
    }
);

// Add display name for easier debugging
CollectionsDrawerHeader.displayName = 'CollectionsDrawerHeader';

export default CollectionsDrawerHeader;
