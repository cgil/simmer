import { FC } from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Chip,
    Box,
    CardActionArea,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface RecipeCardProps {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    tags: string[];
    servings: number;
}

const RecipeCard: FC<RecipeCardProps> = ({
    id,
    title,
    description,
    imageUrl,
    tags,
    servings,
}) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: { xs: 2, sm: 3 },
            }}
            elevation={0}
        >
            <CardActionArea
                onClick={() => navigate(`/recipe/${id}`)}
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    alignItems: isMobile ? 'center' : 'stretch',
                }}
            >
                {imageUrl && (
                    <CardMedia
                        component="img"
                        height={isMobile ? '120' : '200'}
                        width={isMobile ? '120' : 'auto'}
                        image={imageUrl}
                        alt={title}
                        sx={{
                            objectFit: 'cover',
                            width: isMobile ? 120 : '100%',
                            borderRadius: isMobile ? 1 : 0,
                        }}
                    />
                )}
                <CardContent
                    sx={{
                        flexGrow: 1,
                        p: isMobile ? 2 : 3,
                        '&:last-child': { pb: isMobile ? 2 : 3 },
                    }}
                >
                    <Typography
                        variant={isMobile ? 'subtitle1' : 'h6'}
                        component="h2"
                        gutterBottom
                        sx={{
                            fontWeight: 600,
                            mb: 1,
                            lineHeight: 1.2,
                        }}
                    >
                        {title}
                    </Typography>
                    {!isMobile && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mb: 2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {description}
                        </Typography>
                    )}
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 0.5,
                            flexWrap: 'wrap',
                            mt: 'auto',
                        }}
                    >
                        <Chip
                            size="small"
                            label={`${servings} servings`}
                            color="primary"
                        />
                        {tags.slice(0, isMobile ? 1 : 3).map((tag) => (
                            <Chip
                                key={tag}
                                size="small"
                                label={tag}
                                color="secondary"
                            />
                        ))}
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default RecipeCard;
