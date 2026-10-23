// Relative imports only: scripts/ import this file through src/theme/palettes.ts.
import { themeBuilder, type DarkThemeColors, type LightThemeColors, type Neutrals, type StyleDefinition } from "../../../theme/paletteBuilder";

// 8-bit: one fixed palette per mode, from the style-research canvas (Pixel.dc.html).
// 掌機 (light) is the handheld's four greens, #0F380F #306230 #8BAC0F #9BBC0F. Only #0F380F reads at
// 4.5:1 on the light greens, so every text role is #0F380F and hierarchy comes from type, not colour.
// 紅白機 (dark) is the console's colours on black: white text, gold buttons, a blue entry colour and a
// lighter NES red for errors, since #F83800 is only 4.25 on the navy card. Hovers keep their base
// colour: 8-bit's feedback is the press offset.
const HANDHELD = { darkest: "#0F380F", dark: "#306230", light: "#8BAC0F", lightest: "#9BBC0F" } as const;

const PIXEL_LIGHT_NEUTRALS: Neutrals<LightThemeColors> = {
    "background": HANDHELD.lightest,
    "card": HANDHELD.lightest,
    "border": HANDHELD.dark,
    "foreground": HANDHELD.darkest,
    "foreground-secondary": HANDHELD.darkest,
    "foreground-muted": HANDHELD.darkest,
    "cell-clue": HANDHELD.lightest,
    "danger": HANDHELD.darkest,
    "danger-hover": HANDHELD.darkest,
    "error": HANDHELD.darkest,
    "error-surface": HANDHELD.light,
    "shadow": HANDHELD.dark,
    "on-primary": HANDHELD.lightest,
    "on-danger": HANDHELD.lightest,
    // The canvas dims with black; on-scrim over a green scrim would not read
    "scrim": "#000000",
    "on-scrim": HANDHELD.lightest,
    "toast": HANDHELD.darkest,
    "on-toast": HANDHELD.lightest,
};

const PIXEL_DARK_NEUTRALS: Neutrals<DarkThemeColors> = {
    "background": "#000000",
    "card": "#1E1E3C",
    "border": "#6C6C6C",
    "foreground": "#FCFCFC",
    "foreground-secondary": "#BCBCBC",
    // Between the secondary grey and the card, so the text levels stay apart
    "foreground-muted": "#A4A4A4",
    "cell-clue": "#000000",
    "danger": "#F87858",
    "danger-hover": "#F87858",
    "error": "#F87858",
    "error-surface": "#000000",
    "shadow": "#3C3C3C",
    "on-primary": "#000000",
    "on-danger": "#000000",
    "scrim": "#000000",
    "on-scrim": "#FCFCFC",
    "toast": "#1E1E3C",
    "on-toast": "#FCFCFC",
};

// The continue card is the page colour framed in ink, as on the canvas; same digit in 紅白機 is the
// console blue, and the primary's light surface (the secondary New Game, icon wells) the navy card,
// rather than tints of the gold
const pixelTheme = themeBuilder(
    PIXEL_LIGHT_NEUTRALS,
    PIXEL_DARK_NEUTRALS,
    { "featured": HANDHELD.lightest, "on-featured": HANDHELD.darkest },
    { "featured": "#000000", "on-featured": "#FCFCFC", "highlight": "#0058F8", "primary-light": "#1E1E3C" },
);

export const PIXEL_STYLE: StyleDefinition = {
    id: "pixel",
    themes: [
        pixelTheme("classic",
            { "primary": HANDHELD.darkest, "primary-hover": HANDHELD.darkest, "primary-light": HANDHELD.light, "accent": HANDHELD.darkest, "highlight": HANDHELD.light },
            { "primary": "#F8B800", "primary-hover": "#F8B800", "accent": "#3CBCFC" }),
    ],
};
