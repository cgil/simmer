import { FC, ReactNode } from 'react';
import {
    AppBar,
    Box,
    Container,
    Toolbar,
    Typography,
    Button,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

interface AppLayoutProps {
    children: ReactNode;
}

const AppLayout: FC<AppLayoutProps> = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
            }}
        >
            <AppBar position="fixed" elevation={0}>
                <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
                    <Typography
                        variant={isMobile ? 'h6' : 'h5'}
                        component={RouterLink}
                        to="/"
                        sx={{
                            textDecoration: 'none',
                            color: 'inherit',
                            flexGrow: 1,
                            fontWeight: 600,
                        }}
                    >
                        Simmer
                    </Typography>
                    <Button
                        component={RouterLink}
                        to="/add"
                        variant="contained"
                        color="secondary"
                        startIcon={isMobile ? null : <AddIcon />}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{
                            borderRadius: 8,
                            px: isMobile ? 2 : 3,
                        }}
                    >
                        {isMobile ? <AddIcon /> : 'Add Recipe'}
                    </Button>
                </Toolbar>
            </AppBar>
            <Toolbar /> {/* Spacer for fixed AppBar */}
            <Container
                component="main"
                maxWidth="lg"
                sx={{
                    flexGrow: 1,
                    py: { xs: 2, sm: 3, md: 4 },
                    px: { xs: 2, sm: 3 },
                }}
            >
                {children}
            </Container>
        </Box>
    );
};

export default AppLayout;
