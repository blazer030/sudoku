// The default style's colours: warm neutrals under six themes.
// Relative imports only: scripts/ import this file through src/theme/palettes.ts.
import { themeBuilder, type DarkThemeColors, type LightThemeColors, type Neutrals, type StyleDefinition } from "../../../theme/paletteBuilder";

const MINIMAL_LIGHT_NEUTRALS: Neutrals<LightThemeColors> = {
    "background": "#F5F4F1",
    "card": "#FFFFFF",
    "border": "#E5E4E1",
    "foreground": "#1A1918",
    "foreground-secondary": "#555452",
    "foreground-muted": "#6F6E6C",
    "cell-clue": "#E4E3E0",
    "danger": "#B84C3D",
    "danger-hover": "#A73D2F",
    "error": "#A42018",
    "error-surface": "#FDEAE6",
    "shadow": "#1A1918",
    "on-primary": "#FFFFFF",
    "on-danger": "#FFFFFF",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    "toast": "#1A1918",
    "on-toast": "#F5F4F1",
};

// Direction C neutrals; primaries are light tints, so text on them is dark
const MINIMAL_DARK_NEUTRALS: Neutrals<DarkThemeColors> = {
    "background": "#111110",
    "card": "#1D1D1B",
    "border": "#2D2D2A",
    "foreground": "#F3F2EE",
    "foreground-secondary": "#B3B1AC",
    "foreground-muted": "#878684",
    "cell-clue": "#32322E",
    "danger": "#D36554",
    "danger-hover": "#E47463",
    "error": "#FF9482",
    "error-surface": "#3C2C27",
    "shadow": "#000000",
    "on-primary": "#111110",
    "on-danger": "#111110",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    // A raised dark surface, not an inverted light block
    "toast": "#34342F",
    "on-toast": "#F3F2EE",
};

const minimalTheme = themeBuilder(MINIMAL_LIGHT_NEUTRALS, MINIMAL_DARK_NEUTRALS);

export const MINIMAL_STYLE: StyleDefinition = {
    id: "minimal",
    themes: [
        minimalTheme("green",
            { "primary": "#176037", "primary-hover": "#00582E", "primary-light": "#C8F0D8", "accent": "#9A5C3E", "highlight": "#84DDA8" },
            { "primary": "#7AC192", "primary-hover": "#7ECB97", "accent": "#D89575" }),
        minimalTheme("blue",
            { "primary": "#2C5689", "primary-hover": "#214D80", "primary-light": "#D0E4F7", "accent": "#8C6524", "highlight": "#ABCEF1" },
            { "primary": "#85B5EE", "primary-hover": "#8BBFFE", "accent": "#C49A5C" }),
        minimalTheme("purple",
            { "primary": "#614887", "primary-hover": "#5A3E80", "primary-light": "#E4D8F0", "accent": "#327769", "highlight": "#D6C3E8" },
            { "primary": "#C1A5EE", "primary-hover": "#CCAEFE", "accent": "#5A9E8F" }),
        minimalTheme("orange",
            { "primary": "#7D4800", "primary-hover": "#743E00", "primary-light": "#F5E0C8", "accent": "#506F8B", "highlight": "#ECC395" },
            { "primary": "#E1A66C", "primary-hover": "#EFAC6C", "accent": "#7394B1" }),
        minimalTheme("pink",
            { "primary": "#863C55", "primary-hover": "#7D324B", "primary-light": "#F7D4DE", "accent": "#367667", "highlight": "#F3BCCC" },
            { "primary": "#ED9AB1", "primary-hover": "#FCA1BA", "accent": "#5C9C8C" }),
        minimalTheme("teal",
            { "primary": "#0A5E5F", "primary-hover": "#005556", "primary-light": "#D0F0F0", "accent": "#9D5A4B", "highlight": "#86D8D8" },
            { "primary": "#75BEBE", "primary-hover": "#79C8C8", "accent": "#C57E6E" }),
    ],
};
