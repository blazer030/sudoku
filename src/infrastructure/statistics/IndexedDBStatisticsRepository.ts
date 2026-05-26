import localforage from "localforage";
import type { GameResult, StatisticsRepository } from "@/application/statistics/StatisticsRepository";

const HISTORY_KEY = "history";

const store = localforage.createInstance({
    name: "sudoku",
    storeName: "statistics",
});

type StoredGameResult = Omit<GameResult, "hintsUsed"> & { hintsUsed?: number };

export class IndexedDBStatisticsRepository implements StatisticsRepository {
    async load(): Promise<GameResult[]> {
        const stored = await store.getItem<StoredGameResult[]>(HISTORY_KEY);
        if (stored === null) return [];
        return stored.map((game) => ({
            ...game,
            hintsUsed: game.hintsUsed ?? 0,
        }));
    }

    async save(history: GameResult[]): Promise<void> {
        await store.setItem(HISTORY_KEY, history);
    }

    async clear(): Promise<void> {
        await store.removeItem(HISTORY_KEY);
    }
}
