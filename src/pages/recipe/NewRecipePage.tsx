import { FC, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    CircularProgress,
    Container,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkIcon from '@mui/icons-material/Link';
import AppLayout from '../../components/layout/AppLayout';
import { MOCK_RECIPES } from '../../mocks/recipes';

const NewRecipePage: FC = () => {
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) {
            setError('Please enter a URL');
            return;
        }

        try {
            new URL(url);
            setError(null);
            setIsLoading(true);

            // Simulate API call with mock data
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // For now, using the first mock recipe as example
            const importedRecipe = MOCK_RECIPES[0];

            // Navigate to edit mode with the imported recipe
            // TODO: Replace with actual route when edit mode is implemented
            navigate('/recipe/edit', { state: { recipe: importedRecipe } });
        } catch {
            setError('Please enter a valid URL');
            setIsLoading(false);
        }
    };

    const headerContent = (
        <Box
            onClick={() => navigate('/')}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                color: 'text.primary',
                '&:hover': {
                    color: 'primary.main',
                },
            }}
        >
            <ArrowBackIcon sx={{ fontSize: 24 }} />
            <Typography
                variant="body1"
                sx={{
                    fontWeight: 500,
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
            >
                Back
            </Typography>
        </Box>
    );

    return (
        <AppLayout headerContent={headerContent}>
            <Container maxWidth="lg" sx={{ height: '100%' }}>
                <Box
                    sx={{
                        display: 'flex',
                        minHeight: {
                            xs: 'calc(100vh - 120px)',
                            sm: 'calc(100vh - 140px)',
                        },
                        py: { xs: 3, sm: 4, md: 6 },
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            maxWidth: 600,
                            mx: 'auto',
                            px: { xs: 2, sm: 3 },
                        }}
                    >
                        <Box sx={{ mb: { xs: 4, sm: 6 } }}>
                            <Typography
                                variant={isMobile ? 'h4' : 'h3'}
                                component="h1"
                                gutterBottom
                                sx={{
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    background:
                                        'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                                    backgroundClip: 'text',
                                    textFillColor: 'transparent',
                                    mb: 2,
                                }}
                            >
                                Import Your Recipe
                            </Typography>
                            <Typography
                                color="text.secondary"
                                sx={{
                                    textAlign: 'center',
                                    fontSize: {
                                        xs: '1rem',
                                        sm: '1.125rem',
                                    },
                                    maxWidth: 450,
                                    mx: 'auto',
                                    lineHeight: 1.6,
                                }}
                            >
                                Transform any recipe from the web into your
                                personal collection with just a URL.
                            </Typography>
                        </Box>

                        <Paper
                            component="form"
                            onSubmit={handleSubmit}
                            elevation={0}
                            sx={{
                                width: '100%',
                                p: { xs: 2.5, sm: 4 },
                                bgcolor: '#F8F7FA',
                                border: '1px solid',
                                borderColor: error ? 'error.main' : 'divider',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                },
                            }}
                        >
                            <TextField
                                fullWidth
                                placeholder="https://example.com/your-favorite-recipe"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    setError(null);
                                }}
                                error={!!error}
                                helperText={error}
                                disabled={isLoading}
                                InputProps={{
                                    startAdornment: (
                                        <LinkIcon
                                            sx={{
                                                mr: 1,
                                                color: error
                                                    ? 'error.main'
                                                    : url
                                                    ? 'primary.main'
                                                    : 'text.secondary',
                                                transition:
                                                    'color 0.2s ease-in-out',
                                            }}
                                        />
                                    ),
                                    sx: {
                                        bgcolor: 'background.paper',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: error
                                                ? 'error.main'
                                                : 'divider',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline':
                                            {
                                                borderColor: error
                                                    ? 'error.main'
                                                    : 'primary.main',
                                            },
                                    },
                                }}
                                sx={{ mb: 3 }}
                            />

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                type="submit"
                                disabled={isLoading}
                                sx={{
                                    height: 48,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: 'none',
                                    },
                                }}
                            >
                                {isLoading ? (
                                    <CircularProgress
                                        size={24}
                                        color="inherit"
                                    />
                                ) : (
                                    'Import Recipe'
                                )}
                            </Button>
                        </Paper>
                    </Box>
                </Box>
            </Container>
        </AppLayout>
    );
};

export default NewRecipePage;
