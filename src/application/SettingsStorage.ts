export type ColorThemeId = "green" | "blue" | "purple" | "orange" | "pink" | "teal";
export const APP_LOCALES = ["en", "zh-Hant"] as const;
export const LANGUAGE_PREFERENCES = ["system", ...APP_LOCALES] as const;
export type AppLocale = typeof APP_LOCALES[number];
export type LanguagePreference = typeof LANGUAGE_PREFERENCES[number];

export interface Settings {
    colorTheme: ColorThemeId;
    highlightSameDigit: boolean;
    completionFlash: boolean;
    autoRemoveNotes: boolean;
    showRemainingCount: boolean;
    matchLauncherIconToTheme: boolean;
    language: LanguagePreference;
}

const STORAGE_KEY = "sudoku-settings";

const DEFAULT_SETTINGS: Settings = {
    colorTheme: "green",
    highlightSameDigit: true,
    completionFlash: true,
    autoRemoveNotes: true,
    showRemainingCount: true,
    matchLauncherIconToTheme: false,
    language: "system",
};

export const loadSettings = (): Settings => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return { ...DEFAULT_SETTINGS };
    const settings: Settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) as Partial<Settings> };
    // A hand-edited unknown language falls back to following the system
    if (!LANGUAGE_PREFERENCES.includes(settings.language)) settings.language = "system";
    return settings;
};

export const saveSettings = (settings: Settings): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
