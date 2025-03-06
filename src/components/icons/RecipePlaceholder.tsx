import { FC } from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const RecipePlaceholder: FC<SvgIconProps> = (props) => {
    return (
        <SvgIcon
            viewBox="0 0 24 24"
            sx={{ width: '1em', height: '1em', ...props.sx }}
            {...props}
        >
            {/* Notebook/recipe card background */}
            <path
                d="M3,3C2.45,3,2,3.45,2,4v16c0,0.55,0.45,1,1,1h18c0.55,0,1-0.45,1-1V4c0-0.55-0.45-1-1-1H3z"
                fill="currentColor"
                opacity="0.1"
            />
            <path
                d="M3,3C2.45,3,2,3.45,2,4v16c0,0.55,0.45,1,1,1h18c0.55,0,1-0.45,1-1V4c0-0.55-0.45-1-1-1H3z M3,4h18v16H3V4z"
                fill="currentColor"
                opacity="0.7"
            />

            {/* Recipe elements */}
            <path d="M6,7h12v1H6V7z" fill="currentColor" opacity="0.5" />
            <path d="M6,9h10v1H6V9z" fill="currentColor" opacity="0.4" />
            <path d="M6,11h8v1H6V11z" fill="currentColor" opacity="0.3" />

            {/* Fork and knife */}
            <path
                d="M16,12c0,0-0.5,1-0.5,3c0,1,0.5,2,0.5,2s0.5-1,0.5-2C16.5,13,16,12,16,12z"
                fill="currentColor"
            />
            <path d="M14,12v5h0.5v-5H14z" fill="currentColor" />
            <path
                d="M13,12v1.5c0,0.8-0.7,1.5-1.5,1.5v2h0.5c0.8,0,1.5-0.7,1.5-1.5V12H13z"
                fill="currentColor"
            />

            {/* Recipe lines */}
            <path d="M6,14h4v1H6V14z" fill="currentColor" opacity="0.3" />
            <path d="M6,16h8v1H6V16z" fill="currentColor" opacity="0.2" />
        </SvgIcon>
    );
};

export default RecipePlaceholder;
