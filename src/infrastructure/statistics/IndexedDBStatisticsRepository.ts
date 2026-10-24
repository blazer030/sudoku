import localforage from "localforage";
import type { GameResult, StatisticsRepository } from "@/application/statistics/StatisticsRepository";

const HISTORY_KEY = "history";

const store = localforage.createInstance({
    name: "sudoku",
    storeName: "statistics",
});

type StoredGameResult = Omit<GameResult, "hintsUsed"> & { hintsUsed?: number };

// Games saved before per-game records live in one array under HISTORY_KEY. It is only read, never
// rewritten; every newer game is its own record, so saving costs the same however long the history is.
const COUNT_KEY = "game-count";
const gameKey = (index: number) => `game-${index}`;

const withDefaults = (game: StoredGameResult): GameResult => ({
    ...game,
    hintsUsed: game.hintsUsed ?? 0,
});

export class IndexedDBStatisticsRepository implements StatisticsRepository {
    async load(): Promise<GameResult[]> {
        const legacy = (await store.getItem<StoredGameResult[]>(HISTORY_KEY)) ?? [];
        const count = (await store.getItem<number>(COUNT_KEY)) ?? 0;
        const recent: StoredGameResult[] = [];
        for (let index = 0; index < count; index++) {
            const game = await store.getItem<StoredGameResult>(gameKey(index));
            if (game !== null) recent.push(game);
        }
        return [...legacy, ...recent].map(withDefaults);
    }

    async append(game: GameResult): Promise<void> {
        // Strip Vue reactivity wrappers; IndexedDB's structured-clone algorithm
        // cannot serialize Proxy objects and throws DataCloneError. Only this one game is cloned.
        const plain = JSON.parse(JSON.stringify(game)) as GameResult;
        const count = (await store.getItem<number>(COUNT_KEY)) ?? 0;
        await store.setItem(gameKey(count), plain);
        await store.setItem(COUNT_KEY, count + 1);
    }

    async clear(): Promise<void> {
        const count = (await store.getItem<number>(COUNT_KEY)) ?? 0;
        for (let index = 0; index < count; index++) await store.removeItem(gameKey(index));
        await store.removeItem(COUNT_KEY);
        await store.removeItem(HISTORY_KEY);
    }
}
