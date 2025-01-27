import { FC, CSSProperties } from 'react';
import { SxProps } from '@mui/material';

interface FontAwesomeIconProps {
    icon: string;
    sx?: SxProps;
}

const FontAwesomeIcon: FC<FontAwesomeIconProps> = ({ icon, sx = {} }) => {
    const baseStyles: CSSProperties = {
        fontSize: 'inherit',
        width: '1em',
        height: '1em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    return (
        <i
            className={icon}
            style={{
                ...baseStyles,
                ...(sx as CSSProperties),
            }}
        />
    );
};

export default FontAwesomeIcon;
