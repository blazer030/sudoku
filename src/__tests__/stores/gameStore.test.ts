import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useGameStore } from "@/stores/gameStore";
import type { GameState } from "@/application/GameState";
import { knownPuzzle, knownAnswer } from "@/__tests__/fixtures/knownPuzzle";

describe("gameStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("should have null as default difficulty", () => {
        const store = useGameStore();
        expect(store.difficulty).toBeNull();
    });

    it("should have no active game by default", () => {
        const store = useGameStore();
        expect(store.sudoku).toBeNull();
        expect(store.hasActiveGame).toBe(false);
    });

    it("startNewGame should create a new game in store", () => {
        const store = useGameStore();
        store.startNewGame("medium");

        expect(store.sudoku).not.toBeNull();
        expect(store.difficulty).toBe("medium");
        expect(store.hasActiveGame).toBe(true);
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
});
