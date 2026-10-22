// Relative imports only: scripts/ import this file through src/theme/palettes.ts.
import { themeBuilder, type DarkThemeColors, type LightThemeColors, type Neutrals, type StyleDefinition } from "../../../theme/paletteBuilder";

// Paper notebook: warm paper by day, a night desk by lamplight. Inks are the theme colours;
// the continue card is a yellow sticky note. Muted text is darker than the reference so it
// still reads where it crosses a ruled line. At night every text level must reach 4.5 on the
// lamp over a texture dot, which caps how dark muted text can go, so primary text is brighter
// to keep the levels apart.
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

const PAPER_DARK_NEUTRALS: Neutrals<DarkThemeColors> = {
    "background": "#201D19",
    "card": "#2A2621",
    "border": "#3D372F",
    "foreground": "#F9F3E8",
    "foreground-secondary": "#DED5C5",
    "foreground-muted": "#D5CCBC",
    "cell-clue": "#3B362E",
    "danger": "#E8846F",
    "danger-hover": "#EE917E",
    "error": "#FFB8A8",
    "error-surface": "#4A342D",
    "shadow": "#000000",
    "on-primary": "#201D19",
    "on-danger": "#201D19",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    "toast": "#3D372F",
    "on-toast": "#EDE4D3",
};

const paperTheme = themeBuilder(PAPER_LIGHT_NEUTRALS, PAPER_DARK_NEUTRALS, {
    "featured": "#F7E6A0",
    "on-featured": "#3A3326",
    "rule": "#CFDCE4",
    "margin-line": "#E9B9AF",
}, {
    "featured": "#4A4230",
    "on-featured": "#F3E8CC",
    "rule": "#2B343B",
    "margin-line": "#583833",
    "lamp": "#FFBE6E",
});

export const PAPER_STYLE: StyleDefinition = {
    id: "paper",
    themes: [
        paperTheme("blueInk",
            { "primary": "#2B4A7A", "primary-hover": "#22406F", "primary-light": "#DCE4F0", "accent": "#8A5A20", "highlight": "#AFC3E2" },
            { "primary": "#BFD3F4", "primary-hover": "#C9DBF6", "accent": "#D9AE70" }),
        paperTheme("greenInk",
            { "primary": "#235A3C", "primary-hover": "#1B5034", "primary-light": "#D8EBDD", "accent": "#8E4F3A", "highlight": "#9ECFAF" },
            { "primary": "#ADDFBF", "primary-hover": "#B8E6C8", "accent": "#E2A68E" }),
        paperTheme("redInk",
            { "primary": "#8E2533", "primary-hover": "#831D2B", "primary-light": "#F5DCDF", "accent": "#2F6B60", "highlight": "#EDB8BF" },
            { "primary": "#F8C3CA", "primary-hover": "#FACDD3", "accent": "#86C0B4" }),
    ],
};
