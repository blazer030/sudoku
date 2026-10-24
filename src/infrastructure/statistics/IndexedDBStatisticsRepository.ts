import localforage from "localforage";
import type { GameResult, StatisticsRepository } from "@/application/statistics/StatisticsRepository";

const HISTORY_KEY = "history";

const store = localforage.createInstance({
    name: "sudoku",
    storeName: "statistics",
});

type StoredGameResult = Omit<GameResult, "hintsUsed"> & { hintsUsed?: number };

// Games saved before per-game records live in one array under HISTORY_KEY. It is only read, never
// rewritten; every newer game is its own record under a unique, time-sortable key.
const GAME_PREFIX = "game-";
// A dev build once stored `game-<n>` records plus a `game-count` counter; they are still read.
const NUMBERED_KEY = /^game-(\d+)$/;

const uniqueSuffix = (): string =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

// Strictly increasing within this page, so games finished in the same millisecond keep their order.
let lastStamp = 0;
const newGameKey = (): string => {
    lastStamp = Math.max(Date.now(), lastStamp + 1);
    return `${GAME_PREFIX}${String(lastStamp).padStart(15, "0")}-${uniqueSuffix()}`;
};

const withDefaults = (game: StoredGameResult): GameResult => ({
    ...game,
    hintsUsed: game.hintsUsed ?? 0,
});

export class IndexedDBStatisticsRepository implements StatisticsRepository {
    async load(): Promise<GameResult[]> {
        let legacy: StoredGameResult[] = [];
        const numbered: { order: number; game: StoredGameResult }[] = [];
        const timed: { key: string; game: StoredGameResult }[] = [];
        await store.iterate<unknown, undefined>((value, key) => {
            if (key === HISTORY_KEY) {
                legacy = value as StoredGameResult[];
                return undefined;
            }
            const match = NUMBERED_KEY.exec(key);
            if (match !== null) numbered.push({ order: Number(match[1]), game: value as StoredGameResult });
            else if (key.startsWith(GAME_PREFIX) && key !== "game-count") timed.push({ key, game: value as StoredGameResult });
            return undefined;
        });
        numbered.sort((left, right) => left.order - right.order);
        timed.sort((left, right) => (left.key < right.key ? -1 : 1));
        return [...legacy, ...numbered.map((entry) => entry.game), ...timed.map((entry) => entry.game)].map(withDefaults);
    }

    async append(game: GameResult): Promise<void> {
        // Strip Vue reactivity wrappers; IndexedDB's structured-clone algorithm
        // cannot serialize Proxy objects and throws DataCloneError. Only this one game is cloned.
        const plain = JSON.parse(JSON.stringify(game)) as GameResult;
        await store.setItem(newGameKey(), plain);
    }

    async clear(): Promise<void> {
        await store.clear();
    }
}
