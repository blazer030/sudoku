import { vi, describe, it, expect, beforeEach } from "vitest";
import { reactive, isReactive } from "vue";
import type { GameState } from "@/application/GameState";

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

import { IndexedDBGameRepository } from "@/infrastructure/game/IndexedDBGameRepository";

const sampleState: GameState = {
    difficulty: "easy",
    answer: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
    cells: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({ clue: 0, entry: 0, notes: [] }))),
    elapsedSeconds: 42,
    completed: false,
    hintsUsed: 0,
};

beforeEach(() => {
    mocks.store.clear();
});

describe("IndexedDBGameRepository", () => {
    it("load returns null when storage is empty", async () => {
        const repo = new IndexedDBGameRepository();
        await expect(repo.load()).resolves.toBeNull();
    });

    it("save then load roundtrips the game state", async () => {
        const repo = new IndexedDBGameRepository();
        await repo.save(sampleState);
        await expect(repo.load()).resolves.toEqual(sampleState);
    });

    it("clear removes the saved game", async () => {
        const repo = new IndexedDBGameRepository();
        await repo.save(sampleState);
        await repo.clear();
        await expect(repo.load()).resolves.toBeNull();
    });

    it("save strips Vue reactivity wrappers before storing (IndexedDB DataCloneError fix)", async () => {
        const repo = new IndexedDBGameRepository();
        const reactiveState = reactive({ ...sampleState });
        await repo.save(reactiveState);
        const stored = mocks.store.get("saved-game");
        expect(isReactive(stored)).toBe(false);
        expect(stored).toEqual(sampleState);
    });
});
