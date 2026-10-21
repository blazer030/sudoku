// The only place colour values live. src/style/themes.generated.css is rendered from this
// file by `npm run generate:theme-css`. Relative imports only: scripts/ import this file.
import type { ColorMode, ColorThemeId, StyleId } from "../application/SettingsStorage";

export const PALETTE_TOKENS = [
    "background", "card", "border", "foreground", "foreground-secondary", "foreground-muted",
    "primary", "primary-hover", "primary-light", "accent", "highlight", "cell-clue",
    "danger", "danger-hover", "error", "error-surface", "shadow",
    "on-primary", "on-danger", "note", "cell-focus", "cell-scope", "cell-pattern", "scrim", "on-scrim",
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

type ThemeAccents = Pick<Palette,
    "primary" | "primary-hover" | "primary-light" | "accent" | "highlight" | "cell-focus" | "cell-scope" | "cell-pattern">;

const MINIMAL_LIGHT_NEUTRALS: Omit<Palette, keyof ThemeAccents> = {
    "background": "#F5F4F1",
    "card": "#FFFFFF",
    "border": "#E5E4E1",
    "foreground": "#1A1918",
    "foreground-secondary": "#6D6C6A",
    "foreground-muted": "#9C9B99",
    "cell-clue": "#F7F6F3",
    "danger": "#C75A4A",
    "danger-hover": "#B34E40",
    "error": "#D08068",
    "error-surface": "#FDEAE6",
    "shadow": "#1A1918",
    "on-primary": "#FFFFFF",
    "on-danger": "#FFFFFF",
    "note": "#9C9B99",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
};

const minimalTheme = (id: ColorThemeId, accents: ThemeAccents): ThemePalette => {
    const light: Palette = { ...MINIMAL_LIGHT_NEUTRALS, ...accents };
    return { id, light, dark: { ...light } };
};

const MINIMAL: StyleDefinition = {
    id: "minimal",
    themes: [
        minimalTheme("green", {
            "primary": "#3D8A5A", "primary-hover": "#347A4E", "primary-light": "#C8F0D8",
            "accent": "#D89575", "highlight": "#E8F8EE",
            "cell-focus": "#B1D0BD", "cell-scope": "#E2EDE6", "cell-pattern": "#C5DCCE",
        }),
        minimalTheme("blue", {
            "primary": "#4A7AB5", "primary-hover": "#3E6A9E", "primary-light": "#D0E4F7",
            "accent": "#C49A5C", "highlight": "#E4EFF9",
            "cell-focus": "#B7CAE1", "cell-scope": "#E4EBF4", "cell-pattern": "#C9D7E9",
        }),
        minimalTheme("purple", {
            "primary": "#7B5EA7", "primary-hover": "#6B5093", "primary-light": "#E4D8F0",
            "accent": "#5A9E8F", "highlight": "#EFE8F6",
            "cell-focus": "#CABFDC", "cell-scope": "#EBE7F2", "cell-pattern": "#D7CFE5",
        }),
        minimalTheme("orange", {
            "primary": "#C08040", "primary-hover": "#A87038", "primary-light": "#F5E0C8",
            "accent": "#6888A5", "highlight": "#F9F0E4",
            "cell-focus": "#E6CCB3", "cell-scope": "#F6ECE2", "cell-pattern": "#ECD9C6",
        }),
        minimalTheme("pink", {
            "primary": "#B5607A", "primary-hover": "#A0536B", "primary-light": "#F7D4DE",
            "accent": "#5A9A8A", "highlight": "#FBEAEF",
            "cell-focus": "#E1BFCA", "cell-scope": "#F4E7EB", "cell-pattern": "#E9CFD7",
        }),
        minimalTheme("teal", {
            "primary": "#4A9A9A", "primary-hover": "#3E8686", "primary-light": "#D0F0F0",
            "accent": "#C07A6A", "highlight": "#E4F4F4",
            "cell-focus": "#B7D7D7", "cell-scope": "#E4F0F0", "cell-pattern": "#C9E1E1",
        }),
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
