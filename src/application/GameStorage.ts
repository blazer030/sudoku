import type { GameState } from "@/application/GameState";

const STORAGE_KEY = "sudoku-save";

export const saveGame = (state: GameState): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadGame = (): GameState | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return null;
    return JSON.parse(stored) as GameState;
};

export const hasSavedGame = (): boolean => {
    return localStorage.getItem(STORAGE_KEY) !== null;
};

export const deleteSavedGame = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};
