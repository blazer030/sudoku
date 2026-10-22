import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useGameStore } from "@/stores/gameStore";
import type { GameState } from "@/application/GameState";
import type { GameRepository } from "@/application/game/GameRepository";
import { knownPuzzle, knownAnswer } from "@/__tests__/fixtures/knownPuzzle";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";

const sampleState: GameState = {
    difficulty: "easy",
    answer: knownAnswer.map((row) => [...row]),
    cells: knownPuzzle.map((row) => row.map((value) => ({ clue: value, entry: 0, notes: [] }))),
    elapsedSeconds: 42,
    completed: false,
    hintsUsed: 0,
};

const buildGameRepo = (overrides: Partial<GameRepository> = {}): GameRepository => ({
    load: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

vi.mock("@/application/PuzzleGenerationService", () => ({
    generatePuzzleAsync: vi.fn(() => Promise.resolve({
        puzzle: knownPuzzle.map(row => [...row]),
        answer: knownAnswer.map(row => [...row]),
    })),
}));

describe("gameStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("should start with no game, difficulty or save", () => {
        const store = useGameStore();

        expect(store.sudoku).toBeNull();
        expect(store.hasActiveGame).toBe(false);
        expect(store.difficulty).toBeNull();
        expect(store.savedGame).toBeNull();
    });

    it("startNewGame should create a new game in store", async () => {
        const store = useGameStore();
        await store.startNewGame("medium");

        expect(store.sudoku).not.toBeNull();
        expect(store.difficulty).toBe("medium");
        expect(store.hasActiveGame).toBe(true);
    });

    it("startNewGame should give each new game its own serial number", async () => {
        const store = useGameStore();
        expect(store.gameSerial).toBe(0);

        await store.startNewGame("easy");

        expect(store.gameSerial).toBe(1);
    });

    it("loadSavedGame should restore a game from GameState", () => {
        const store = useGameStore();
        const state: GameState = {
            difficulty: "hard",
            answer: knownAnswer.map(row => [...row]),
            cells: knownPuzzle.map(row =>
                row.map(value => ({ clue: value, entry: 0, notes: [] }))
            ),
            elapsedSeconds: 120,
            completed: false,
            hintsUsed: 0,
        };

        store.loadSavedGame(state);

        expect(store.sudoku).not.toBeNull();
        expect(store.difficulty).toBe("hard");
        expect(store.elapsedSeconds).toBe(120);
        expect(store.hasActiveGame).toBe(true);
    });

    it("should update difficulty via setDifficulty", () => {
        const store = useGameStore();
        store.setDifficulty("hard");
        expect(store.difficulty).toBe("hard");
    });

    it("emits game_start analytics event on startNewGame", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const analytics: AnalyticsService = { logEvent };
        const store = useGameStore();
        store.setAnalytics(analytics);

        await store.startNewGame("medium");

        expect(logEvent).toHaveBeenCalledWith({
            name: "game_start",
            difficulty: "medium",
        });
    });

    describe("replay of a continued game", () => {
        const replay = {
            initialBoard: sampleState.cells,
            steps: [{
                board: sampleState.cells.map(row => row.map(cell => ({ entry: cell.entry, notes: [1, 2] }))),
                action: "autoNotes" as const,
                row: 0,
                column: 0,
                value: 0,
            }],
        };

        it("round-trips the replay through save and load", async () => {
            let stored: GameState | null = null;
            const repo = buildGameRepo({
                save: vi.fn((state: GameState) => {
                    stored = JSON.parse(JSON.stringify(state)) as GameState;
                    return Promise.resolve();
                }),
                load: vi.fn(() => Promise.resolve(stored)),
            });
            const savingStore = useGameStore();
            savingStore.setGameRepository(repo);
            savingStore.persistGame({ ...sampleState, replay });

            setActivePinia(createPinia());
            const loadingStore = useGameStore();
            loadingStore.setGameRepository(repo);
            await loadingStore.loadFromRepository();
            const saved = loadingStore.savedGame;
            if (saved === null) throw new Error("savedGame was not loaded");
            loadingStore.loadSavedGame(saved);

            expect(loadingStore.replay).toEqual(replay);
        });

        it("has no replay after loading a save from before replays were saved", () => {
            const store = useGameStore();

            store.loadSavedGame(sampleState);

            expect(store.replay).toBeNull();
        });

        it("drops the continued game's replay when a new game starts", async () => {
            const store = useGameStore();
            store.loadSavedGame({ ...sampleState, replay });

            await store.startNewGame("easy");

            expect(store.replay).toBeNull();
        });
    });

    describe("saved game persistence", () => {
        it("loadFromRepository hydrates savedGame from repository", async () => {
            const repo = buildGameRepo({ load: vi.fn().mockResolvedValue(sampleState) });
            const store = useGameStore();
            store.setGameRepository(repo);

            await store.loadFromRepository();

            expect(store.savedGame).toEqual(sampleState);
        });

        it("persistGame sets savedGame synchronously and saves to repository", async () => {
            const save = vi.fn().mockResolvedValue(undefined);
            const repo = buildGameRepo({ save });
            const store = useGameStore();
            store.setGameRepository(repo);

            store.persistGame(sampleState);
            await Promise.resolve();

            expect(store.savedGame).toEqual(sampleState);
            expect(save).toHaveBeenCalledWith(sampleState);
        });

        it("persistGame stays resilient when the repository rejects (the bug that motivated this refactor)", async () => {
            const save = vi.fn().mockRejectedValue(new DOMException("QuotaExceededError", "QuotaExceededError"));
            const repo = buildGameRepo({ save });
            const store = useGameStore();
            store.setGameRepository(repo);

            expect(() => { store.persistGame(sampleState); }).not.toThrow();
            await Promise.resolve();
            await Promise.resolve();
            expect(store.savedGame).toEqual(sampleState);
        });

        it("clearSavedGame nulls savedGame and clears repository", async () => {
            const clear = vi.fn().mockResolvedValue(undefined);
            const repo = buildGameRepo({
                load: vi.fn().mockResolvedValue(sampleState),
                clear,
            });
            const store = useGameStore();
            store.setGameRepository(repo);
            await store.loadFromRepository();

            await store.clearSavedGame();

            expect(store.savedGame).toBeNull();
            expect(clear).toHaveBeenCalledTimes(1);
        });
    });
});
