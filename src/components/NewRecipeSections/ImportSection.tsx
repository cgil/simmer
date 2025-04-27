import React, { FC } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { motion } from 'framer-motion';

interface ImportSectionProps {
    url: string;
    setUrl: (url: string) => void;
    isImporting: boolean;
    importError: string | null;
    setImportError: (error: string | null) => void;
    handleUrlSubmit: (e: React.FormEvent) => Promise<void>;
    setError: (error: string | null) => void;
    customDirection: number;
    getVariants: (direction: number) => any;
}

const ImportSectionComponent: FC<ImportSectionProps> = ({
    url,
    setUrl,
    isImporting,
    importError,
    setImportError,
    handleUrlSubmit,
    setError,
    customDirection,
    getVariants,
}) => (
    <motion.div
        key="import"
        custom={customDirection}
        variants={getVariants(customDirection)}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: '100%' }}
    >
        <Box component="form" onSubmit={handleUrlSubmit} sx={{ width: '100%' }}>
            <Typography
                variant="h6"
                sx={{
                    mb: 2,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: 'text.primary',
                    textAlign: 'center',
                    width: '100%',
                }}
            >
                Add from Link
            </Typography>
            <TextField
                fullWidth
                placeholder="https://example.com/your-favorite-recipe"
                value={url}
                onChange={(e) => {
                    setUrl(e.target.value);
                    setImportError(null);
                    setError(null);
                }}
                error={!!importError}
                helperText={importError}
                disabled={isImporting}
                InputProps={{
                    startAdornment: (
                        <LinkIcon
                            sx={{
                                mr: 1,
                                color: importError
                                    ? 'error.dark'
                                    : url
                                    ? 'primary.main'
                                    : 'text.secondary',
                            }}
                        />
                    ),
                    sx: {
                        bgcolor: 'background.paper',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1rem',
                    },
                }}
                sx={{ mb: 3 }}
            />
            <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={isImporting || !url.trim()}
                sx={{
                    height: 48,
                    fontFamily: "'Kalam', cursive",
                    fontSize: '1.1rem',
                }}
                startIcon={
                    isImporting ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        <LinkIcon />
                    )
                }
            >
                {isImporting ? 'Getting Recipe...' : 'Get Recipe'}
            </Button>
        </Box>
    </motion.div>
);

const ImportSection = React.memo(ImportSectionComponent);
export default ImportSection;
