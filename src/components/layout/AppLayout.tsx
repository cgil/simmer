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
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AddIcon from '@mui/icons-material/Add';

interface AppLayoutProps {
    children: ReactNode;
    headerContent?: ReactNode;
    showIcon?: boolean;
    showAddButton?: boolean;
}

const AppLayout: FC<AppLayoutProps> = ({
    children,
    headerContent,
    showIcon = true,
    showAddButton = false,
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
            }}
        >
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    width: '100%',
                    borderRadius: 0,
                }}
            >
                <Container maxWidth={false} disableGutters>
                    <Toolbar
                        disableGutters
                        sx={{
                            height: { xs: 56, sm: 64 },
                            gap: { xs: 1, sm: 2 },
                            px: { xs: 2, sm: 3, md: 4 },
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
                            {showIcon && (
                                <MenuBookIcon
                                    sx={{
                                        color: 'primary.main',
                                        fontSize: { xs: 28, sm: 32 },
                                    }}
                                />
                            )}
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
                                            color: 'text.primary',
                                            letterSpacing: '-0.5px',
                                            fontFamily:
                                                'Inter, system-ui, sans-serif',
                                        }}
                                    >
                                        Simmer
                                    </Typography>
                                </Link>
                            )}
                        </Box>

                        {showAddButton && (
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => navigate('/recipe/new')}
                                startIcon={
                                    <AddIcon
                                        sx={{
                                            fontSize: { xs: 20, sm: 22 },
                                            transition: 'transform 0.2s ease',
                                        }}
                                    />
                                }
                                sx={{
                                    height: { xs: 38, sm: 42 },
                                    px: { xs: 1.5, sm: 2.5 },
                                    borderWidth: 1.5,
                                    borderColor: 'primary.main',
                                    color: 'primary.main',
                                    fontWeight: 600,
                                    fontSize: {
                                        xs: '0.875rem',
                                        sm: '0.9375rem',
                                    },
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    letterSpacing: '0.01em',
                                    textTransform: 'none',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderWidth: 1.5,
                                        backgroundColor: 'primary.main',
                                        color: 'primary.contrastText',
                                        '& .MuiSvgIcon-root': {
                                            transform: 'rotate(90deg)',
                                        },
                                    },
                                }}
                            >
                                {isMobile ? '' : 'New Recipe'}
                            </Button>
                        )}
                    </Toolbar>
                </Container>
            </AppBar>

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
