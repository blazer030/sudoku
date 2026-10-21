import type { GameResult, StatisticsRepository } from "@/application/statistics/StatisticsRepository";

const STORAGE_KEY = "sudoku-statistics";

export class LocalStorageStatisticsRepository implements StatisticsRepository {
    load(): Promise<GameResult[]> {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) return Promise.resolve([]);
        type StoredGameResult = Omit<GameResult, "hintsUsed"> & { hintsUsed?: number };
        const raw = JSON.parse(stored) as StoredGameResult[];
        return Promise.resolve(raw.map((game) => ({
            ...game,
            hintsUsed: game.hintsUsed ?? 0,
        })));
    }

    save(history: GameResult[]): Promise<void> {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return Promise.resolve();
    }

    clear(): Promise<void> {
        localStorage.removeItem(STORAGE_KEY);
        return Promise.resolve();
    }
}
