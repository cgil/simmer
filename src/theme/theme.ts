import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
        accent: {
            main: string;
            light: string;
            dark: string;
            contrastText: string;
        };
    }
    interface PaletteOptions {
        accent?: {
            main: string;
            light: string;
            dark: string;
            contrastText: string;
        };
    }
}

const theme = createTheme({
    palette: {
        primary: {
            main: '#3c35c0',
            light: '#4942cd',
            dark: '#160f9a',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#6e0c30',
            light: '#8b294d',
            dark: '#58001a',
            contrastText: '#FFFFFF',
        },
        accent: {
            main: '#776fe2',
            light: '#7d75e8',
            dark: '#4a42b5',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#F8F7FA',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#2C1F21',
            secondary: '#635D63',
        },
        action: {
            active: '#5D4E6D',
            hover: 'rgba(93, 78, 109, 0.04)',
            selected: 'rgba(93, 78, 109, 0.08)',
            disabled: 'rgba(0, 0, 0, 0.26)',
            disabledBackground: 'rgba(0, 0, 0, 0.12)',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            color: '#2C1F21',
            fontWeight: 700,
            letterSpacing: '-0.025em',
        },
        h2: {
            color: '#2C1F21',
            fontWeight: 600,
            letterSpacing: '-0.025em',
        },
        h3: {
            color: '#2C1F21',
            fontWeight: 600,
            letterSpacing: '-0.025em',
        },
        h4: {
            color: '#2C1F21',
            fontWeight: 600,
            letterSpacing: '-0.025em',
        },
        h5: {
            color: '#2C1F21',
            fontWeight: 600,
            letterSpacing: '-0.025em',
        },
        h6: {
            color: '#2C1F21',
            fontWeight: 600,
            letterSpacing: '-0.025em',
        },
        subtitle1: {
            color: '#635D63',
            fontWeight: 500,
            letterSpacing: '0.015em',
        },
        subtitle2: {
            color: '#635D63',
            fontWeight: 500,
            letterSpacing: '0.015em',
        },
        body1: {
            color: '#2C1F21',
            letterSpacing: '0.01em',
        },
        body2: {
            color: '#635D63',
            letterSpacing: '0.01em',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                    },
                },
                outlined: {
                    borderWidth: 1.5,
                    '&:hover': {
                        borderWidth: 1.5,
                        backgroundColor: 'rgba(93, 78, 109, 0.04)',
                    },
                },
                containedPrimary: {
                    color: '#FFFFFF',
                    '&:hover': {
                        backgroundColor: '#4D3F5A',
                    },
                },
                containedSecondary: {
                    color: '#FFFFFF',
                    '&:hover': {
                        backgroundColor: '#885A5B',
                    },
                },
                outlinedPrimary: {
                    borderColor: '#5D4E6D',
                    '&:hover': {
                        borderColor: '#4D3F5A',
                        backgroundColor: 'rgba(93, 78, 109, 0.04)',
                    },
                },
                outlinedSecondary: {
                    borderColor: '#9B6B6C',
                    '&:hover': {
                        borderColor: '#885A5B',
                        backgroundColor: 'rgba(155, 107, 108, 0.04)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        '& fieldset': {
                            borderWidth: 1.5,
                            borderColor: 'rgba(93, 78, 109, 0.23)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(93, 78, 109, 0.35)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#5D4E6D',
                            borderWidth: 1.5,
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: '#635D63',
                        '&.Mui-focused': {
                            color: '#5D4E6D',
                        },
                    },
                },
            },
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    '&.onPrimary': {
                        color: '#FFFFFF',
                    },
                    '&.onSecondary': {
                        color: '#FFFFFF',
                    },
                    '&.onAccent': {
                        color: '#2C1F21',
                    },
                },
            },
        },
    },
});

export default theme;
