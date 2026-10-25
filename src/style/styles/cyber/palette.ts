// Relative imports only: scripts/ import this file through src/theme/palettes.ts.
import { darkOnlyThemeBuilder, type DarkThemeColors, type Neutrals, type StyleDefinition } from "../../../theme/paletteBuilder";
import { mixColors } from "../../../theme/contrast";

// Cyberpunk: a near-black page with neon magenta, cyan and yellow, dark only. One fixed palette from the
// style-research canvas (Cyber.dc.html). Lit and chosen pieces are a deep fill with a neon edge and neon
// text, never a bright block: the deep fills (#4A0B40, #3A3506, #4A0A16) and their neon inks are set below.
const NEON = { page: "#07070D", card: "#0E0F1C", magenta: "#FF2BD6", pink: "#FF5AE0", cyan: "#00F0FF", yellow: "#FCEE0A", red: "#FF4D6D" } as const;
const DEEP = { magenta: "#4A0B40", yellow: "#3A3506", red: "#4A0A16" } as const;

const CYBER_DARK_NEUTRALS: Neutrals<DarkThemeColors> = {
    "background": NEON.page,
    "card": NEON.card,
    // The thin glowing edge: cyan at 45% over the page
    "border": mixColors(NEON.cyan, 0.45, NEON.page),
    "foreground": "#E6F6FF",
    "foreground-secondary": "#8EA3BD",
    // Between the secondary text and the card, still readable on both
    "foreground-muted": "#7A8DA8",
    // Clue cells are a faint lift on the card; board states are washes on one dark panel
    "cell-clue": "#12142A",
    "danger": NEON.red,
    "danger-hover": "#FF6B85",
    "error": NEON.red,
    "error-surface": DEEP.red,
    "shadow": "#000000",
    "on-primary": NEON.page,
    "on-danger": NEON.page,
    "scrim": "#02020A",
    "on-scrim": "#E6F6FF",
    "toast": NEON.card,
    "on-toast": NEON.cyan,
};

const cyberTheme = darkOnlyThemeBuilder(CYBER_DARK_NEUTRALS, {
    "primary-light": DEEP.magenta,
    "primary-ink": NEON.pink,
    "signal": NEON.yellow,
    "signal-surface": DEEP.yellow,
    // Same digit: magenta over the card; the selected cell yellow; scope and peers cyan; patterns magenta
    "highlight": mixColors(NEON.magenta, 0.16, NEON.card),
    "cell-selected": mixColors(NEON.yellow, 0.1, NEON.card),
    "cell-focus": mixColors(NEON.cyan, 0.12, NEON.card),
    "cell-peer": mixColors(NEON.cyan, 0.07, NEON.card),
    "cell-scope": mixColors(NEON.cyan, 0.08, NEON.card),
    "cell-pattern": mixColors(NEON.magenta, 0.18, NEON.card),
    // The continue card is a deep magenta panel
    "featured": DEEP.magenta,
    "on-featured": "#E6F6FF",
});

export const CYBER_STYLE: StyleDefinition = {
    id: "cyber",
    themes: [
        cyberTheme("neon", { "primary": NEON.magenta, "primary-hover": NEON.magenta, "accent": NEON.cyan }),
    ],
};
