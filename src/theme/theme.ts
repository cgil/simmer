import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
    interface Palette {
        accent: {
            main: string;
            light: string;
            dark: string;
            contrastText: string;
        };
        paper: {
            main: string;
            light: string;
            dark: string;
            contrastText: string;
        };
        error: {
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
        paper?: {
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
            main: "#2C3E50", // Ink-like text color
            light: "#3d526a",
            dark: "#1e2a36",
            contrastText: "#FFFFFF",
        },
        secondary: {
            main: "#FFF9C4", // Sticky note yellow
            light: "#fffad8",
            dark: "#fff7b0",
            contrastText: "#2C3E50",
        },
        accent: {
            main: "#F1F7FA", // Airy blue
            light: "#f8fbfd",
            dark: "#e9f3f7",
            contrastText: "#2C3E50",
        },
        paper: {
            main: "#FFFCF9", // Warm white paper
            light: "#ffffff",
            dark: "#f7f4f1",
            contrastText: "#2C3E50",
        },
        error: {
            main: "#FBE9E7", // Soft paper red
            light: "#FFF3F2",
            dark: "#F4D5D3",
            contrastText: "#943734",
        },
        background: {
            default: "#FAF9F8",
            paper: "#FFFCF9",
        },
        text: {
            primary: "rgba(0,0,0,0.75)", // Soft black
            secondary: "#595959", // Warm gray
        },
        divider: "rgba(62, 28, 0, 0.06)", // Lighter border color
        action: {
            active: "#6B6B6B", // Warm gray for icons
            hover: "rgba(62, 28, 0, 0.04)",
            selected: "rgba(62, 28, 0, 0.08)",
            disabled: "rgba(0, 0, 0, 0.26)",
            disabledBackground: "rgba(0, 0, 0, 0.12)",
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontFamily: '"Kalam", cursive',
            color: "#2C3E50",
            fontWeight: 700,
            letterSpacing: "-0.025em",
        },
        h2: {
            fontFamily: '"Kalam", cursive',
            color: "#2C3E50",
            fontWeight: 700,
            letterSpacing: "-0.025em",
        },
        h3: {
            fontFamily: '"Kalam", cursive',
            color: "#2C3E50",
            fontWeight: 700,
            letterSpacing: "-0.025em",
        },
        h4: {
            fontFamily: '"Kalam", cursive',
            color: "#2C3E50",
            fontWeight: 700,
            letterSpacing: "-0.025em",
        },
        h5: {
            fontFamily: '"Kalam", cursive',
            color: "#2C3E50",
            fontWeight: 700,
            letterSpacing: "-0.025em",
        },
        h6: {
            fontFamily: '"Kalam", cursive',
            color: "#2C3E50",
            fontWeight: 700,
            letterSpacing: "-0.025em",
        },
        subtitle1: {
            color: "#595959",
            fontWeight: 500,
            letterSpacing: "0.015em",
        },
        subtitle2: {
            color: "#595959",
            fontWeight: 500,
            letterSpacing: "0.015em",
        },
        body1: {
            color: "rgba(0,0,0,0.75)",
            letterSpacing: "0.01em",
        },
        body2: {
            color: "#595959",
            letterSpacing: "0.01em",
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    "&:focus": {
                        outline: "none",
                        boxShadow: "none",
                    },
                    "&.MuiButtonBase-root:focus-visible": {
                        outline: "none",
                    },
                },
                contained: {
                    boxShadow: "none",
                    "&:hover": {
                        boxShadow: "0px 2px 4px rgba(62, 28, 0, 0.1)",
                    },
                },
                outlined: {
                    borderWidth: 1.5,
                    "&:hover": {
                        borderWidth: 1.5,
                        backgroundColor: "rgba(62, 28, 0, 0.04)",
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    backgroundColor: "#FFFCF9",
                    boxShadow: "0 1px 3px rgba(62, 28, 0, 0.05)",
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 8,
                        "& fieldset": {
                            borderWidth: 1.5,
                            borderColor: "rgba(62, 28, 0, 0.08)",
                        },
                        "&:hover fieldset": {
                            borderColor: "rgba(62, 28, 0, 0.12)",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#2C3E50",
                            borderWidth: 1.5,
                        },
                    },
                    "& .MuiInputLabel-root": {
                        color: "#595959",
                        "&.Mui-focused": {
                            color: "#2C3E50",
                        },
                    },
                },
            },
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    "&.onPrimary": {
                        color: "#FFFFFF",
                    },
                    "&.onSecondary": {
                        color: "#2C3E50",
                    },
                    "&.onAccent": {
                        color: "#2C3E50",
                    },
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    "&:focus": {
                        outline: "none",
                    },
                    "&.Mui-focusVisible": {
                        outline: "none",
                    },
                },
            },
        },
        MuiButtonBase: {
            styleOverrides: {
                root: {
                    "&:focus": {
                        outline: "none",
                    },
                    "&.Mui-focusVisible": {
                        outline: "none",
                    },
                },
            },
        },
    },
});

export default theme;
