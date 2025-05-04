import React from 'react';
import {
    FormControl,
    Select,
    MenuItem,
    SelectChangeEvent,
    Tooltip,
} from '@mui/material';
import { CollectionItem } from '../../../types/collection';

interface CollectionSelectorProps {
    selectedCollection: string;
    onCollectionChange: (event: SelectChangeEvent<string>) => void;
    availableCollections: CollectionItem[];
    isOwner: boolean;
    isLoading: boolean;
    allRecipesId: string;
}

const CollectionSelector: React.FC<CollectionSelectorProps> = ({
    selectedCollection,
    onCollectionChange,
    availableCollections,
    isOwner,
    isLoading,
    allRecipesId,
}) => {
    return (
        <FormControl
            sx={{
                minWidth: 220,
                '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'background.paper' },
                },
            }}
            size="small"
        >
            <Tooltip
                title={
                    !isOwner
                        ? 'Only the recipe owner can change which collection this recipe belongs to'
                        : ''
                }
                placement="top"
                arrow
            >
                <div>
                    <Select
                        value={selectedCollection}
                        onChange={onCollectionChange}
                        displayEmpty
                        inputProps={{
                            'aria-label': 'Select collection',
                        }}
                        disabled={!isOwner || isLoading}
                        sx={{
                            height: 42,
                            fontFamily: "'Inter', sans-serif",
                            '& .MuiSelect-select': {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            },
                            ...(!isOwner && {
                                opacity: 0.7,
                                cursor: 'not-allowed',
                            }),
                        }}
                    >
                        <MenuItem
                            key={allRecipesId}
                            value={allRecipesId}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>📚</span> All
                            Recipes
                        </MenuItem>
                        {availableCollections
                            .filter(
                                (collection) => collection.id !== allRecipesId
                            )
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((collection) => (
                                <MenuItem
                                    key={collection.id}
                                    value={collection.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    {collection.emoji && (
                                        <span
                                            style={{
                                                fontSize: '1.2rem',
                                            }}
                                        >
                                            {collection.emoji}
                                        </span>
                                    )}
                                    {collection.name}
                                </MenuItem>
                            ))}
                    </Select>
                </div>
            </Tooltip>
        </FormControl>
    );
};

export default React.memo(CollectionSelector);
