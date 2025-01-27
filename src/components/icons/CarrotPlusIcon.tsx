import { FC } from 'react';
import { Box } from '@mui/material';
import FontAwesomeIcon from './FontAwesomeIcon';

interface CarrotPlusIconProps {
    fontSize?: number;
}

const CarrotPlusIcon: FC<CarrotPlusIconProps> = ({ fontSize = 20 }) => {
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <FontAwesomeIcon icon="fa-solid fa-carrot" sx={{ fontSize }} />
            <Box
                sx={{
                    position: 'absolute',
                    top: 10,
                    right: -2,
                    width: 12,
                    height: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <FontAwesomeIcon
                    icon="fa-solid fa-plus"
                    sx={{
                        fontSize: 8,
                        color: 'inherit',
                        fontWeight: 'bold',
                    }}
                />
            </Box>
        </Box>
    );
};

export default CarrotPlusIcon;
