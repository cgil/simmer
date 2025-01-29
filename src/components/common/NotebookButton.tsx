import { FC, ReactNode } from 'react';
import { Button, ButtonProps } from '@mui/material';

interface NotebookButtonProps extends ButtonProps {
    children: ReactNode;
    buttonStyle?: 'primary' | 'secondary';
}

const NotebookButton: FC<NotebookButtonProps> = ({
    children,
    buttonStyle = 'primary',
    sx,
    ...props
}) => {
    return (
        <Button
            {...props}
            sx={{
                alignSelf: 'flex-start',
                color: 'text.primary',
                borderRadius: 1,
                py: 1.25,
                px: 2.5,
                minHeight: 40,
                bgcolor:
                    buttonStyle === 'primary' ? 'secondary.main' : 'paper.main',
                border: '1px solid',
                borderColor: 'divider',
                borderBottom: '2px solid',
                borderBottomColor: 'divider',
                fontFamily: "'Kalam', cursive",
                fontSize: '1rem',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                    bgcolor:
                        buttonStyle === 'primary'
                            ? 'secondary.light'
                            : 'paper.light',
                    transform: 'translateY(-1px)',
                    borderColor: 'rgba(44, 62, 80, 0.15)',
                    boxShadow: '0 1px 3px rgba(44, 62, 80, 0.1)',
                },
                ...sx,
            }}
        >
            {children}
        </Button>
    );
};

export default NotebookButton;
