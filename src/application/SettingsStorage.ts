export const STYLE_IDS = ["minimal", "tactile", "paper"] as const;
export type StyleId = typeof STYLE_IDS[number];
/** Launcher aliases and PWA icon sets exist for these six only. */
export const ICON_THEME_IDS = ["green", "blue", "purple", "orange", "pink", "teal"] as const;
export type IconThemeId = typeof ICON_THEME_IDS[number];
/** Each style's own colour themes, in the order the picker shows them; the first is the style's default. */
export const THEME_IDS_BY_STYLE = {
    minimal: ICON_THEME_IDS,
    // Tactile's green and blue are its own palettes; a theme is always looked up within its style
    tactile: ["green", "blue", "rust", "slate"],
    paper: ["blueInk", "greenInk", "redInk"],
} as const satisfies Record<StyleId, readonly string[]>;
export type ColorThemeId = typeof THEME_IDS_BY_STYLE[StyleId][number];
/** Every style's theme ids together, in first-seen order. */
export const COLOR_THEME_IDS: readonly ColorThemeId[] = [...new Set(STYLE_IDS.flatMap(style => THEME_IDS_BY_STYLE[style]))];
export const APPEARANCES = ["system", "light", "dark"] as const;
export type Appearance = typeof APPEARANCES[number];
export type ColorMode = Exclude<Appearance, "system">;
export const APP_LOCALES = ["en", "zh-Hant"] as const;
export const LANGUAGE_PREFERENCES = ["system", ...APP_LOCALES] as const;
export type AppLocale = typeof APP_LOCALES[number];
export type LanguagePreference = typeof LANGUAGE_PREFERENCES[number];

export type RememberedThemes = Partial<Record<StyleId, ColorThemeId>>;

export interface Settings {
    colorTheme: ColorThemeId;
    highlightSameDigit: boolean;
    completionFlash: boolean;
    autoRemoveNotes: boolean;
    showRemainingCount: boolean;
    matchLauncherIconToTheme: boolean;
    language: LanguagePreference;
    appearance: Appearance;
    style: StyleId;
    highlightScope: boolean;
    seenLongPressTip: boolean;
    // The colour theme last chosen under each style, so switching styles comes back to it
    colorThemeByStyle: RememberedThemes;
}

// index.html's inline script reads these fields too (style, colorTheme, appearance) before first paint
const STORAGE_KEY = "sudoku-settings";

const DEFAULT_SETTINGS: Settings = {
    colorTheme: "green",
    highlightSameDigit: true,
    completionFlash: true,
    autoRemoveNotes: true,
    showRemainingCount: true,
    matchLauncherIconToTheme: false,
    language: "system",
    appearance: "system",
    style: "minimal",
    highlightScope: true,
    seenLongPressTip: false,
    colorThemeByStyle: { minimal: "green" },
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const isThemeOf = (style: StyleId, theme: unknown): theme is ColorThemeId =>
    (THEME_IDS_BY_STYLE[style] as readonly unknown[]).includes(theme);

// Keeps only known style keys mapped to one of that style's own theme ids; anything else is dropped
const usableRememberedThemes = (stored: unknown): RememberedThemes => {
    const remembered: RememberedThemes = {};
    if (!isPlainObject(stored)) return remembered;
    for (const style of STYLE_IDS) {
        const theme = stored[style];
        if (isThemeOf(style, theme)) remembered[style] = theme;
    }
    return remembered;
};

export const loadSettings = (): Settings => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // A fresh map every load, so a change to one result never leaks into the defaults
    if (stored === null) return { ...DEFAULT_SETTINGS, colorThemeByStyle: { ...DEFAULT_SETTINGS.colorThemeByStyle } };
    const settings: Settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) as Partial<Settings> };
    // A hand-edited unknown language falls back to following the system
    if (!LANGUAGE_PREFERENCES.includes(settings.language)) settings.language = "system";
    // Unknown appearance, style or theme ids (hand-edited, or from a future version) fall back too
    if (!APPEARANCES.includes(settings.appearance)) settings.appearance = "system";
    if (!STYLE_IDS.includes(settings.style)) settings.style = "minimal";
    const remembered = usableRememberedThemes(settings.colorThemeByStyle);
    // A theme of another style (or an unknown one) falls back to the style's remembered theme, then its
    // first, the same rule as rememberedThemeFor; index.html's inline script mirrors it
    if (!isThemeOf(settings.style, settings.colorTheme)) {
        settings.colorTheme = remembered[settings.style] ?? THEME_IDS_BY_STYLE[settings.style][0];
    }
    // The current theme is the truth for the current style, which also seeds settings saved before the map existed
    settings.colorThemeByStyle = { ...remembered, [settings.style]: settings.colorTheme };
    return settings;
};

export const saveSettings = (settings: Settings): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
