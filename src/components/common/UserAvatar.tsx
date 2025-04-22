import { FC, useState } from 'react';
import { Avatar, Typography } from '@mui/material';

interface UserAvatarProps {
    email: string;
    avatarUrl?: string;
    size?: number;
}

const UserAvatar: FC<UserAvatarProps> = ({ email, avatarUrl, size = 40 }) => {
    const [imageError, setImageError] = useState(false);

    // Get initials from email
    const getInitials = (email: string): string => {
        return email.charAt(0).toUpperCase();
    };

    // Generate a deterministic color based on email
    const getColorFromEmail = (email: string): string => {
        const colors = [
            '#2C3E50', // primary
            '#3d526a', // primary light
            '#1e2a36', // primary dark
            '#595959', // text secondary
            '#6B6B6B', // action active
        ];

        // Simple hash function for email to get an index
        const emailHash = email
            .split('')
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);

        return colors[emailHash % colors.length];
    };

    // If we have a valid avatar URL and no error, show the image
    if (avatarUrl && !imageError) {
        return (
            <Avatar
                src={avatarUrl}
                alt={email}
                sx={{ width: size, height: size }}
                onError={() => setImageError(true)}
            />
        );
    }

    // Otherwise show initials
    return (
        <Avatar
            sx={{
                width: size,
                height: size,
                bgcolor: getColorFromEmail(email),
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
            }}
        >
            <Typography variant="body2" color="paper.light">
                {getInitials(email)}
            </Typography>
        </Avatar>
    );
};

export default UserAvatar;
