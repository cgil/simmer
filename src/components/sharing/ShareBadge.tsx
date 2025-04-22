import { FC } from 'react';
import { Box, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface ShareBadgeProps {
    size?: 'small' | 'medium';
    tooltipText?: string;
}

const ShareBadge: FC<ShareBadgeProps> = ({
    size = 'small',
    tooltipText = 'Shared',
}) => {
    const badgeSize = size === 'small' ? 20 : 24;

    return (
        <Tooltip title={tooltipText} arrow placement="top">
            <Box
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: badgeSize,
                    height: badgeSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    zIndex: 2,
                }}
            >
                <SendIcon
                    sx={{
                        fontSize: size === 'small' ? 12 : 16,
                        color: 'primary.main',
                        transform: 'rotate(-45deg)',
                    }}
                />
            </Box>
        </Tooltip>
    );
};

export default ShareBadge;
