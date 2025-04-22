import { FC } from 'react';
import { MenuItem, Typography, SxProps } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface ShareMenuItemProps {
    icon: SvgIconComponent;
    label: string;
    onClick: () => void;
    color?: string;
    iconSx?: SxProps;
}

const ShareMenuItem: FC<ShareMenuItemProps> = ({
    icon: Icon,
    label,
    onClick,
    color = 'inherit',
    iconSx = {},
}) => {
    return (
        <MenuItem
            onClick={onClick}
            sx={{
                '&:hover': { bgcolor: 'error.lighter' },
            }}
        >
            <Icon
                sx={{
                    mr: 2,
                    fontSize: 20,
                    color,
                    ...iconSx,
                }}
            />
            <Typography
                variant="body2"
                sx={{
                    fontFamily: "'Inter', sans-serif",
                    color,
                }}
            >
                {label}
            </Typography>
        </MenuItem>
    );
};

export default ShareMenuItem;
