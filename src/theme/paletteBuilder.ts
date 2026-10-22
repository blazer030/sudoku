// What every style's palette is made of: the tokens, and the builder that fills in each theme's
// tints and aliases. Relative imports only: scripts/ import this file through palettes.ts.
import type { ColorThemeId, StyleId } from "../application/SettingsStorage";
import { mixColors } from "./contrast";

export const PALETTE_TOKENS = [
    "background", "card", "border", "foreground", "foreground-secondary", "foreground-muted",
    "primary", "primary-hover", "primary-light", "accent", "highlight", "cell-clue",
    "danger", "danger-hover", "error", "error-surface", "shadow",
    "on-primary", "on-danger", "note", "cell-focus", "cell-scope", "cell-pattern", "scrim", "on-scrim",
    "toast", "on-toast", "cell-selected", "cell-peer", "featured", "on-featured",
    // Paper's ruled lines, margin line and night lamp; other styles paint them as their background
    "rule", "margin-line", "lamp",
] as const;
export type PaletteToken = typeof PALETTE_TOKENS[number];
export type Palette = Record<PaletteToken, string>;

export interface ThemePalette {
    id: ColorThemeId;
    light: Palette;
    dark: Palette;
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
type AliasToken = "note" | "cell-selected" | "featured" | "on-featured" | "rule" | "margin-line" | "lamp";
type StyleExtras = Partial<Pick<Palette, "featured" | "on-featured" | "rule" | "margin-line" | "lamp">>;
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
// card is a primary surface; lines and lamp vanish into the background unless a style draws them
const withAliases = (palette: Omit<Palette, AliasToken>, extras: StyleExtras): Palette => ({
    ...palette,
    "note": palette["foreground-secondary"],
    "cell-selected": palette["primary-light"],
    "featured": palette.primary,
    "on-featured": palette["on-primary"],
    "rule": palette.background,
    "margin-line": palette.background,
    "lamp": palette.background,
    ...extras,
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
        light: withAliases({
            ...lightNeutrals,
            ...light,
            ...tintsOf(light.primary, lightNeutrals.card, LIGHT_TINTS),
        }, lightExtras),
        dark: withAliases({
            ...darkNeutrals,
            ...dark,
            ...tintsOf(dark.primary, darkNeutrals.card, DARK_TINTS),
        }, darkExtras),
    });
