import React from 'react';
import { Box, TextField } from '@mui/material';

interface RecipeTitleDescriptionEditorProps {
    title: string;
    description: string;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
}

const RecipeTitleDescriptionEditor: React.FC<
    RecipeTitleDescriptionEditorProps
> = ({ title, description, onTitleChange, onDescriptionChange }) => {
    return (
        <Box
            sx={{
                position: 'relative',
                bgcolor: 'background.paper',
                p: { xs: 2, sm: 3 },
                borderRadius: 1,
                boxShadow: `0 1px 2px rgba(0,0,0,0.03), 0 4px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.9)`,
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 1,
                    zIndex: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                },
                '& > *': {
                    position: 'relative',
                    zIndex: 1,
                },
                '& .MuiInputBase-input': {
                    color: 'text.primary',
                    fontFamily: "'Inter', system-ui, sans-serif",
                },
            }}
        >
            <TextField
                fullWidth
                placeholder="Give your recipe a name..."
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                variant="standard"
                sx={{
                    mb: 2,
                    '& .MuiInputBase-input': {
                        fontFamily: "'Kalam', cursive",
                        fontSize: {
                            xs: '2.5rem',
                            sm: '3rem',
                        },
                        fontWeight: 700,
                        lineHeight: 1.2,
                        pb: 1,
                        textShadow: '1px 1px 1px rgba(0,0,0,0.05)',
                    },
                    '& .MuiInput-underline:before': {
                        borderBottomColor: 'transparent',
                    },
                }}
            />
            <TextField
                fullWidth
                placeholder="Add a description..."
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                multiline
                rows={2}
                variant="standard"
                sx={{
                    '& .MuiInputBase-input': {
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1.25rem',
                        lineHeight: 1.5,
                        color: 'text.secondary',
                    },
                    '& .MuiInput-underline:before': {
                        borderBottomColor: 'transparent',
                    },
                }}
            />
        </Box>
    );
};

export default React.memo(RecipeTitleDescriptionEditor);
