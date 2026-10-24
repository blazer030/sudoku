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
        const stored = mocks.store.get("game-0");
        expect(isReactive(stored)).toBe(false);
        expect(stored).toEqual(sampleGame);
    });

    it("append writes one record and leaves the stored history untouched", async () => {
        const legacy = Array.from({ length: 20 }, () => ({ ...sampleGame }));
        mocks.store.set("history", legacy);
        const repo = new IndexedDBStatisticsRepository();
        const stringify = vi.spyOn(JSON, "stringify");
        mocks.instance.setItem.mockClear();

        await repo.append(sampleGame);

        const serialised = stringify.mock.calls.length;
        stringify.mockRestore();
        expect(serialised).toBe(1);
        expect(mocks.instance.setItem.mock.calls.map(([key]) => key)).toEqual(["game-0", "game-count"]);
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

    it("clear removes legacy and appended games alike", async () => {
        mocks.store.set("history", [sampleGame]);
        const repo = new IndexedDBStatisticsRepository();
        await repo.append(sampleGame);
        await repo.clear();
        expect(mocks.store.size).toBe(0);
        await repo.append(sampleGame);
        await expect(repo.load()).resolves.toEqual([sampleGame]);
    });
});
