import type { Difficulty } from "@/domain";
import type { GameStep } from "@/domain/game/GameStep";
import type { CellState } from "@/application/GameState";

const STORAGE_KEY = "sudoku-statistics";

export interface GameReplayData {
    initialBoard: CellState[][];
    steps: GameStep[];
}

export interface GameResult {
    difficulty: Difficulty;
    elapsedSeconds: number;
    completed: boolean;
    date: string;
    hintsUsed: number;
    replay?: GameReplayData;
}

interface GameResultInput {
    difficulty: Difficulty;
    elapsedSeconds: number;
    completed: boolean;
    hintsUsed?: number;
    replay?: GameReplayData;
}

export interface DifficultyStats {
    gamesWon: number;
    gamesPlayed: number;
    bestTime: number | null;
    averageTime: number | null;
}

export interface OverallStats {
    gamesWon: number;
    gamesPlayed: number;
    winRate: number;
}

export interface Statistics {
    easy: DifficultyStats;
    medium: DifficultyStats;
    hard: DifficultyStats;
    overall: OverallStats;
    recentGames: GameResult[];
}

const loadHistory = (): GameResult[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return [];
    type StoredGameResult = Omit<GameResult, 'hintsUsed'> & { hintsUsed?: number };
    const raw = JSON.parse(stored) as StoredGameResult[];
    return raw.map(game => ({
        ...game,
        hintsUsed: game.hintsUsed ?? 0,
    }));
};

const saveHistory = (history: GameResult[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const recordGameResult = (input: GameResultInput): void => {
    const history = loadHistory();
    history.push({
        ...input,
        hintsUsed: input.hintsUsed ?? 0,
        date: new Date().toISOString(),
    });
    saveHistory(history);
};

export const getGameHistory = (): GameResult[] => {
    return loadHistory();
};

export const clearAllRecords = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};

const computeDifficultyStats = (games: GameResult[]): DifficultyStats => {
    const wonGames = games.filter(game => game.completed);
    return {
        gamesWon: wonGames.length,
        gamesPlayed: games.length,
        bestTime: wonGames.length > 0
            ? Math.min(...wonGames.map(game => game.elapsedSeconds))
            : null,
        averageTime: wonGames.length > 0
            ? wonGames.reduce((sum, game) => sum + game.elapsedSeconds, 0) / wonGames.length
            : null,
    };
};

export const getStatistics = (): Statistics => {
    const history = loadHistory();

    const byDifficulty = (difficulty: Difficulty) =>
        history.filter(game => game.difficulty === difficulty);

    const totalWon = history.filter(game => game.completed).length;

    return {
        easy: computeDifficultyStats(byDifficulty("easy")),
        medium: computeDifficultyStats(byDifficulty("medium")),
        hard: computeDifficultyStats(byDifficulty("hard")),
        overall: {
            gamesWon: totalWon,
            gamesPlayed: history.length,
            winRate: history.length > 0 ? totalWon / history.length : 0,
        },
        recentGames: [...history].reverse(),
    };
};
