// The only place colour values live. src/style/themes.generated.css is rendered from this
// file by `npm run generate:theme-css`. Relative imports only: scripts/ import this file.
import type { ColorMode, ColorThemeId, StyleId } from "../application/SettingsStorage";
import { mixColors } from "./contrast";

export const PALETTE_TOKENS = [
    "background", "card", "border", "foreground", "foreground-secondary", "foreground-muted",
    "primary", "primary-hover", "primary-light", "accent", "highlight", "cell-clue",
    "danger", "danger-hover", "error", "error-surface", "shadow",
    "on-primary", "on-danger", "note", "cell-focus", "cell-scope", "cell-pattern", "scrim", "on-scrim",
    "toast", "on-toast",
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
type DerivedToken = "primary-light" | "highlight" | "cell-focus" | "cell-scope" | "cell-pattern";

// Values are tuned so every pair in paletteContrast.test.ts meets WCAG AA
const MINIMAL_LIGHT_NEUTRALS: Omit<Palette, keyof LightThemeColors | DerivedToken> = {
    "background": "#F5F4F1",
    "card": "#FFFFFF",
    "border": "#E5E4E1",
    "foreground": "#1A1918",
    "foreground-secondary": "#5C5B59",
    "foreground-muted": "#6F6E6C",
    "cell-clue": "#F7F6F3",
    "danger": "#B84C3D",
    "danger-hover": "#A73D2F",
    "error": "#B5231B",
    "error-surface": "#FDEAE6",
    "shadow": "#1A1918",
    "on-primary": "#FFFFFF",
    "on-danger": "#FFFFFF",
    "note": "#5E5D5B",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    "toast": "#1A1918",
    "on-toast": "#F5F4F1",
};

// Direction C neutrals; primaries are light tints, so text on them is dark
const MINIMAL_DARK_NEUTRALS: Omit<Palette, keyof DarkThemeColors | DerivedToken> = {
    "background": "#111110",
    "card": "#1D1D1B",
    "border": "#2D2D2A",
    "foreground": "#F3F2EE",
    "foreground-secondary": "#A9A7A2",
    "foreground-muted": "#878684",
    "cell-clue": "#191917",
    "danger": "#D36554",
    "danger-hover": "#E47463",
    "error": "#FF8B78",
    "error-surface": "#3C2C27",
    "shadow": "#000000",
    "on-primary": "#111110",
    "on-danger": "#111110",
    "note": "#ADACA9",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    // A raised dark surface, not an inverted light block
    "toast": "#34342F",
    "on-toast": "#F3F2EE",
};

// Board tints are the primary painted over the card at these strengths
const LIGHT_TINTS = { "cell-focus": 0.22, "cell-scope": 0.08, "cell-pattern": 0.15 } as const;
const DARK_TINTS = {
    "primary-light": 0.18, "highlight": 0.13, "cell-focus": 0.24, "cell-scope": 0.1, "cell-pattern": 0.17,
} as const;

const tintsOf = <Token extends DerivedToken>(primary: string, card: string, strengths: Readonly<Record<Token, number>>) =>
    Object.fromEntries(Object.entries<number>(strengths).map(([token, alpha]) =>
        [token, mixColors(primary, alpha, card)])) as Record<Token, string>;

const minimalTheme = (id: ColorThemeId, light: LightThemeColors, dark: DarkThemeColors): ThemePalette => ({
    id,
    light: {
        ...MINIMAL_LIGHT_NEUTRALS,
        ...light,
        ...tintsOf(light.primary, MINIMAL_LIGHT_NEUTRALS.card, LIGHT_TINTS),
    },
    dark: {
        ...MINIMAL_DARK_NEUTRALS,
        ...dark,
        ...tintsOf(dark.primary, MINIMAL_DARK_NEUTRALS.card, DARK_TINTS),
    },
});

const MINIMAL: StyleDefinition = {
    id: "minimal",
    themes: [
        minimalTheme("green",
            { "primary": "#1A6C3E", "primary-hover": "#005E31", "primary-light": "#C8F0D8", "accent": "#9A5C3E", "highlight": "#E8F8EE" },
            { "primary": "#6EBB88", "primary-hover": "#7ECB97", "accent": "#D89575" }),
        minimalTheme("blue",
            { "primary": "#316099", "primary-hover": "#235289", "primary-light": "#D0E4F7", "accent": "#8C6524", "highlight": "#E4EFF9" },
            { "primary": "#7CAFED", "primary-hover": "#8BBFFE", "accent": "#C49A5C" }),
        minimalTheme("purple",
            { "primary": "#6E5199", "primary-hover": "#604389", "primary-light": "#E4D8F0", "accent": "#327769", "highlight": "#EFE8F6" },
            { "primary": "#BC9EED", "primary-hover": "#CCAEFE", "accent": "#5A9E8F" }),
        minimalTheme("orange",
            { "primary": "#8C5000", "primary-hover": "#7C4200", "primary-light": "#F5E0C8", "accent": "#506F8B", "highlight": "#F9F0E4" },
            { "primary": "#DE9C5C", "primary-hover": "#EFAC6C", "accent": "#7394B1" }),
        minimalTheme("pink",
            { "primary": "#95435E", "primary-hover": "#853550", "primary-light": "#F7D4DE", "accent": "#367667", "highlight": "#FBEAEF" },
            { "primary": "#EB91AA", "primary-hover": "#FCA1BA", "accent": "#5C9C8C" }),
        minimalTheme("teal",
            { "primary": "#0B696A", "primary-hover": "#005B5C", "primary-light": "#D0F0F0", "accent": "#9D5A4B", "highlight": "#E4F4F4" },
            { "primary": "#69B8B8", "primary-hover": "#79C8C8", "accent": "#C57E6E" }),
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

/** The browser theme-color and Android bar colour: the primary in light mode, the page background in dark mode. */
export const systemBarColor = (style: StyleId, themeId: ColorThemeId, mode: ColorMode): string => {
    const palette = getPalette(style, themeId, mode);
    return mode === "light" ? palette.primary : palette.background;
};
