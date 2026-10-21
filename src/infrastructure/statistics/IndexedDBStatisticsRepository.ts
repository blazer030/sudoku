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
        // Strip Vue reactivity wrappers; IndexedDB's structured-clone algorithm
        // cannot serialize Proxy objects and throws DataCloneError.
        const plain = JSON.parse(JSON.stringify(history)) as GameResult[];
        await store.setItem(HISTORY_KEY, plain);
    }

    async clear(): Promise<void> {
        await store.removeItem(HISTORY_KEY);
    }
}
