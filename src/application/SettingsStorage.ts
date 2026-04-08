export type ColorThemeId = "green" | "blue" | "purple" | "orange" | "pink" | "teal";

export interface Settings {
    colorTheme: ColorThemeId;
    highlightSameDigit: boolean;
    completionFlash: boolean;
    autoRemoveNotes: boolean;
    showRemainingCount: boolean;
}

const STORAGE_KEY = "sudoku-settings";

const DEFAULT_SETTINGS: Settings = {
    colorTheme: "green",
    highlightSameDigit: true,
    completionFlash: true,
    autoRemoveNotes: true,
    showRemainingCount: true,
};

export const loadSettings = (): Settings => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) as Partial<Settings> };
};

export const saveSettings = (settings: Settings): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
