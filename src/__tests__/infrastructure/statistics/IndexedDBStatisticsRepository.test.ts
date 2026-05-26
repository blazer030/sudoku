import { vi, describe, it, expect, beforeEach } from "vitest";
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
        await repo.save([sampleGame]);
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
        await repo.save([sampleGame]);
        await repo.clear();
        await expect(repo.load()).resolves.toEqual([]);
    });
});
