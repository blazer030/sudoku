// What every style's palette is made of: the tokens, and the builder that fills in each theme's
// tints and aliases. Relative imports only: scripts/ import this file through palettes.ts.
import type { ColorThemeId, StyleId } from "./themeIds";
import { mixColors } from "./contrast";

export const PALETTE_TOKENS = [
    "background", "card", "border", "foreground", "foreground-secondary", "foreground-muted",
    "primary", "primary-hover", "primary-light", "accent", "highlight", "cell-clue",
    "danger", "danger-hover", "error", "error-surface", "shadow",
    "on-primary", "on-danger", "note", "cell-focus", "cell-scope", "cell-pattern", "scrim", "on-scrim",
    "toast", "on-toast", "cell-selected", "cell-peer", "featured", "on-featured",
    // Paper's ruled lines and margin line; other styles paint them as their background
    "rule", "margin-line",
] as const;
export type PaletteToken = typeof PALETTE_TOKENS[number];
export type Palette = Record<PaletteToken, string>;

export interface ThemePalette {
    id: ColorThemeId;
    /** A palette for each mode the theme's style has (STYLE_COLOR_MODES), and none for a mode it lacks. */
    light?: Palette;
    dark?: Palette;
}

export interface StyleDefinition {
    id: StyleId;
    themes: readonly ThemePalette[];
}

// Per-theme colours; the remaining tokens are shared neutrals or tints derived below
export type LightThemeColors = Pick<Palette, "primary" | "primary-hover" | "primary-light" | "accent" | "highlight">;
export type DarkThemeColors = Pick<Palette, "primary" | "primary-hover" | "accent">;
type DerivedToken = "primary-light" | "highlight" | "cell-focus" | "cell-scope" | "cell-pattern" | "cell-peer";
// Tokens that repeat another token of the same palette unless a style sets its own
type AliasToken = "note" | "cell-selected" | "featured" | "on-featured" | "rule" | "margin-line";
// A style's own values for aliases, and for the same-digit fill and the primary's light surface where a
// fixed palette sets them rather than tinting the primary
type StyleExtras = Partial<Pick<Palette, "featured" | "on-featured" | "rule" | "margin-line" | "highlight" | "primary-light">>;
export type Neutrals<ThemeColors> = Omit<Palette, keyof ThemeColors | DerivedToken | AliasToken>;

// Values are tuned so every pair in paletteContrast.test.ts meets WCAG AA. The board layers
// run card → cell-clue → highlight from light to dark in light mode, and the reverse in dark
// mode, far enough apart to tell apart; board inks must still read on the strongest layer.

// Board tints are the primary painted over the card at these strengths
const LIGHT_TINTS = { "cell-focus": 0.22, "cell-scope": 0.08, "cell-pattern": 0.15, "cell-peer": 0.12 } as const;
const DARK_TINTS = {
    "primary-light": 0.18, "highlight": 0.25, "cell-focus": 0.24, "cell-scope": 0.1, "cell-pattern": 0.17, "cell-peer": 0.12,
} as const;

const tintsOf = <Token extends DerivedToken>(primary: string, card: string, strengths: Readonly<Record<Token, number>>) =>
    Object.fromEntries(Object.entries<number>(strengths).map(([token, alpha]) =>
        [token, mixColors(primary, alpha, card)])) as Record<Token, string>;

// Notes use the secondary text colour; the selected cell uses the primary tint; the continue
// card is a primary surface; lines vanish into the background unless a style draws them
const withAliases = (palette: Omit<Palette, AliasToken>, extras: StyleExtras): Palette => ({
    ...palette,
    "note": palette["foreground-secondary"],
    "cell-selected": palette["primary-light"],
    "featured": palette.primary,
    "on-featured": palette["on-primary"],
    "rule": palette.background,
    "margin-line": palette.background,
    ...extras,
});

const lightPalette = (neutrals: Neutrals<LightThemeColors>, light: LightThemeColors, extras: StyleExtras): Palette =>
    withAliases({
        ...neutrals,
        ...light,
        ...tintsOf(light.primary, neutrals.card, LIGHT_TINTS),
    }, extras);

const darkPalette = (neutrals: Neutrals<DarkThemeColors>, dark: DarkThemeColors, extras: StyleExtras): Palette =>
    withAliases({
        ...neutrals,
        ...dark,
        ...tintsOf(dark.primary, neutrals.card, DARK_TINTS),
    }, extras);

// A light-only style's theme builder: its own neutrals under each theme's colours and tints
export const lightOnlyThemeBuilder = (lightNeutrals: Neutrals<LightThemeColors>, lightExtras: StyleExtras = {}) =>
    (id: ColorThemeId, light: LightThemeColors): ThemePalette => ({
        id,
        light: lightPalette(lightNeutrals, light, lightExtras),
    });

// A dark-only style's theme builder, the mirror of the light-only one
export const darkOnlyThemeBuilder = (darkNeutrals: Neutrals<DarkThemeColors>, darkExtras: StyleExtras = {}) =>
    (id: ColorThemeId, dark: DarkThemeColors): ThemePalette => ({
        id,
        dark: darkPalette(darkNeutrals, dark, darkExtras),
    });

// A style's theme builder: its own neutrals under each theme's colours and tints
export const themeBuilder = (
    lightNeutrals: Neutrals<LightThemeColors>,
    darkNeutrals: Neutrals<DarkThemeColors>,
    lightExtras: StyleExtras = {},
    darkExtras: StyleExtras = {},
) =>
    (id: ColorThemeId, light: LightThemeColors, dark: DarkThemeColors): ThemePalette => ({
        id,
        light: lightPalette(lightNeutrals, light, lightExtras),
        dark: darkPalette(darkNeutrals, dark, darkExtras),
    });
