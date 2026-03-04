import type { Difficulty } from "@/domain/SudokuGenerator";

const STORAGE_KEY = "sudoku-statistics";

export interface GameResult {
    difficulty: Difficulty;
    elapsedSeconds: number;
    completed: boolean;
    date: string;
}

interface GameResultInput {
    difficulty: Difficulty;
    elapsedSeconds: number;
    completed: boolean;
}

function loadHistory(): GameResult[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return [];
    return JSON.parse(stored) as GameResult[];
}

function saveHistory(history: GameResult[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function recordGameResult(input: GameResultInput): void {
    const history = loadHistory();
    history.push({
        ...input,
        date: new Date().toISOString(),
    });
    saveHistory(history);
}

export function getGameHistory(): GameResult[] {
    return loadHistory();
}
