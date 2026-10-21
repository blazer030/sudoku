// The only place colour values live. src/style/themes.generated.css is rendered from this
// file by `npm run generate:theme-css`. Relative imports only: scripts/ import this file.
import type { ColorMode, ColorThemeId, StyleId } from "../application/SettingsStorage";
import { mixColors } from "./contrast";

export const PALETTE_TOKENS = [
    "background", "card", "border", "foreground", "foreground-secondary", "foreground-muted",
    "primary", "primary-hover", "primary-light", "accent", "highlight", "cell-clue",
    "danger", "danger-hover", "error", "error-surface", "shadow",
    "on-primary", "on-danger", "note", "cell-focus", "cell-scope", "cell-pattern", "scrim", "on-scrim",
    "toast", "on-toast", "cell-selected", "cell-peer",
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
type LightThemeColors = Pick<Palette, "primary" | "primary-hover" | "primary-light" | "accent" | "highlight">;
type DarkThemeColors = Pick<Palette, "primary" | "primary-hover" | "accent">;
type DerivedToken = "primary-light" | "highlight" | "cell-focus" | "cell-scope" | "cell-pattern" | "cell-peer";
// Tokens that repeat another token of the same palette
type AliasToken = "note" | "cell-selected";
type Neutrals<ThemeColors> = Omit<Palette, keyof ThemeColors | DerivedToken | AliasToken>;

// Values are tuned so every pair in paletteContrast.test.ts meets WCAG AA. The board layers
// run card → cell-clue → highlight from light to dark in light mode, and the reverse in dark
// mode, far enough apart to tell apart; board inks must still read on the strongest layer.
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

// Board tints are the primary painted over the card at these strengths
const LIGHT_TINTS = { "cell-focus": 0.22, "cell-scope": 0.08, "cell-pattern": 0.15, "cell-peer": 0.12 } as const;
const DARK_TINTS = {
    "primary-light": 0.18, "highlight": 0.25, "cell-focus": 0.24, "cell-scope": 0.1, "cell-pattern": 0.17, "cell-peer": 0.12,
} as const;

const tintsOf = <Token extends DerivedToken>(primary: string, card: string, strengths: Readonly<Record<Token, number>>) =>
    Object.fromEntries(Object.entries<number>(strengths).map(([token, alpha]) =>
        [token, mixColors(primary, alpha, card)])) as Record<Token, string>;

// Notes use the secondary text colour; the selected cell uses the primary tint
const withAliases = (palette: Omit<Palette, AliasToken>): Palette => ({
    ...palette,
    "note": palette["foreground-secondary"],
    "cell-selected": palette["primary-light"],
});

const minimalTheme = (id: ColorThemeId, light: LightThemeColors, dark: DarkThemeColors): ThemePalette => ({
    id,
    light: withAliases({
        ...MINIMAL_LIGHT_NEUTRALS,
        ...light,
        ...tintsOf(light.primary, MINIMAL_LIGHT_NEUTRALS.card, LIGHT_TINTS),
    }),
    dark: withAliases({
        ...MINIMAL_DARK_NEUTRALS,
        ...dark,
        ...tintsOf(dark.primary, MINIMAL_DARK_NEUTRALS.card, DARK_TINTS),
    }),
});

const MINIMAL: StyleDefinition = {
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

export const STYLES: Record<StyleId, StyleDefinition> = {
    minimal: MINIMAL,
};

export const DEFAULT_STYLE_ID: StyleId = "minimal";

const findTheme = (style: StyleId, themeId: ColorThemeId): ThemePalette => {
    const themes = (STYLES[style] as StyleDefinition | undefined ?? STYLES[DEFAULT_STYLE_ID]).themes;
    return themes.find(theme => theme.id === themeId) ?? themes[0];
};

export const getPalette = (style: StyleId, themeId: ColorThemeId, mode: ColorMode): Palette =>
    findTheme(style, themeId)[mode];

/**
 * The browser theme-color: the primary in light mode, the page background in dark mode.
 * The Android app's own system bars take the page background instead (see appearanceSync).
 */
export const systemBarColor = (style: StyleId, themeId: ColorThemeId, mode: ColorMode): string => {
    const palette = getPalette(style, themeId, mode);
    return mode === "light" ? palette.primary : palette.background;
};
