import { FC, ChangeEvent } from 'react';
import { Paper, InputBase, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const SearchBar: FC<SearchBarProps> = ({
    value,
    onChange,
    placeholder = 'Search recipes...',
}) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value);
    };

    return (
        <Paper
            component="form"
            sx={{
                p: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: 600,
                mx: 'auto',
                mb: 4,
            }}
            elevation={0}
            onSubmit={(e) => e.preventDefault()}
        >
            <IconButton sx={{ p: '10px' }} aria-label="search">
                <SearchIcon />
            </IconButton>
            <InputBase
                sx={{ ml: 1, flex: 1 }}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                inputProps={{ 'aria-label': 'search recipes' }}
            />
        </Paper>
    );
};

export default SearchBar;
