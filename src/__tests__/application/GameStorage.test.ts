import { beforeEach, describe, expect, it } from "vitest";
import { saveGame, type GameState } from "@/application/GameStorage";
import type { Difficulty } from "@/domain/SudokuGenerator";

function createGameState(overrides: Partial<GameState> = {}): GameState {
    return {
        difficulty: "easy" as Difficulty,
        answer: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
        cells: Array.from({ length: 9 }, () =>
            Array.from({ length: 9 }, () => ({ value: 0, input: 0, notes: [] as number[] }))
        ),
        elapsedSeconds: 0,
        completed: false,
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
            expect(stored).not.toBeNull();
            const parsed: unknown = JSON.parse(stored!);
            expect(parsed).toEqual(state);
        });
    });
});
