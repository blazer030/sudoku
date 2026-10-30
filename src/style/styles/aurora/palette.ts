// Relative imports only: scripts/ import this file through src/theme/palettes.ts.
import { themeBuilder, type DarkThemeColors, type LightThemeColors, type Neutrals, type StyleDefinition } from "../../../theme/paletteBuilder";
import { mixColors } from "../../../theme/contrast";
import type { ColorMode, ColorThemeId } from "../../../theme/themeIds";

// Aurora Glass: four lights drifting behind panes of frosted glass, from the style-research canvas (Aurora.dc.html).
// 夜空 (dark) is a deep night sky with pale text; 晨光 (light) is a dawn with dark text and softer lights. A theme
// changes only the colour chosen with (primary, selection, the player's digits) and, where the sky's red would pass
// for that colour, the error's; the sky, the lights and the glass are the same in all four. Every glass pane is laid over the page's brightest point, "the ground", as the skin
// lays them, so each board colour here is the colour the skin finally paints.

/** The error colour and its hover, which a danger button darkens to in 晨光 and lightens to in 夜空 */
interface AuroraError { error: string; errorHover: string }

interface AuroraSky extends AuroraError {
    background: string;
    foreground: string;
    foregroundSecondary: string;
    onDanger: string;
    lights: readonly [string, string, string, string];
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
        lights: ["#19E6A3", "#7C4DFF", "#1FB6FF", "#FF6FB5"],
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
        lights: ["#7FE7C9", "#B7A4FF", "#8CCBFF", "#FFC2A6"],
        glass: "#FFFFFF",
        sheen: "#FFFFFF",
    },
};

/**
 * How dense each pane of glass is and how strong the lights are, per mode. The skin's custom properties
 * (--aurora-strength, --aurora-glass-card, ...) carry the same numbers, as fractions here and percentages there.
 */
export interface AuroraDensity {
    /** The opacity of each light */
    strength: number;
    card: number;
    cell: number;
    /** The sheen laid on a cell's glass */
    sheenCell: number;
    /** The sheen laid over that for a cell in the selected cell's row, column or box */
    sheenPeer: number;
    dialog: number;
    /** The primary laid on the glass: the soft surface and the same digit */
    tintSoft: number;
    tintSame: number;
    errorWash: number;
    errorStripe: number;
}

export const AURORA_DENSITIES: Readonly<Record<ColorMode, AuroraDensity>> = {
    light: { strength: 0.62, card: 0.8, cell: 0.8, sheenCell: 0, sheenPeer: 0.75, dialog: 1, tintSoft: 0.06, tintSame: 0.08, errorWash: 0.05, errorStripe: 0.08 },
    dark: { strength: 0.3, card: 0.8, cell: 0.88, sheenCell: 0.06, sheenPeer: 0.05, dialog: 0.97, tintSoft: 0.08, tintSame: 0.08, errorWash: 0.05, errorStripe: 0.08 },
};

/** The ribbon that crosses the page: how far each of its two lights shows and how strong it is. */
export const AURORA_RIBBON = { first: 0.55, second: 0.45, strength: 0.8 } as const;

// The light that sits brightest behind the board: 夜空's first light, 晨光's second
const GROUND_LIGHT: Readonly<Record<ColorMode, 0 | 1>> = { dark: 0, light: 1 };
// The ribbon's two lights are 夜空's first and 晨光's second, so each ground carries that light's share of it
const GROUND_RIBBON: Readonly<Record<ColorMode, number>> = { dark: AURORA_RIBBON.first, light: AURORA_RIBBON.second };

/** The colour of the page where the lights are brightest: the lights' blob under the ribbon's two lights over it. */
export const auroraGround = (mode: ColorMode): string => {
    const sky = AURORA_SKIES[mode];
    const light = sky.lights[GROUND_LIGHT[mode]];
    const { strength } = AURORA_DENSITIES[mode];
    const blob = mixColors(light, strength, sky.background);
    return mixColors(light, strength * GROUND_RIBBON[mode] * AURORA_RIBBON.strength, blob);
};

interface AuroraSurfaces {
    ground: string;
    card: string;
    cellGlass: string;
    peerGlass: string;
    dialog: string;
}

const auroraSurfaces = (mode: ColorMode): AuroraSurfaces => {
    const sky = AURORA_SKIES[mode];
    const density = AURORA_DENSITIES[mode];
    const ground = auroraGround(mode);
    const cellGlass = mixColors(sky.sheen, density.sheenCell, mixColors(sky.glass, density.cell, ground));
    return {
        ground,
        card: mixColors(sky.glass, density.card, ground),
        cellGlass,
        peerGlass: mixColors(sky.sheen, density.sheenPeer, cellGlass),
        dialog: mixColors(sky.glass, density.dialog, ground),
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

// What a theme changes: the colour chosen with and the text on it, per mode, and the error where the sky's red lies
// too near that colour in hue
interface AuroraAccent { primary: string; primaryHover: string; onPrimary: string; error?: AuroraError }

const AURORA_ACCENTS: Readonly<Record<"purple" | "teal" | "pink" | "orange", Record<ColorMode, AuroraAccent>>> = {
    purple: {
        dark: { primary: "#A897FF", primaryHover: "#BBAEFF", onPrimary: "#120B30" },
        light: { primary: "#5B3FE0", primaryHover: "#4C33C2", onPrimary: "#FFFFFF" },
    },
    teal: {
        dark: { primary: "#4FE3C1", primaryHover: "#74EBD0", onPrimary: "#052A22" },
        light: { primary: "#0A6F61", primaryHover: "#085C51", onPrimary: "#FFFFFF" },
    },
    // A red-orange, as the sky's red reads as the same red as the pink
    pink: {
        dark: { primary: "#FF8CC6", primaryHover: "#FFA8D4", onPrimary: "#3A0820", error: { error: "#FF8F5A", errorHover: "#FFA57B" } },
        light: { primary: "#C2185B", primaryHover: "#A21349", onPrimary: "#FFFFFF", error: { error: "#A34400", errorHover: "#893900" } },
    },
    // A crimson-rose, as the sky's red lies close to the orange
    orange: {
        dark: { primary: "#FFB86B", primaryHover: "#FFC98C", onPrimary: "#3A1E00", error: { error: "#FF8FAB", errorHover: "#FFA5BC" } },
        light: { primary: "#A84808", primaryHover: "#8F3D06", onPrimary: "#FFFFFF", error: { error: "#A3165E", errorHover: "#89124F" } },
    },
};

// A mode's board tints, which are the primary laid on the glass; the lights and the glass are its own colours
const auroraExtras = (mode: ColorMode, primary: string) => {
    const sky = AURORA_SKIES[mode];
    const density = AURORA_DENSITIES[mode];
    const { card, cellGlass, peerGlass } = auroraSurfaces(mode);
    const sameDigit = mixColors(primary, density.tintSame, cellGlass);
    return {
        "primary-light": mixColors(primary, density.tintSoft, card),
        "highlight": sameDigit,
        "cell-selected": primary,
        "cell-focus": mixColors(primary, density.tintSoft, cellGlass),
        "cell-scope": peerGlass,
        "cell-peer": peerGlass,
        "cell-pattern": sameDigit,
        "aurora-1": sky.lights[0],
        "aurora-2": sky.lights[1],
        "aurora-3": sky.lights[2],
        "aurora-4": sky.lights[3],
        "glass": sky.glass,
        "glass-sheen": sky.sheen,
    };
};

const auroraTheme = (id: ColorThemeId, accents: Record<ColorMode, AuroraAccent>) => {
    const lightExtras = auroraExtras("light", accents.light.primary);
    const darkExtras = auroraExtras("dark", accents.dark.primary);
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
