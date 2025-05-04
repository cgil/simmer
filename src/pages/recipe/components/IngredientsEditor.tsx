import React from 'react';
import { Box, Typography, TextField, IconButton, Stack } from '@mui/material';
import FontAwesomeIcon from '../../../components/icons/FontAwesomeIcon';
import CarrotPlusIcon from '../../../components/icons/CarrotPlusIcon';
import NotebookButton from '../../../components/common/NotebookButton';
import { Ingredient } from '../../../types/recipe';
import { generateUuidV4 } from '../../../utils/uuid';

interface IngredientsEditorProps {
    ingredients: Ingredient[];
    setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
    onDeleteIngredient: (ingredientId: string) => void; // Also handles ingredient mention cleanup
}

/**
 * Component for editing recipe ingredients with quantity, unit, and name fields.
 * Handles adding, updating, and deleting ingredients.
 */
const IngredientsEditor: React.FC<IngredientsEditorProps> = ({
    ingredients,
    setIngredients,
    onDeleteIngredient,
}) => {
    const handleAddIngredient = () => {
        const newIngredient: Ingredient = {
            id: generateUuidV4(),
            name: '',
            quantity: null,
            unit: null,
            notes: '',
            position: (ingredients.length + 1) * 1000,
        };
        setIngredients([...ingredients, newIngredient]);
    };

    const handleIngredientNameChange = (index: number, value: string) => {
        const newIngredients = [...ingredients];
        if (!newIngredients[index]) return;
        newIngredients[index] = { ...newIngredients[index], name: value };
        setIngredients(newIngredients);
    };

    const handleIngredientQuantityChange = (index: number, value: string) => {
        const newIngredients = [...ingredients];
        if (!newIngredients[index]) return;
        newIngredients[index] = {
            ...newIngredients[index],
            quantity: value === '' ? null : parseFloat(value),
        };
        setIngredients(newIngredients);
    };

    const handleIngredientUnitChange = (index: number, value: string) => {
        const newIngredients = [...ingredients];
        if (!newIngredients[index]) return;
        newIngredients[index] = {
            ...newIngredients[index],
            unit: value === '' ? null : value,
        };
        setIngredients(newIngredients);
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
                variant="h4"
                sx={{
                    color: 'primary.main',
                    fontFamily: "'Kalam', cursive",
                    mb: 2,
                }}
            >
                Ingredients
            </Typography>
            <Stack spacing={3}>
                {ingredients.map((ingredient, index) => (
                    <Box
                        key={ingredient.id}
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
                            size="small"
                            placeholder="amount"
                            value={ingredient.quantity ?? ''}
                            onChange={(e) =>
                                handleIngredientQuantityChange(
                                    index,
                                    e.target.value
                                )
                            }
                            variant="standard"
                            type="number"
                            inputProps={{
                                min: 0,
                                step: 0.25,
                            }}
                            sx={{
                                width: 160,
                                '& .MuiInputBase-input': {
                                    fontSize: '1rem',
                                    textAlign: 'right',
                                    '&::-webkit-inner-spin-button': {
                                        opacity: 0,
                                        marginLeft: 1,
                                    },
                                    '&:hover::-webkit-inner-spin-button': {
                                        opacity: 1,
                                    },
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    fontSize: '0.875rem',
                                },
                            }}
                        />
                        <TextField
                            size="small"
                            placeholder="unit"
                            value={ingredient.unit || ''}
                            onChange={(e) =>
                                handleIngredientUnitChange(
                                    index,
                                    e.target.value
                                )
                            }
                            variant="standard"
                            sx={{
                                width: 160,
                                '& .MuiInputBase-input': {
                                    fontSize: '1rem',
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    fontSize: '0.875rem',
                                },
                            }}
                        />
                        <TextField
                            size="small"
                            placeholder="ingredient name"
                            value={ingredient.name}
                            onChange={(e) =>
                                handleIngredientNameChange(
                                    index,
                                    e.target.value
                                )
                            }
                            variant="standard"
                            fullWidth
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontSize: '1rem',
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    fontSize: '0.875rem',
                                },
                            }}
                        />
                        <IconButton
                            className="delete-button"
                            size="small"
                            onClick={() => onDeleteIngredient(ingredient.id)}
                            sx={{
                                opacity: 0,
                                transform: 'translateX(-10px)',
                                transition: 'all 0.2s',
                                width: 32,
                                height: 32,
                                bgcolor: 'paper.light',
                                '&:hover': {
                                    transform: 'translateY(-1px)',
                                    bgcolor: 'paper.dark',
                                    '&::before': {
                                        opacity: 1,
                                    },
                                },
                                '& svg': {
                                    color: 'error.main',
                                    transition: 'color 0.2s',
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
                    startIcon={<CarrotPlusIcon fontSize={20} />}
                    onClick={handleAddIngredient}
                    buttonStyle="primary"
                >
                    Add Ingredient
                </NotebookButton>
            </Stack>
        </Box>
    );
};

export default IngredientsEditor;
