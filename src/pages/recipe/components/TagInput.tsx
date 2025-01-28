import { FC, useState, KeyboardEvent } from 'react';
import {
    Box,
    Chip,
    TextField,
    Typography,
    Paper,
    IconButton,
    Stack,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
}

const TagInput: FC<TagInputProps> = ({ tags, onChange }) => {
    const [inputValue, setInputValue] = useState('');

    const capitalizeWords = (str: string) => {
        return str
            .toLowerCase()
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleAddTag = () => {
        const trimmedValue = inputValue.trim();
        if (trimmedValue && !tags.includes(trimmedValue)) {
            const capitalizedTag = capitalizeWords(trimmedValue);
            onChange([...tags, capitalizedTag]);
            setInputValue('');
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleAddTag();
        }
    };

    const handleDeleteTag = (tagToDelete: string) => {
        onChange(tags.filter((tag) => tag !== tagToDelete));
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 1,
                boxShadow: `
                    0 1px 2px rgba(0,0,0,0.05),
                    0 3px 6px rgba(0,0,0,0.02),
                    0 1px 8px rgba(0,0,0,0.02)
                `,
                height: '100%',
                position: 'relative',
                bgcolor: 'background.paper',
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
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: 'text.primary',
                        mb: 3,
                        fontFamily: "'Kalam', cursive",
                    }}
                >
                    <LocalOfferIcon />
                    Tags
                </Typography>
                <Stack spacing={2} sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            variant="standard"
                            placeholder="Add a tag..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontSize: '1rem',
                                },
                            }}
                        />
                        <IconButton
                            onClick={handleAddTag}
                            disabled={!inputValue.trim()}
                            sx={{
                                bgcolor: 'secondary.main',
                                color: 'text.primary',
                                borderRadius: 1,
                                width: 40,
                                height: 40,
                                '&:hover': {
                                    bgcolor: 'secondary.light',
                                },
                                '&.Mui-disabled': {
                                    bgcolor: 'action.disabledBackground',
                                    color: 'action.disabled',
                                },
                            }}
                        >
                            <AddIcon />
                        </IconButton>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            flexWrap: 'wrap',
                            flex: 1,
                        }}
                    >
                        {tags.map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                onDelete={() => handleDeleteTag(tag)}
                                color="secondary"
                                sx={{
                                    borderRadius: 1,
                                    fontFamily: "'Inter', sans-serif",
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        backgroundColor: 'secondary.light',
                                    },
                                    '& .MuiChip-deleteIcon': {
                                        color: 'text.secondary',
                                        opacity: 0.6,
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            opacity: 1,
                                            backgroundColor:
                                                'rgba(0, 0, 0, 0.04)',
                                        },
                                    },
                                }}
                            />
                        ))}
                    </Box>
                </Stack>
            </Box>
        </Paper>
    );
};

export default TagInput;
