import { FC } from 'react';
import { Box, Typography } from '@mui/material';

export type MatchType = 'title' | 'tag' | 'ingredient' | null;

interface MatchCornerFoldProps {
    matchType: MatchType;
}

/**
 * A component that displays a folded corner with an icon indicating
 * the type of search match (title, tag, or ingredient)
 */
const MatchCornerFold: FC<MatchCornerFoldProps> = ({ matchType }) => {
    if (!matchType) return null;

    // Get the appropriate icon based on match type
    const getMatchIcon = (type: MatchType): string => {
        switch (type) {
            case 'title':
                return '🔍';
            case 'tag':
                return '🏷️';
            case 'ingredient':
                return '🥕';
            default:
                return '';
        }
    };

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '40px',
                height: '40px',
                overflow: 'hidden',
                zIndex: 2,
                pointerEvents: 'none',
            }}
        >
            {/* Folded corner background */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '40px',
                    height: '40px',
                    background:
                        matchType === 'title'
                            ? 'rgba(255, 248, 225, 0.9)'
                            : matchType === 'tag'
                            ? 'rgba(232, 245, 233, 0.9)'
                            : 'rgba(227, 242, 253, 0.9)',
                    transform: 'rotate(0deg)',
                    transformOrigin: 'top right',
                    boxShadow: 'inset 2px -2px 3px rgba(0,0,0,0.1)',
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                    borderBottom: '1px solid rgba(0,0,0,0.1)',
                    borderLeft: '1px solid rgba(0,0,0,0.1)',
                }}
            />

            {/* Icon */}
            <Typography
                component="span"
                sx={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    fontSize: '14px',
                    lineHeight: 1,
                    fontWeight: 'bold',
                }}
            >
                {getMatchIcon(matchType)}
            </Typography>
        </Box>
    );
};

export default MatchCornerFold;
