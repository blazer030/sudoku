// The only place colour values live. src/style/themes.generated.css is rendered from this
// file by `npm run generate:theme-css`. Relative imports only: scripts/ import this file.
import type { ColorMode, ColorThemeId, RememberedThemes, StyleId } from "../application/SettingsStorage";
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
type LightThemeColors = Pick<Palette, "primary" | "primary-hover" | "primary-light" | "accent" | "highlight">;
type DarkThemeColors = Pick<Palette, "primary" | "primary-hover" | "accent">;
type DerivedToken = "primary-light" | "highlight" | "cell-focus" | "cell-scope" | "cell-pattern" | "cell-peer";
// Tokens that repeat another token of the same palette unless a style sets its own
type AliasToken = "note" | "cell-selected" | "featured" | "on-featured" | "rule" | "margin-line" | "lamp";
type StyleExtras = Partial<Pick<Palette, "featured" | "on-featured" | "rule" | "margin-line" | "lamp">>;
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
const themeBuilder = (
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

const minimalTheme = themeBuilder(MINIMAL_LIGHT_NEUTRALS, MINIMAL_DARK_NEUTRALS);

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


// Tactile tiles: warm stone light neutrals and a cool graphite dark, so raised pieces read
// against a recessed tray. Primaries are darker than the reference's so board inks still
// read on the strongest board layer.
const TACTILE_LIGHT_NEUTRALS: Neutrals<LightThemeColors> = {
    "background": "#EBE7E0",
    "card": "#FCFBF8",
    "border": "#D0C9BD",
    "foreground": "#2A2724",
    "foreground-secondary": "#504B45",
    "foreground-muted": "#655F57",
    "cell-clue": "#E2DDD4",
    "danger": "#A9473A",
    "danger-hover": "#9A3B2F",
    "error": "#951C15",
    "error-surface": "#FBE7E1",
    "shadow": "#2A2724",
    "on-primary": "#FFFFFF",
    "on-danger": "#FFFFFF",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    "toast": "#2A2724",
    "on-toast": "#EBE7E0",
};

const TACTILE_DARK_NEUTRALS: Neutrals<DarkThemeColors> = {
    "background": "#1A1C1F",
    "card": "#282B30",
    "border": "#3C4046",
    "foreground": "#EDEAE5",
    "foreground-secondary": "#CDCAC4",
    "foreground-muted": "#A5A29C",
    "cell-clue": "#3B3F45",
    "danger": "#E5806F",
    "danger-hover": "#EC8C7C",
    "error": "#FFBDB2",
    "error-surface": "#4A3532",
    "shadow": "#000000",
    "on-primary": "#1A1C1F",
    "on-danger": "#1A1C1F",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    "toast": "#3E4248",
    "on-toast": "#EDEAE5",
};

const tactileTheme = themeBuilder(TACTILE_LIGHT_NEUTRALS, TACTILE_DARK_NEUTRALS);

const TACTILE: StyleDefinition = {
    id: "tactile",
    themes: [
        tactileTheme("green",
            { "primary": "#1F5C3A", "primary-hover": "#175230", "primary-light": "#D3EBDB", "accent": "#8E553A", "highlight": "#8FD3A8" },
            { "primary": "#9CDEB4", "primary-hover": "#A8E6BF", "accent": "#E0A385" }),
        tactileTheme("blue",
            { "primary": "#24508A", "primary-hover": "#1C4780", "primary-light": "#D5E3F4", "accent": "#865F22", "highlight": "#A8C8EE" },
            { "primary": "#ADCDF5", "primary-hover": "#B8D5F8", "accent": "#D2A866" }),
        tactileTheme("rust",
            { "primary": "#782F16", "primary-hover": "#6E2810", "primary-light": "#F4DDD3", "accent": "#336B6E", "highlight": "#EFBAA4" },
            { "primary": "#F7B89D", "primary-hover": "#FAC2AA", "accent": "#7FB6B8" }),
        tactileTheme("slate",
            { "primary": "#34506E", "primary-hover": "#2C4664", "primary-light": "#DAE2EC", "accent": "#7F5B2E", "highlight": "#B3C5DA" },
            { "primary": "#B7CBE5", "primary-hover": "#C1D3EA", "accent": "#CFA672" }),
    ],
};

// Paper notebook: warm paper by day, a night desk by lamplight. Inks are the theme colours;
// the continue card is a yellow sticky note. Muted text is darker than the reference so it
// still reads where it crosses a ruled line.
const PAPER_LIGHT_NEUTRALS: Neutrals<LightThemeColors> = {
    "background": "#F4EDE0",
    "card": "#FBF7EF",
    "border": "#DCD0BB",
    "foreground": "#2F2C35",
    "foreground-secondary": "#4E4A50",
    "foreground-muted": "#5E5850",
    "cell-clue": "#E6DCCB",
    "danger": "#A8423A",
    "danger-hover": "#983730",
    "error": "#951C15",
    "error-surface": "#FBE5DF",
    "shadow": "#2F2C35",
    "on-primary": "#FFFFFF",
    "on-danger": "#FFFFFF",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    "toast": "#2F2C35",
    "on-toast": "#F4EDE0",
};

const PAPER_DARK_NEUTRALS: Neutrals<DarkThemeColors> = {
    "background": "#201D19",
    "card": "#2A2621",
    "border": "#3D372F",
    "foreground": "#EDE4D3",
    "foreground-secondary": "#E2D9C8",
    "foreground-muted": "#DCD2C0",
    "cell-clue": "#3B362E",
    "danger": "#E8846F",
    "danger-hover": "#EE917E",
    "error": "#FFB8A8",
    "error-surface": "#4A342D",
    "shadow": "#000000",
    "on-primary": "#201D19",
    "on-danger": "#201D19",
    "scrim": "#000000",
    "on-scrim": "#FFFFFF",
    "toast": "#3D372F",
    "on-toast": "#EDE4D3",
};

const paperTheme = themeBuilder(PAPER_LIGHT_NEUTRALS, PAPER_DARK_NEUTRALS, {
    "featured": "#F7E6A0",
    "on-featured": "#3A3326",
    "rule": "#CFDCE4",
    "margin-line": "#E9B9AF",
}, {
    "featured": "#4A4230",
    "on-featured": "#F3E8CC",
    "rule": "#2B343B",
    "margin-line": "#583833",
    "lamp": "#FFBE6E",
});

const PAPER: StyleDefinition = {
    id: "paper",
    themes: [
        paperTheme("blueInk",
            { "primary": "#2B4A7A", "primary-hover": "#22406F", "primary-light": "#DCE4F0", "accent": "#8A5A20", "highlight": "#AFC3E2" },
            { "primary": "#BFD3F4", "primary-hover": "#C9DBF6", "accent": "#D9AE70" }),
        paperTheme("greenInk",
            { "primary": "#235A3C", "primary-hover": "#1B5034", "primary-light": "#D8EBDD", "accent": "#8E4F3A", "highlight": "#9ECFAF" },
            { "primary": "#ADDFBF", "primary-hover": "#B8E6C8", "accent": "#E2A68E" }),
        paperTheme("redInk",
            { "primary": "#8E2533", "primary-hover": "#831D2B", "primary-light": "#F5DCDF", "accent": "#2F6B60", "highlight": "#EDB8BF" },
            { "primary": "#F8C3CA", "primary-hover": "#FACDD3", "accent": "#86C0B4" }),
    ],
};

export const STYLES: Record<StyleId, StyleDefinition> = {
    minimal: MINIMAL,
    tactile: TACTILE,
    paper: PAPER,
};

export const DEFAULT_STYLE_ID: StyleId = "minimal";

const findTheme = (style: StyleId, themeId: ColorThemeId): ThemePalette => {
    const themes = (STYLES[style] as StyleDefinition | undefined ?? STYLES[DEFAULT_STYLE_ID]).themes;
    return themes.find(theme => theme.id === themeId) ?? themes[0];
};

/** The theme a style comes back to: the one remembered for it, or the style's first theme. */
export const rememberedThemeFor = (style: StyleId, remembered: RememberedThemes): ColorThemeId => {
    const themes = STYLES[style].themes;
    return themes.find(theme => theme.id === remembered[style])?.id ?? themes[0].id;
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
