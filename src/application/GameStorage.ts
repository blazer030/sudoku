import type { Difficulty } from "@/domain/SudokuGenerator";

export interface CellState {
    value: number;
    input: number;
    notes: number[];
}

export interface GameState {
    difficulty: Difficulty;
    answer: number[][];
    cells: CellState[][];
    elapsedSeconds: number;
    completed: boolean;
}

const STORAGE_KEY = "sudoku-save";

export function saveGame(state: GameState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadGame(): GameState | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return null;
    return JSON.parse(stored) as GameState;
}
