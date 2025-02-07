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
import { extractRecipe } from '../../lib/api';

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

            const importedRecipe = await extractRecipe(url);

            // Navigate to edit mode with the imported recipe
            navigate('/recipe/edit', { state: { recipe: importedRecipe } });
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to extract recipe'
            );
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
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                Back
            </Typography>
        </Box>
    );

    return (
        <AppLayout headerContent={headerContent}>
            <Box
                sx={{
                    position: 'relative',
                    bgcolor: 'paper.light',
                    minHeight: '100vh',
                    px: { xs: 2, sm: 3, md: 4 },
                    py: { xs: 3, sm: 4 },
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        boxShadow: 'inset 0 0 50px rgba(62, 28, 0, 0.08)',
                        pointerEvents: 'none',
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 1,
                        pointerEvents: 'none',
                        backgroundImage: `
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.07) 0.5px, transparent 0.5px),
                            radial-gradient(circle at 50% 50%, rgba(62, 28, 0, 0.04) 1px, transparent 1px)
                        `,
                        backgroundSize: '6px 6px, 14px 14px',
                        backgroundPosition: '0 0',
                        mixBlendMode: 'multiply',
                        filter: 'opacity(1)',
                    },
                }}
            >
                <Container
                    maxWidth="md"
                    sx={{ position: 'relative', zIndex: 1 }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            py: { xs: 4, sm: 6, md: 8 },
                        }}
                    >
                        <Typography
                            variant={isMobile ? 'h4' : 'h3'}
                            component="h1"
                            gutterBottom
                            sx={{
                                fontWeight: 700,
                                color: 'primary.main',
                                textAlign: 'center',
                                fontFamily: "'Kalam', cursive",
                                mb: 2,
                            }}
                        >
                            Import Your Recipe
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{
                                textAlign: 'center',
                                fontSize: { xs: '1rem', sm: '1.125rem' },
                                maxWidth: 450,
                                mx: 'auto',
                                mb: 6,
                                lineHeight: 1.6,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Transform any recipe from the web into your personal
                            collection with just a URL.
                        </Typography>

                        <Paper
                            component="form"
                            onSubmit={handleSubmit}
                            elevation={0}
                            sx={{
                                width: '100%',
                                p: { xs: 2.5, sm: 4 },
                                borderRadius: 1,
                                position: 'relative',
                                bgcolor: 'background.paper',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '100%',
                                    background: 'rgba(255,255,255,0.6)',
                                    backdropFilter: 'blur(4px)',
                                    borderRadius: 1,
                                    zIndex: 0,
                                },
                                '& > *': {
                                    position: 'relative',
                                    zIndex: 1,
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
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: '1rem',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: error
                                                ? 'error.main'
                                                : 'divider',
                                            borderWidth: 1,
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
                                    bgcolor: 'secondary.main',
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    fontFamily: "'Kalam', cursive",
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
                                        borderColor: 'rgba(44, 62, 80, 0.15)',
                                        boxShadow:
                                            '0 1px 3px rgba(44, 62, 80, 0.1)',
                                    },
                                }}
                            >
                                {isLoading ? (
                                    <CircularProgress
                                        size={24}
                                        sx={{ color: 'text.primary' }}
                                    />
                                ) : (
                                    'Import Recipe'
                                )}
                            </Button>
                        </Paper>
                    </Box>
                </Container>
            </Box>
        </AppLayout>
    );
};

export default NewRecipePage;
