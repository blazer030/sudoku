import { vi, describe, it, expect, beforeEach } from "vitest";
import { reactive, isReactive } from "vue";
import type { GameResult } from "@/application/statistics/StatisticsRepository";

const mocks = vi.hoisted(() => {
    const store = new Map<string, unknown>();
    const instance = {
        getItem: vi.fn(<T>(key: string): Promise<T | null> => Promise.resolve((store.get(key) as T | undefined) ?? null)),
        setItem: vi.fn(<T>(key: string, value: T): Promise<T> => {
            store.set(key, value);
            return Promise.resolve(value);
        }),
        iterate: vi.fn(<T>(visitor: (value: unknown, key: string, iterationNumber: number) => T | undefined): Promise<T | undefined> => {
            let number = 1;
            for (const [key, value] of [...store.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
                const result = visitor(value, key, number++);
                if (result !== undefined) return Promise.resolve(result);
            }
            return Promise.resolve(undefined);
        }),
        clear: vi.fn((): Promise<void> => {
            store.clear();
            return Promise.resolve();
        }),
        removeItem: vi.fn((key: string): Promise<void> => {
            store.delete(key);
            return Promise.resolve();
        }),
    };
    return { store, instance };
});

vi.mock("localforage", () => ({
    default: {
        createInstance: vi.fn(() => mocks.instance),
    },
}));

import { IndexedDBStatisticsRepository } from "@/infrastructure/statistics/IndexedDBStatisticsRepository";

const sampleGame: GameResult = {
    difficulty: "easy",
    elapsedSeconds: 60,
    completed: true,
    date: "2026-05-26T00:00:00.000Z",
    hintsUsed: 1,
};

beforeEach(() => {
    mocks.store.clear();
});

describe("IndexedDBStatisticsRepository", () => {
    it("load returns empty array when storage is empty", async () => {
        const repo = new IndexedDBStatisticsRepository();
        await expect(repo.load()).resolves.toEqual([]);
    });

    it("save then load roundtrips the history", async () => {
        const repo = new IndexedDBStatisticsRepository();
        await repo.append(sampleGame);
        await expect(repo.load()).resolves.toEqual([sampleGame]);
    });

    it("load fills missing hintsUsed with 0 for backward compatibility", async () => {
        mocks.store.set("history", [{ ...sampleGame, hintsUsed: undefined }]);
        const repo = new IndexedDBStatisticsRepository();
        const result = await repo.load();
        expect(result[0].hintsUsed).toBe(0);
    });

    it("clear removes the saved history", async () => {
        const repo = new IndexedDBStatisticsRepository();
        await repo.append(sampleGame);
        await repo.clear();
        await expect(repo.load()).resolves.toEqual([]);
    });

    it("save strips Vue reactivity wrappers before storing (IndexedDB DataCloneError fix)", async () => {
        const repo = new IndexedDBStatisticsRepository();
        await repo.append(reactive({ ...sampleGame }));
        const stored = [...mocks.store.entries()].find(([key]) => key.startsWith("game-"))?.[1];
        expect(isReactive(stored)).toBe(false);
        expect(stored).toEqual(sampleGame);
    });

    it("append writes just the new game as one record and leaves the stored history untouched", async () => {
        const legacy = Array.from({ length: 20 }, () => ({ ...sampleGame }));
        mocks.store.set("history", legacy);
        const repo = new IndexedDBStatisticsRepository();
        mocks.instance.setItem.mockClear();

        await repo.append(sampleGame);

        expect(mocks.instance.setItem).toHaveBeenCalledTimes(1);
        expect(mocks.instance.setItem).toHaveBeenCalledWith(expect.stringMatching(/^game-/), sampleGame);
        expect(mocks.store.get("history")).toBe(legacy);
    });

    it("load returns the legacy array followed by games appended later, in order", async () => {
        mocks.store.set("history", [{ ...sampleGame, elapsedSeconds: 1 }]);
        const repo = new IndexedDBStatisticsRepository();
        await repo.append({ ...sampleGame, elapsedSeconds: 2 });
        await repo.append({ ...sampleGame, elapsedSeconds: 3 });
        const result = await repo.load();
        expect(result.map((game) => game.elapsedSeconds)).toEqual([1, 2, 3]);
    });

    it("orders appended games by time even across a digit-count change", async () => {
        const repo = new IndexedDBStatisticsRepository();
        vi.useFakeTimers();
        try {
            vi.setSystemTime(9_999_999_999_999);
            await repo.append({ ...sampleGame, elapsedSeconds: 1 });
            vi.setSystemTime(10_000_000_000_000);
            await repo.append({ ...sampleGame, elapsedSeconds: 2 });
        } finally {
            vi.useRealTimers();
        }
        expect((await repo.load()).map((game) => game.elapsedSeconds)).toEqual([1, 2]);
    });

    it("keeps both games when two appends overlap", async () => {
        const repo = new IndexedDBStatisticsRepository();
        await Promise.all([
            repo.append({ ...sampleGame, elapsedSeconds: 1 }),
            repo.append({ ...sampleGame, elapsedSeconds: 2 }),
        ]);
        expect(await repo.load()).toHaveLength(2);
    });

    it("loads in a single pass over the storage", async () => {
        const repo = new IndexedDBStatisticsRepository();
        for (let index = 0; index < 5; index++) await repo.append(sampleGame);
        mocks.instance.getItem.mockClear();
        mocks.instance.iterate.mockClear();
        await repo.load();
        expect(mocks.instance.iterate).toHaveBeenCalledTimes(1);
        expect(mocks.instance.getItem.mock.calls.length).toBeLessThanOrEqual(1);
    });

    it("still loads the numbered records and ignores the counter an earlier build left", async () => {
        mocks.store.set("history", [{ ...sampleGame, elapsedSeconds: 1 }]);
        mocks.store.set("game-0", { ...sampleGame, elapsedSeconds: 2 });
        mocks.store.set("game-1", { ...sampleGame, elapsedSeconds: 3 });
        mocks.store.set("game-10", { ...sampleGame, elapsedSeconds: 4 });
        mocks.store.set("game-count", 11);
        const repo = new IndexedDBStatisticsRepository();
        await repo.append({ ...sampleGame, elapsedSeconds: 5 });
        expect((await repo.load()).map((game) => game.elapsedSeconds)).toEqual([1, 2, 3, 4, 5]);
    });

    it("clear removes legacy and appended games alike", async () => {
        mocks.store.set("history", [sampleGame]);
        const repo = new IndexedDBStatisticsRepository();
        await repo.append(sampleGame);
        await repo.clear();
        expect(mocks.store.size).toBe(0);
        await expect(repo.load()).resolves.toEqual([]);
    });
});
