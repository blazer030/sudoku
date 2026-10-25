// Relative imports only: scripts/ import this file through src/theme/palettes.ts.
import { lightOnlyThemeBuilder, type LightThemeColors, type Neutrals, type StyleDefinition } from "../../../theme/paletteBuilder";
import { mixColors } from "../../../theme/contrast";

// Ink and washi: ink on warm washi paper, light only, with a vermilion seal for everything chosen. One fixed
// palette from the style-research canvas (Ink.dc.html). The board and its cells are transparent on the page,
// so every board wash is mixed over the page, not the card.
const WASHI = {
    page: "#F2ECDF",
    card: "#FBF7EE",
    ink: "#1E1B16",
    paleInk: "#5C554A",
    blueBlack: "#2C3E5C",
    seal: "#B3261E",
    onSeal: "#FFF8F0",
    error: "#A0281E",
} as const;

const INK_LIGHT_NEUTRALS: Neutrals<LightThemeColors> = {
    "background": WASHI.page,
    "card": WASHI.card,
    "border": mixColors(WASHI.ink, 0.22, WASHI.page),
    "foreground": WASHI.ink,
    "foreground-secondary": WASHI.paleInk,
    // A shade lighter than the pale ink, still readable on the page and the card
    "foreground-muted": "#686155",
    // Clues sit on the bare page, like every other cell
    "cell-clue": WASHI.page,
    "danger": WASHI.error,
    "danger-hover": "#8A2219",
    "error": WASHI.error,
    "error-surface": mixColors(WASHI.error, 0.1, WASHI.page),
    "shadow": WASHI.ink,
    "on-primary": WASHI.onSeal,
    "on-danger": WASHI.onSeal,
    "scrim": WASHI.ink,
    "on-scrim": WASHI.page,
    "toast": WASHI.ink,
    "on-toast": WASHI.page,
};

const inkTheme = lightOnlyThemeBuilder(INK_LIGHT_NEUTRALS, {
    // The continue card is a washi slip in ink
    "featured": WASHI.card,
    "on-featured": WASHI.ink,
    "primary-ink": WASHI.seal,
    // The selected and focus cells have no fill: the skin draws a vermilion ring instead
    "cell-selected": WASHI.page,
    "cell-focus": WASHI.page,
    "cell-peer": mixColors(WASHI.ink, 0.05, WASHI.page),
    "cell-scope": mixColors(WASHI.ink, 0.05, WASHI.page),
    "cell-pattern": mixColors(WASHI.seal, 0.1, WASHI.page),
});

export const INK_STYLE: StyleDefinition = {
    id: "ink",
    themes: [
        inkTheme("vermilion", {
            "primary": WASHI.seal,
            "primary-hover": "#9C1F18",
            "primary-light": mixColors(WASHI.seal, 0.12, WASHI.card),
            "accent": WASHI.blueBlack,
            "highlight": mixColors(WASHI.seal, 0.11, WASHI.page),
        }),
    ],
};
