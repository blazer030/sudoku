// Relative imports only: scripts/ import this file through src/theme/palettes.ts.
import { lightOnlyThemeBuilder, type LightThemeColors, type Neutrals, type StyleDefinition } from "../../../theme/paletteBuilder";

// Paper notebook: warm paper, light only. Inks are the theme colours; the continue card is a
// yellow sticky note. Muted text is darker than the reference so it still reads where it crosses
// a ruled line.
const PAPER_LIGHT_NEUTRALS: Neutrals<LightThemeColors> = {
    "background": "#F4EDE0",
    "card": "#FBF7EF",
    "border": "#DCD0BB",
    "foreground": "#2F2C35",
    "foreground-secondary": "#4E4A50",
    "foreground-muted": "#5E5850",
    "cell-clue": "#E6DCCB",
    "danger": "#A8423A",
    "danger-hover": "#983730",
    "error": "#951C15",
    "error-surface": "#FBE5DF",
    "shadow": "#2F2C35",
    "on-primary": "#FFFFFF",
    "on-danger": "#FFFFFF",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    "toast": "#2F2C35",
    "on-toast": "#F4EDE0",
};

const paperTheme = lightOnlyThemeBuilder(PAPER_LIGHT_NEUTRALS, {
    "featured": "#F7E6A0",
    "on-featured": "#3A3326",
    "rule": "#CFDCE4",
    "margin-line": "#E9B9AF",
});

export const PAPER_STYLE: StyleDefinition = {
    id: "paper",
    themes: [
        paperTheme("blueInk",
            { "primary": "#2B4A7A", "primary-hover": "#22406F", "primary-light": "#DCE4F0", "accent": "#8A5A20", "highlight": "#AFC3E2" }),
        paperTheme("greenInk",
            { "primary": "#235A3C", "primary-hover": "#1B5034", "primary-light": "#D8EBDD", "accent": "#8E4F3A", "highlight": "#9ECFAF" }),
        paperTheme("redInk",
            { "primary": "#8E2533", "primary-hover": "#831D2B", "primary-light": "#F5DCDF", "accent": "#2F6B60", "highlight": "#EDB8BF" }),
    ],
};
