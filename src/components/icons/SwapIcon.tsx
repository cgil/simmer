import { FC } from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const SwapIcon: FC<SvgIconProps> = (props) => {
    return (
        <SvgIcon
            viewBox="0 0 24 24"
            sx={{ width: '1em', height: '1em', ...props.sx }}
            {...props}
        >
            <path
                d="M7.5,5.5L5.4,7.6L8,10.2L6.6,11.6L2,7L6.6,2.4L8,3.8L5.4,6.4L10,6.4C14.4,6.4 18,10 18,14.4C18,15.9 17.6,17.3 16.8,18.5L15.4,17.1C15.9,16.3 16.2,15.3 16.2,14.3C16.2,11 13.4,8.2 10.1,8.2L7.5,8.2V5.5M16,8.4L17.4,7L22,11.6L17.4,16.2L16,14.8L18.6,12.2L14,12.2C9.6,12.2 6,8.6 6,4.2C6,2.7 6.4,1.3 7.2,0.1L8.6,1.5C8.1,2.3 7.8,3.3 7.8,4.3C7.8,7.6 10.6,10.4 13.9,10.4L16.5,10.4V8.4H16Z"
                fill="currentColor"
            />
        </SvgIcon>
    );
};

export default SwapIcon;
