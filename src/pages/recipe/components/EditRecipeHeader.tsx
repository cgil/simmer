import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

interface EditRecipeHeaderProps {
    onGoBack: () => void;
    onSave: () => void;
    isSaving: boolean;
    isLoading: boolean;
}

const EditRecipeHeader: React.FC<EditRecipeHeaderProps> = ({
    onGoBack,
    onSave,
    isSaving,
    isLoading,
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
            }}
        >
            <Box
                onClick={onGoBack}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    color: 'text.primary',
                    '&:hover': { color: 'primary.main' },
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

            <Button
                variant="contained"
                startIcon={isSaving ? null : <SaveIcon />}
                onClick={onSave}
                disabled={isSaving || isLoading}
                sx={{ height: 42, px: 3, minWidth: 140 }}
            >
                {isSaving ? 'Saving...' : 'Save Recipe'}
            </Button>
        </Box>
    );
};

export default React.memo(EditRecipeHeader);
