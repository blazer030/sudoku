// Relative imports only: scripts/ import this file through src/theme/palettes.ts.
import { themeBuilder, type DarkThemeColors, type LightThemeColors, type Neutrals, type StyleDefinition } from "../../../theme/paletteBuilder";
import { mixColors } from "../../../theme/contrast";
import type { ColorMode, ColorThemeId } from "../../../theme/themeIds";

// Aurora Glass: four lights drifting behind panes of frosted glass, from the style-research canvas (Aurora.dc.html).
// 夜空 (dark) is a deep night sky with pale text; 晨光 (light) is a dawn with dark text and softer lights. A theme
// changes the colour chosen with (primary, selection, the player's digits), the four lights and the ribbon's two
// colours, and, where the sky's red would pass for its colour, the error's; the page and the glass are the same in all
// four. The glass is thin, so the skin paints each pane over the live lights: the surfaces here are each pane over the
// bare page, and paletteContrast.test.ts checks the words on them over every ground the lights lay.

/** The error colour and its hover, which a danger button darkens to in 晨光 and lightens to in 夜空 */
interface AuroraError { error: string; errorHover: string }

/** A theme's four lights, aurora-1 to aurora-4 */
type AuroraLights = readonly [string, string, string, string];
/** A theme's ribbon: the streak's colour on its left and on its right, aurora-ribbon-1 and aurora-ribbon-2 */
type AuroraRibbon = readonly [string, string];

interface AuroraSky extends AuroraError {
    background: string;
    foreground: string;
    foregroundSecondary: string;
    onDanger: string;
    glass: string;
    sheen: string;
}

const AURORA_SKIES: Readonly<Record<ColorMode, AuroraSky>> = {
    dark: {
        background: "#060914",
        foreground: "#F2F5FF",
        foregroundSecondary: "#B0B9D3",
        error: "#FF948A",
        errorHover: "#FFA9A1",
        onDanger: "#060914",
        glass: "#141A34",
        sheen: "#FFFFFF",
    },
    light: {
        background: "#EEF0F7",
        foreground: "#151A2D",
        foregroundSecondary: "#48506A",
        error: "#B71C1C",
        errorHover: "#9A1717",
        onDanger: "#FFFFFF",
        glass: "#FFFFFF",
        sheen: "#FFFFFF",
    },
};

/**
 * How dense each pane of glass is, per mode. The skin's custom properties (--aurora-glass-card, ...) carry the same
 * numbers, as fractions here and percentages there.
 */
export interface AuroraDensity {
    /** The glass colour a card lays */
    card: number;
    /** The sheen a cell lays, and a cell in the selected cell's row, column or box */
    cell: number;
    peer: number;
    /** The glass colour a dialog, the toast and the completion card lay */
    dialog: number;
    /** The primary's soft tint, laid on the glass, and the same digit's, laid in place of it */
    tintSoft: number;
    tintSame: number;
    errorWash: number;
    errorStripe: number;
}

export const AURORA_DENSITIES: Readonly<Record<ColorMode, AuroraDensity>> = {
    light: { card: 0.6, cell: 0.56, peer: 0.88, dialog: 1, tintSoft: 0.06, tintSame: 0.08, errorWash: 0.05, errorStripe: 0.08 },
    dark: { card: 0.55, cell: 0.07, peer: 0.15, dialog: 0.97, tintSoft: 0.08, tintSame: 0.22, errorWash: 0.05, errorStripe: 0.08 },
};

interface AuroraSurfaces {
    card: string;
    cellGlass: string;
    peerGlass: string;
    dialog: string;
}

// Each pane over the bare page
const auroraSurfaces = (mode: ColorMode): AuroraSurfaces => {
    const sky = AURORA_SKIES[mode];
    const density = AURORA_DENSITIES[mode];
    return {
        card: mixColors(sky.glass, density.card, sky.background),
        cellGlass: mixColors(sky.sheen, density.cell, sky.background),
        peerGlass: mixColors(sky.sheen, density.peer, sky.background),
        dialog: mixColors(sky.glass, density.dialog, sky.background),
    };
};

const auroraNeutrals = (mode: ColorMode, { error, errorHover }: AuroraError): Neutrals<LightThemeColors> & Neutrals<DarkThemeColors> => {
    const sky = AURORA_SKIES[mode];
    const { card, cellGlass, dialog } = auroraSurfaces(mode);
    return {
        "background": sky.background,
        "card": card,
        "border": mixColors(sky.foreground, 0.2, card),
        "foreground": sky.foreground,
        "foreground-secondary": sky.foregroundSecondary,
        "foreground-muted": mixColors(sky.foregroundSecondary, 0.85, card),
        "cell-clue": cellGlass,
        "danger": error,
        "danger-hover": errorHover,
        "error": error,
        "error-surface": mixColors(error, AURORA_DENSITIES[mode].errorStripe, mixColors(error, AURORA_DENSITIES[mode].errorWash, cellGlass)),
        "shadow": mode === "dark" ? sky.background : sky.foreground,
        "on-primary": "#FFFFFF",
        "on-danger": sky.onDanger,
        "scrim": sky.background,
        "on-scrim": sky.foreground,
        "toast": dialog,
        "on-toast": sky.foreground,
    };
};

// What a theme changes: the colour chosen with and the text on it, the lights and the ribbon, per mode, and the error
// where the sky's red lies too near that colour in hue. The lights hold the canvas's strength (夜空 0.42, 晨光 0.85),
// each tuned so every word on the glass reads over every ground they lay (paletteContrast.test.ts). 晨光's ribbon is
// one mint-to-lilac streak in every theme.
interface AuroraAccent { primary: string; primaryHover: string; onPrimary: string; lights: AuroraLights; ribbon: AuroraRibbon; error?: AuroraError }

const DAWN_RIBBON: AuroraRibbon = ["#D2FFDA", "#F5EEFF"];

const AURORA_ACCENTS: Readonly<Record<"purple" | "teal" | "pink" | "orange", Record<ColorMode, AuroraAccent>>> = {
    purple: {
        dark: { primary: "#A897FF", primaryHover: "#BBAEFF", onPrimary: "#120B30", lights: ["#4A039B", "#21238E", "#8B1787", "#2572BF"], ribbon: ["#4A039B", "#21238E"] },
        light: { primary: "#5B3FE0", primaryHover: "#4C33C2", onPrimary: "#FFFFFF", lights: ["#E2DDFF", "#D2E1FE", "#FFCCEE", "#9BDBFD"], ribbon: DAWN_RIBBON },
    },
    teal: {
        dark: { primary: "#4FE3C1", primaryHover: "#74EBD0", onPrimary: "#052A22", lights: ["#004A42", "#0E519E", "#08748F", "#7A59C3"], ribbon: ["#004A42", "#0E519E"] },
        light: { primary: "#0A6F61", primaryHover: "#085C51", onPrimary: "#FFFFFF", lights: ["#ACF8E2", "#CFECFF", "#A4F3FD", "#D1C9FE"], ribbon: DAWN_RIBBON },
    },
    // A red-orange, as the sky's red reads as the same red as the pink
    pink: {
        dark: { primary: "#FF8CC6", primaryHover: "#FFA8D4", onPrimary: "#3A0820", lights: ["#4F0031", "#02484F", "#9F39B5", "#3769CA"], ribbon: ["#913FD5", "#029E72"], error: { error: "#FF8F5A", errorHover: "#FFA57B" } },
        light: { primary: "#C2185B", primaryHover: "#A21349", onPrimary: "#FFFFFF", lights: ["#C5FFDC", "#F2EDFF", "#C1FDFF", "#FFB7E6"], ribbon: DAWN_RIBBON, error: { error: "#A34400", errorHover: "#893900" } },
    },
    // A crimson-rose, as the sky's red lies close to the orange
    orange: {
        dark: { primary: "#FFB86B", primaryHover: "#FFC98C", onPrimary: "#3A1E00", lights: ["#4F1700", "#01644D", "#7A56C7", "#9B6406"], ribbon: ["#864AD2", "#019F68"], error: { error: "#FF8FAB", errorHover: "#FFA5BC" } },
        light: { primary: "#A84808", primaryHover: "#8F3D06", onPrimary: "#FFFFFF", lights: ["#B3FFD6", "#FFEDBA", "#D9F2FF", "#FFC49C"], ribbon: DAWN_RIBBON, error: { error: "#A3165E", errorHover: "#89124F" } },
    },
};

// A mode's board tints, which are the primary laid on the glass (the same digit's in its place); the lights, the
// ribbon and the glass are its own colours
const auroraExtras = (mode: ColorMode, { primary, lights, ribbon }: AuroraAccent) => {
    const sky = AURORA_SKIES[mode];
    const density = AURORA_DENSITIES[mode];
    const { card, cellGlass, peerGlass } = auroraSurfaces(mode);
    const sameDigit = mixColors(primary, density.tintSame, sky.background);
    return {
        "primary-light": mixColors(primary, density.tintSoft, card),
        "highlight": sameDigit,
        "cell-selected": primary,
        "cell-focus": mixColors(primary, density.tintSoft, cellGlass),
        "cell-scope": peerGlass,
        "cell-peer": peerGlass,
        "cell-pattern": sameDigit,
        "aurora-1": lights[0],
        "aurora-2": lights[1],
        "aurora-3": lights[2],
        "aurora-4": lights[3],
        "aurora-ribbon-1": ribbon[0],
        "aurora-ribbon-2": ribbon[1],
        "glass": sky.glass,
        "glass-sheen": sky.sheen,
    };
};

const auroraTheme = (id: ColorThemeId, accents: Record<ColorMode, AuroraAccent>) => {
    const lightExtras = auroraExtras("light", accents.light);
    const darkExtras = auroraExtras("dark", accents.dark);
    const colors = (mode: ColorMode, extras: typeof lightExtras) => ({
        "primary": accents[mode].primary,
        "primary-hover": accents[mode].primaryHover,
        "primary-light": extras["primary-light"],
        "accent": accents[mode].primary,
        "highlight": extras.highlight,
    });
    return themeBuilder(
        { ...auroraNeutrals("light", accents.light.error ?? AURORA_SKIES.light), "on-primary": accents.light.onPrimary },
        { ...auroraNeutrals("dark", accents.dark.error ?? AURORA_SKIES.dark), "on-primary": accents.dark.onPrimary },
        lightExtras,
        darkExtras,
    )(id, colors("light", lightExtras), colors("dark", darkExtras));
};

export const AURORA_STYLE: StyleDefinition = {
    id: "aurora",
    themes: (["purple", "teal", "pink", "orange"] as const).map(id => auroraTheme(id, AURORA_ACCENTS[id])),
};
