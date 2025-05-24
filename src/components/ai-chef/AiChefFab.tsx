import { FC } from 'react';
import { IconButton, Tooltip, Zoom, Box } from '@mui/material';
import { GiChefToque, GiSparkles } from 'react-icons/gi';

interface AiChefFabProps {
    onClick: () => void;
    isOpen: boolean;
}

const AiChefFab: FC<AiChefFabProps> = ({ onClick, isOpen }) => {
    return (
        <Zoom in={!isOpen} mountOnEnter unmountOnExit>
            <Tooltip title="Make recipe improvements" placement="left">
                <IconButton
                    onClick={onClick}
                    aria-label="ai chef suggestions"
                    sx={{
                        position: 'fixed',
                        bottom: { xs: '6vh', sm: '8vh' },
                        right: 10,
                        zIndex: 1050,
                        width: 40,
                        height: 40,
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        backdropFilter: 'blur(1.5px)',
                        padding: 1.8,
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        },
                        '&:active': {
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        },
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <GiChefToque color="white" size={20} />
                        <GiSparkles
                            color="white"
                            size={12}
                            style={{
                                position: 'absolute',
                                top: -6,
                                right: -7,
                                opacity: 0.9,
                            }}
                        />
                    </Box>
                </IconButton>
            </Tooltip>
        </Zoom>
    );
};

export default AiChefFab;
