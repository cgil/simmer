import { FC, ReactNode, useState } from 'react';
import {
    AppBar,
    Box,
    Container,
    Toolbar,
    Typography,
    useTheme,
    useMediaQuery,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../../context/AuthContext';
interface AppLayoutProps {
    children: ReactNode;
    headerContent?: ReactNode;
    showAddButton?: boolean;
    showCookingButton?: boolean;
    onCookingClick?: () => void;
    actionButton?: ReactNode;
}

const AppLayout: FC<AppLayoutProps> = ({
    children,
    headerContent,
    showAddButton = false,
    showCookingButton = false,
    onCookingClick,
    actionButton,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    // User menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleUserMenuClose();
        await signOut();
        navigate('/login');
    };

    const handleSignIn = () => {
        navigate('/login');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                width: '100vw',
                maxWidth: '100%',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: 'paper.light',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    width: '100%',
                    borderRadius: 0,
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: theme.zIndex.appBar,
                    backdropFilter: 'blur(8px)',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        boxShadow: 'inset 0 0 30px rgba(62, 28, 0, 0.05)',
                        pointerEvents: 'none',
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.8,
                        pointerEvents: 'none',
                        backgroundImage: `
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.05) 0.5px, transparent 0.5px),
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '6px 6px, 14px 14px',
                        backgroundPosition: '0 0',
                        mixBlendMode: 'multiply',
                        filter: 'opacity(1)',
                    },
                }}
            >
                <Container maxWidth={false} disableGutters>
                    <Toolbar
                        disableGutters
                        sx={{
                            height: { xs: 56, sm: 64 },
                            gap: { xs: 1, sm: 2 },
                            px: { xs: 2, sm: 3, md: 4 },
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flex: 1,
                            }}
                        >
                            {headerContent || (
                                <Link
                                    to="/"
                                    style={{
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography
                                        variant={isMobile ? 'h6' : 'h5'}
                                        component="h1"
                                        sx={{
                                            fontWeight: 700,
                                            color: 'primary.main',
                                            letterSpacing: '-0.5px',
                                            fontFamily: "'Kalam', cursive",
                                        }}
                                    >
                                        Simmer
                                    </Typography>
                                </Link>
                            )}
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                alignItems: 'center',
                            }}
                        >
                            {showCookingButton && (
                                <Button
                                    variant="contained"
                                    onClick={onCookingClick}
                                    startIcon={
                                        <RestaurantIcon
                                            sx={{
                                                fontSize: { xs: 20, sm: 22 },
                                            }}
                                        />
                                    }
                                    sx={{
                                        height: { xs: 38, sm: 42 },
                                        px: { xs: 1.5, sm: 2.5 },
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                        fontWeight: 600,
                                        fontSize: {
                                            xs: '0.875rem',
                                            sm: '0.9375rem',
                                        },
                                        fontFamily: "'Inter', sans-serif",
                                        letterSpacing: '0.01em',
                                        textTransform: 'none',
                                        boxShadow: `
                                            0 1px 2px rgba(0,0,0,0.03),
                                            0 4px 20px rgba(0,0,0,0.06),
                                            inset 0 0 0 1px rgba(255,255,255,0.9)
                                        `,
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                            transform: 'translateY(-1px)',
                                            boxShadow: `
                                                0 2px 4px rgba(0,0,0,0.05),
                                                0 6px 24px rgba(0,0,0,0.08),
                                                inset 0 0 0 1px rgba(255,255,255,0.9)
                                            `,
                                        },
                                    }}
                                >
                                    {isMobile ? '' : 'Start Cooking'}
                                </Button>
                            )}

                            {/* Display the action button if provided */}
                            {actionButton}

                            {user && showAddButton && (
                                <Button
                                    variant="contained"
                                    onClick={() => navigate('/recipe/new')}
                                    startIcon={
                                        <AddIcon
                                            sx={{
                                                fontSize: { xs: 20, sm: 22 },
                                            }}
                                        />
                                    }
                                    sx={{
                                        height: { xs: 38, sm: 42 },
                                        px: { xs: 1.5, sm: 2.5 },
                                        bgcolor: 'secondary.main',
                                        color: 'text.primary',
                                        fontWeight: 600,
                                        fontSize: {
                                            xs: '0.875rem',
                                            sm: '0.9375rem',
                                        },
                                        fontFamily: "'Kalam', cursive",
                                        letterSpacing: '0.01em',
                                        textTransform: 'none',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderBottom: '2px solid',
                                        borderBottomColor: 'divider',
                                        boxShadow: 'none',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            bgcolor: 'secondary.light',
                                            transform: 'translateY(-1px)',
                                            borderColor:
                                                'rgba(44, 62, 80, 0.15)',
                                            boxShadow:
                                                '0 1px 3px rgba(44, 62, 80, 0.1)',
                                            '& .MuiSvgIcon-root': {
                                                transform: 'rotate(90deg)',
                                            },
                                        },
                                    }}
                                >
                                    {isMobile ? '' : 'New Recipe'}
                                </Button>
                            )}

                            {/* User Account Menu for authenticated users */}
                            {user ? (
                                <>
                                    <IconButton
                                        onClick={handleUserMenuClick}
                                        size="small"
                                        aria-controls={
                                            open ? 'user-menu' : undefined
                                        }
                                        aria-haspopup="true"
                                        aria-expanded={
                                            open ? 'true' : undefined
                                        }
                                        sx={{
                                            ml: 1,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: '50%',
                                            padding: '4px',
                                            bgcolor: 'background.paper',
                                            '&:hover': {
                                                bgcolor: 'background.paper',
                                                borderColor: 'primary.main',
                                            },
                                        }}
                                    >
                                        {user.user_metadata?.avatar_url ? (
                                            <Avatar
                                                src={
                                                    user.user_metadata
                                                        .avatar_url
                                                }
                                                alt={
                                                    user.email?.charAt(0) || 'U'
                                                }
                                                sx={{ width: 30, height: 30 }}
                                            />
                                        ) : (
                                            <AccountCircleIcon
                                                sx={{
                                                    fontSize: 30,
                                                    color: 'primary.main',
                                                }}
                                            />
                                        )}
                                    </IconButton>
                                    <Menu
                                        id="user-menu"
                                        anchorEl={anchorEl}
                                        open={open}
                                        onClose={handleUserMenuClose}
                                        MenuListProps={{
                                            'aria-labelledby': 'user-button',
                                        }}
                                        PaperProps={{
                                            elevation: 2,
                                            sx: {
                                                mt: 1.5,
                                                minWidth: 180,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                bgcolor: 'paper.light',
                                                backgroundImage: 'none',
                                                backgroundSize: 'cover',
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    inset: 0,
                                                    backdropFilter: 'blur(8px)',
                                                    backgroundColor:
                                                        'rgba(255, 255, 255, 0.7)',
                                                    zIndex: 0,
                                                    borderRadius: 'inherit',
                                                },
                                            },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                zIndex: 1,
                                            }}
                                        >
                                            {user.email && (
                                                <MenuItem
                                                    sx={{
                                                        fontSize: '0.875rem',
                                                        color: 'text.secondary',
                                                        pointerEvents: 'none',
                                                        opacity: 0.8,
                                                    }}
                                                >
                                                    {user.email}
                                                </MenuItem>
                                            )}
                                            <MenuItem
                                                onClick={handleLogout}
                                                sx={{
                                                    fontSize: '0.875rem',
                                                    color: 'primary.main',
                                                    '&:hover': {
                                                        bgcolor:
                                                            'rgba(44, 62, 80, 0.04)',
                                                    },
                                                }}
                                            >
                                                <ExitToAppIcon
                                                    fontSize="small"
                                                    sx={{ mr: 1 }}
                                                />
                                                Sign Out
                                            </MenuItem>
                                        </Box>
                                    </Menu>
                                </>
                            ) : (
                                // Sign In icon button for non-authenticated users
                                <IconButton
                                    onClick={handleSignIn}
                                    size="small"
                                    aria-label="Sign In"
                                    sx={{
                                        ml: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: '50%',
                                        padding: '4px',
                                        bgcolor: 'background.paper',
                                        '&:hover': {
                                            bgcolor: 'background.paper',
                                            borderColor: 'primary.main',
                                        },
                                    }}
                                >
                                    <LoginIcon
                                        sx={{
                                            fontSize: 30,
                                            color: 'primary.main',
                                        }}
                                    />
                                </IconButton>
                            )}
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <Toolbar sx={{ mb: { xs: 0, sm: 0 } }} />

            <Box
                component="main"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    width: '100%',
                    minWidth: '100%',
                    position: 'relative',
                    bgcolor: 'background.default',
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default AppLayout;
