export const COLOR_THEME_IDS = ["green", "blue", "purple", "orange", "pink", "teal"] as const;
export type ColorThemeId = typeof COLOR_THEME_IDS[number];
export const APPEARANCES = ["system", "light", "dark"] as const;
export type Appearance = typeof APPEARANCES[number];
export type ColorMode = Exclude<Appearance, "system">;
export const STYLE_IDS = ["minimal"] as const;
export type StyleId = typeof STYLE_IDS[number];
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

// Keeps only known style keys mapped to known theme ids; anything else is dropped
const usableRememberedThemes = (stored: unknown): RememberedThemes => {
    const remembered: RememberedThemes = {};
    if (!isPlainObject(stored)) return remembered;
    for (const style of STYLE_IDS) {
        const theme = stored[style];
        if (COLOR_THEME_IDS.includes(theme as ColorThemeId)) remembered[style] = theme as ColorThemeId;
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
    if (!COLOR_THEME_IDS.includes(settings.colorTheme)) settings.colorTheme = "green";
    // The current theme is the truth for the current style, which also seeds settings saved before the map existed
    settings.colorThemeByStyle = { ...usableRememberedThemes(settings.colorThemeByStyle), [settings.style]: settings.colorTheme };
    return settings;
};

export const saveSettings = (settings: Settings): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
