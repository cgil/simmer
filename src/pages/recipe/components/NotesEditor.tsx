import { FC } from 'react';
import { Box, Typography, TextField, Stack, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FontAwesomeIcon from '../../../components/icons/FontAwesomeIcon';
import NotebookButton from '../../../components/common/NotebookButton';
import { generateUuidV4 } from '../../../utils/uuid';

interface Note {
    id: string;
    text: string;
}

interface NotesEditorProps {
    notes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

const NotesEditor: FC<NotesEditorProps> = ({ notes, setNotes }) => {
    const handleAddNote = () => {
        setNotes([
            ...notes,
            {
                id: generateUuidV4(),
                text: '',
            },
        ]);
    };

    const handleDeleteNote = (noteId: string) => {
        setNotes(notes.filter((note) => note.id !== noteId));
    };

    const handleNoteChange = (noteId: string, value: string) => {
        setNotes(
            notes.map((note) =>
                note.id === noteId ? { ...note, text: value } : note
            )
        );
    };

    return (
        <Box
            sx={{
                position: 'relative',
                bgcolor: 'background.paper',
                p: { xs: 2, sm: 3 },
                borderRadius: 1,
                boxShadow: `0 1px 2px rgba(0,0,0,0.03), 0 4px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.9)`,
            }}
        >
            <Typography
                variant="h6"
                sx={{
                    color: 'primary.main',
                    fontFamily: "'Kalam', cursive",
                    mb: 2,
                }}
            >
                Notes
            </Typography>
            <Stack spacing={3}>
                {notes.map((note) => (
                    <Box
                        key={note.id}
                        sx={{
                            display: 'flex',
                            gap: 2,
                            alignItems: 'flex-start',
                            position: 'relative',
                            '&:hover .delete-button': {
                                opacity: 1,
                                transform: 'translateX(0)',
                            },
                        }}
                    >
                        <TextField
                            fullWidth
                            multiline
                            placeholder="Add a note..."
                            value={note.text}
                            variant="standard"
                            onChange={(e) =>
                                handleNoteChange(note.id, e.target.value)
                            }
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontSize: '1rem',
                                    lineHeight: 1.6,
                                },
                            }}
                        />
                        <IconButton
                            className="delete-button"
                            size="small"
                            onClick={() => handleDeleteNote(note.id)}
                            sx={{
                                mt: 1,
                                opacity: 0,
                                transform: 'translateX(-10px)',
                                transition: 'all 0.2s',
                                width: 32,
                                height: 32,
                                bgcolor: 'paper.light',
                                '&:hover': {
                                    transform:
                                        'translateX(-10px) rotate(-8deg)',
                                    bgcolor: 'paper.dark',
                                },
                            }}
                        >
                            <FontAwesomeIcon
                                icon="fa-solid fa-eraser"
                                sx={{ fontSize: 18 }}
                            />
                        </IconButton>
                    </Box>
                ))}
                <NotebookButton
                    startIcon={<AddIcon sx={{ fontSize: 20 }} />}
                    onClick={handleAddNote}
                    buttonStyle="primary"
                >
                    Add Note
                </NotebookButton>
            </Stack>
        </Box>
    );
};

export default NotesEditor;
