import { FC } from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const EmptyRecipeBook: FC<SvgIconProps> = (props) => {
    return (
        <SvgIcon
            viewBox="0 0 24 24"
            sx={{ width: '1em', height: '1em', ...props.sx }}
            {...props}
        >
            <path
                d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M19,19H5V5h14V19z"
                fill="currentColor"
            />
            <path
                d="M7,7h10v2H7V7z M7,11h10v2H7V11z M7,15h7v2H7V15z"
                fill="currentColor"
                opacity="0.5"
            />
            <path
                d="M18,10.5c0,0.83-0.67,1.5-1.5,1.5S15,11.33,15,10.5S15.67,9,16.5,9S18,9.67,18,10.5z"
                fill="currentColor"
                opacity="0"
            />
            <path
                d="M14.83,7.67L11.99,6l-2.83,1.67c-0.18,0.1-0.32-0.18-0.18-0.32L11.99,5l2.83,2.35C14.99,7.55,14.83,7.71,14.83,7.67z"
                fill="currentColor"
                opacity="0"
            />
        </SvgIcon>
    );
};

export default EmptyRecipeBook;
