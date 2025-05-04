import React from 'react';
import { Grid, Stack, Box } from '@mui/material';
import ServingSizeForm from './ServingSizeForm';
import TimeEstimateForm from './TimeEstimateForm';
import TagInput from './TagInput';
import { TimeEstimate } from '../../../types';

interface RecipeMetadataEditorProps {
    servings: number;
    setServings: (servings: number) => void;
    timeEstimate: TimeEstimate;
    setTimeEstimate: (timeEstimate: TimeEstimate) => void;
    tags: string[];
    setTags: (tags: string[]) => void;
}

/**
 * Component that combines recipe metadata editors (servings, time estimates, and tags)
 * into a single organized component for better code organization.
 */
const RecipeMetadataEditor: React.FC<RecipeMetadataEditorProps> = ({
    servings,
    setServings,
    timeEstimate,
    setTimeEstimate,
    tags,
    setTags,
}) => {
    return (
        <Box>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                        <ServingSizeForm
                            servings={servings}
                            onChange={setServings}
                        />
                        <TimeEstimateForm
                            timeEstimate={timeEstimate}
                            onChange={setTimeEstimate}
                        />
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TagInput tags={tags} onChange={setTags} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default RecipeMetadataEditor;
