import { FC } from 'react';
import { Box, Typography, Paper, Slider, Stack } from '@mui/material';
import { Recipe } from '../../../types';
import { scaleQuantity, formatQuantity } from '../../../utils/recipe';

interface IngredientsListProps {
    recipe: Recipe;
    servings: number;
    onServingsChange: (servings: number) => void;
}

const IngredientsList: FC<IngredientsListProps> = ({
    recipe,
    servings,
    onServingsChange,
}) => {
    const handleServingsChange = (_event: Event, value: number | number[]) => {
        onServingsChange(value as number);
    };

    // Calculate dynamic max serving size based on recipe's default serving size
    const defaultServings = recipe.servings || 4;
    const maxServings = defaultServings >= 6 ? defaultServings * 2 : 10;

    // Generate dynamic marks based on maxServings
    const generateMarks = () => {
        const marks = [];

        // For small ranges (max 10), show all numbers
        if (maxServings <= 10) {
            for (let i = 1; i <= maxServings; i++) {
                marks.push({ value: i, label: i.toString() });
            }
            return marks;
        }

        // For larger ranges, we need a consistent interval approach
        // Always show 1 as the minimum
        marks.push({ value: 1, label: '1' });

        // Determine the appropriate interval
        // We want even intervals (typically 2) unless the range is very large
        const interval =
            maxServings <= 20 ? 2 : Math.ceil(maxServings / 10) * 2;

        // Add marks at regular intervals starting from 2 (not 1)
        for (let i = interval; i <= maxServings; i += interval) {
            marks.push({ value: i, label: i.toString() });
        }

        // Always include the default recipe servings if not already included
        if (
            !marks.some((mark) => mark.value === defaultServings) &&
            defaultServings > 1
        ) {
            marks.push({
                value: defaultServings,
                label: defaultServings.toString(),
            });
        }

        // Always include the max value if not already included
        if (!marks.some((mark) => mark.value === maxServings)) {
            marks.push({ value: maxServings, label: maxServings.toString() });
        }

        // Sort marks by value and return
        return marks.sort((a, b) => a.value - b.value);
    };

    // Handle empty ingredients array
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, sm: 4 },
                    height: '100%',
                    borderRadius: 4,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
            >
                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        fontWeight: 700,
                        color: 'primary.main',
                        mb: 4,
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    }}
                >
                    Ingredients
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    No ingredients available for this recipe.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2.5, sm: 4 },
                height: '100%',
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
        >
            <Stack spacing={3}>
                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        fontWeight: 700,
                        color: 'primary.main',
                        mb: 2,
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    }}
                >
                    Ingredients
                </Typography>

                {/* Servings Control */}
                <Box sx={{ px: { xs: 0.5, sm: 2 } }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                            flexWrap: 'wrap',
                            gap: 1,
                        }}
                    >
                        <Typography
                            id="servings-slider"
                            sx={{
                                color: 'text.secondary',
                                fontWeight: 500,
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                            }}
                        >
                            Adjust servings
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: 600,
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                px: { xs: 2, sm: 2.5 },
                                py: { xs: 0.5, sm: 0.75 },
                                borderRadius: 2,
                                minWidth: 45,
                                textAlign: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                            }}
                        >
                            {servings}
                        </Typography>
                    </Box>
                    <Slider
                        value={servings}
                        onChange={handleServingsChange}
                        aria-labelledby="servings-slider"
                        step={1}
                        marks={generateMarks()}
                        min={1}
                        max={maxServings}
                        valueLabelDisplay="off"
                        sx={{
                            '& .MuiSlider-thumb': {
                                width: { xs: 10, sm: 12 },
                                height: { xs: 10, sm: 12 },
                                transition: '0.2s',
                                '&:hover, &.Mui-focusVisible': {
                                    boxShadow: '0 0 0 8px rgba(0,0,0,0.1)',
                                },
                            },
                            '& .MuiSlider-track': {
                                height: { xs: 3, sm: 4 },
                            },
                            '& .MuiSlider-rail': {
                                height: { xs: 3, sm: 4 },
                            },
                            '& .MuiSlider-mark': {
                                width: { xs: 2, sm: 3 },
                                height: { xs: 2, sm: 3 },
                            },
                            '& .MuiSlider-markLabel': {
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            },
                            mb: 4,
                        }}
                    />
                </Box>

                {/* Ingredients List */}
                <Box
                    component="ul"
                    sx={{
                        pl: { xs: 1, sm: 2 },
                        listStyleType: 'none',
                        m: 0,
                    }}
                >
                    {recipe.ingredients.map((item) => (
                        <Typography
                            component="li"
                            key={item.id}
                            sx={{
                                mb: 2,
                                display: 'flex',
                                alignItems: 'flex-start',
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                lineHeight: 1.5,
                                '&::before': {
                                    content: '""',
                                    width: { xs: 4, sm: 6 },
                                    height: { xs: 4, sm: 6 },
                                    bgcolor: 'primary.main',
                                    borderRadius: '50%',
                                    mr: 2,
                                    mt: '0.5em',
                                    opacity: 0.7,
                                    flexShrink: 0,
                                },
                                '&:last-child': {
                                    mb: 0,
                                },
                            }}
                        >
                            <Box sx={{ flex: 1 }}>
                                {(item.quantity !== null ||
                                    item.unit !== null) && (
                                    <Box
                                        component="span"
                                        sx={{
                                            fontWeight: 500,
                                            display: 'inline-block',
                                            mr: 0.5,
                                        }}
                                    >
                                        {formatQuantity(
                                            scaleQuantity(
                                                item.quantity,
                                                recipe.servings,
                                                servings
                                            )
                                        )}{' '}
                                        {item.unit && `${item.unit} `}
                                    </Box>
                                )}
                                {item.name}
                                {item.notes && (
                                    <Box
                                        component="span"
                                        sx={{
                                            color: 'text.secondary',
                                            ml: 1,
                                            fontSize: '0.85em',
                                        }}
                                    >
                                        ({item.notes})
                                    </Box>
                                )}
                            </Box>
                        </Typography>
                    ))}
                </Box>
            </Stack>
        </Paper>
    );
};

export default IngredientsList;
