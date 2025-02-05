import { FC, ReactNode } from 'react';
import {
    AppBar,
    Box,
    Container,
    Toolbar,
    Typography,
    useTheme,
    useMediaQuery,
    Button,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RestaurantIcon from '@mui/icons-material/Restaurant';

interface AppLayoutProps {
    children: ReactNode;
    headerContent?: ReactNode;
    showAddButton?: boolean;
    showCookingButton?: boolean;
    onCookingClick?: () => void;
}

const AppLayout: FC<AppLayoutProps> = ({
    children,
    headerContent,
    showAddButton = false,
    showCookingButton = false,
    onCookingClick,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

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

                        <Box sx={{ display: 'flex', gap: 2 }}>
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

                            {showAddButton && (
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
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <Toolbar sx={{ mb: { xs: 1, sm: 2 } }} />

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
