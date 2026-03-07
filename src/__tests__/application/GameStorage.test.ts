import { beforeEach, describe, expect, it } from "vitest";
import { deleteSavedGame, hasSavedGame, loadGame, saveGame } from "@/application/GameStorage";
import type { GameState } from "@/application/GameState";
import type { Difficulty } from "@/domain/SudokuGenerator";

function createGameState(overrides: Partial<GameState> = {}): GameState {
    return {
        difficulty: "easy" as Difficulty,
        answer: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
        cells: Array.from({ length: 9 }, () =>
            Array.from({ length: 9 }, () => ({ clue: 0, entry: 0, notes: [] as number[] }))
        ),
        elapsedSeconds: 0,
        completed: false,
        hintsUsed: 0,
        ...overrides,
    };
}

describe("GameStorage", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe("saveGame", () => {
        it("should serialize game state to localStorage", () => {
            const state = createGameState({
                difficulty: "hard",
                elapsedSeconds: 120,
            });

            saveGame(state);

            const stored = localStorage.getItem("sudoku-save");
            expect(stored).toBe(JSON.stringify(state));
        });
    });

    describe("loadGame", () => {
        it("should deserialize game state from localStorage", () => {
            const state = createGameState({
                difficulty: "medium",
                elapsedSeconds: 60,
            });
            saveGame(state);

            const loaded = loadGame();

            expect(loaded).toEqual(state);
        });

        it("should return null when no save exists", () => {
            expect(loadGame()).toBeNull();
        });
    });

    describe("hasSavedGame", () => {
        it("should return true when save exists", () => {
            saveGame(createGameState());
            expect(hasSavedGame()).toBe(true);
        });

        it("should return false when no save exists", () => {
            expect(hasSavedGame()).toBe(false);
        });
    });

    describe("deleteSavedGame", () => {
        it("should remove saved game from localStorage", () => {
            saveGame(createGameState());
            deleteSavedGame();
            expect(loadGame()).toBeNull();
        });
    });
});
