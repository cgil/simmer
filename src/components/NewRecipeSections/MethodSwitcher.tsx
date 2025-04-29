import React, { FC } from 'react';
import { Stack, IconButton, Tooltip } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import CreateIcon from '@mui/icons-material/Create';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ImageIcon from '@mui/icons-material/Image';

// Define the available creation methods if not already globally defined/imported
type CreationMethod = 'import' | 'ai' | 'blank' | 'image';

interface MethodSwitcherProps {
    activeMethod: CreationMethod;
    isLoading: boolean;
    isImporting: boolean;
    isGeneratingIdeas: boolean;
    isCreatingFromIdea: boolean;
    handleMethodChange: (method: CreationMethod) => void;
}

const MethodSwitcherComponent: FC<MethodSwitcherProps> = ({
    activeMethod,
    isLoading,
    isImporting,
    isGeneratingIdeas,
    isCreatingFromIdea,
    handleMethodChange,
}) => {
    const isDisabled =
        isLoading || isImporting || isGeneratingIdeas || isCreatingFromIdea;
    const icons = {
        ai: AutoAwesomeIcon,
        import: LinkIcon,
        blank: CreateIcon,
        image: ImageIcon,
    };
    const labels = {
        ai: 'Ask the Chef',
        import: 'Add from Link',
        blank: 'Start Blank',
        image: 'From Image',
    };

    return (
        <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ mb: 4 }}
        >
            {(Object.keys(icons) as CreationMethod[]).map((method) => {
                const isActive = activeMethod === method;
                const Icon = icons[method];
                return (
                    <Tooltip title={labels[method]} key={method}>
                        <span>
                            <IconButton
                                onClick={() => handleMethodChange(method)}
                                disabled={isDisabled || method === 'image'}
                                size="large"
                                sx={{
                                    border: 1,
                                    borderColor: isActive
                                        ? 'primary.main'
                                        : 'divider',
                                    bgcolor: isActive
                                        ? 'primary.lighter'
                                        : 'background.paper',
                                    color: isActive
                                        ? 'primary.main'
                                        : 'text.secondary',
                                    boxShadow: isActive
                                        ? '0 2px 5px rgba(0,0,0,0.1)'
                                        : 'none',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        bgcolor: isActive
                                            ? 'primary.lighter'
                                            : 'action.hover',
                                        borderColor: isActive
                                            ? 'primary.dark'
                                            : 'grey.400',
                                    },
                                    '&.Mui-disabled': {
                                        opacity: method === 'image' ? 0.4 : 0.6,
                                        bgcolor: 'action.disabledBackground',
                                        borderColor: 'divider',
                                        color: 'action.disabled',
                                    },
                                }}
                            >
                                <Icon />
                            </IconButton>
                        </span>
                    </Tooltip>
                );
            })}
        </Stack>
    );
};

// Wrap with React.memo
const MethodSwitcher = React.memo(MethodSwitcherComponent);
export default MethodSwitcher;
