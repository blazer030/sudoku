export type ThemeId = "classic" | "gbc";

export interface Settings {
    theme: ThemeId;
}

const STORAGE_KEY = "sudoku-settings";

const DEFAULT_SETTINGS: Settings = {
    theme: "classic",
};

export const loadSettings = (): Settings => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) as Partial<Settings> };
};

export const saveSettings = (settings: Settings): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
