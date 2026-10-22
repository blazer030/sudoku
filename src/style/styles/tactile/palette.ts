// Relative imports only: scripts/ import this file through src/theme/palettes.ts.
import { themeBuilder, type DarkThemeColors, type LightThemeColors, type Neutrals, type StyleDefinition } from "../../../theme/paletteBuilder";

// Tactile tiles: warm stone light neutrals and a cool graphite dark, so raised pieces read
// against a recessed tray. Primaries are darker than the reference's so board inks still
// read on the strongest board layer.
const TACTILE_LIGHT_NEUTRALS: Neutrals<LightThemeColors> = {
    "background": "#EBE7E0",
    "card": "#FCFBF8",
    "border": "#D0C9BD",
    "foreground": "#2A2724",
    "foreground-secondary": "#504B45",
    "foreground-muted": "#655F57",
    "cell-clue": "#E2DDD4",
    "danger": "#A9473A",
    "danger-hover": "#9A3B2F",
    "error": "#951C15",
    "error-surface": "#FBE7E1",
    "shadow": "#2A2724",
    "on-primary": "#FFFFFF",
    "on-danger": "#FFFFFF",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    "toast": "#2A2724",
    "on-toast": "#EBE7E0",
};

const TACTILE_DARK_NEUTRALS: Neutrals<DarkThemeColors> = {
    "background": "#1A1C1F",
    "card": "#282B30",
    "border": "#3C4046",
    "foreground": "#EDEAE5",
    "foreground-secondary": "#CDCAC4",
    "foreground-muted": "#A5A29C",
    "cell-clue": "#3B3F45",
    "danger": "#E5806F",
    "danger-hover": "#EC8C7C",
    "error": "#FFBDB2",
    "error-surface": "#4A3532",
    "shadow": "#000000",
    "on-primary": "#1A1C1F",
    "on-danger": "#1A1C1F",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    "toast": "#3E4248",
    "on-toast": "#EDEAE5",
};

const tactileTheme = themeBuilder(TACTILE_LIGHT_NEUTRALS, TACTILE_DARK_NEUTRALS);

export const TACTILE_STYLE: StyleDefinition = {
    id: "tactile",
    themes: [
        tactileTheme("green",
            { "primary": "#1F5C3A", "primary-hover": "#175230", "primary-light": "#D3EBDB", "accent": "#8E553A", "highlight": "#8FD3A8" },
            { "primary": "#9CDEB4", "primary-hover": "#A8E6BF", "accent": "#E0A385" }),
        tactileTheme("blue",
            { "primary": "#24508A", "primary-hover": "#1C4780", "primary-light": "#D5E3F4", "accent": "#865F22", "highlight": "#A8C8EE" },
            { "primary": "#ADCDF5", "primary-hover": "#B8D5F8", "accent": "#D2A866" }),
        tactileTheme("rust",
            { "primary": "#782F16", "primary-hover": "#6E2810", "primary-light": "#F4DDD3", "accent": "#336B6E", "highlight": "#EFBAA4" },
            { "primary": "#F7B89D", "primary-hover": "#FAC2AA", "accent": "#7FB6B8" }),
        tactileTheme("slate",
            { "primary": "#34506E", "primary-hover": "#2C4664", "primary-light": "#DAE2EC", "accent": "#7F5B2E", "highlight": "#B3C5DA" },
            { "primary": "#B7CBE5", "primary-hover": "#C1D3EA", "accent": "#CFA672" }),
    ],
};
