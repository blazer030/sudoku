import { afterEach, describe, expect, it, vi } from "vitest";
import Sudoku from "@/domain/Sudoku";
import { toGameState } from "@/application/GameStateConverter";
import { knownAnswer, spyGeneratePuzzle } from "@/__tests__/fixtures/knownPuzzle";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("GameStateConverter", () => {
    describe("toGameState", () => {
        it("should convert Sudoku to GameState with answer and cells", () => {
            spyGeneratePuzzle();
            const sudoku = new Sudoku();
            sudoku.generate("easy");

            const state = toGameState(sudoku, {
                difficulty: "easy",
                elapsedSeconds: 30,
                completed: false,
            });

            expect(state.difficulty).toBe("easy");
            expect(state.answer).toEqual(knownAnswer);
            expect(state.elapsedSeconds).toBe(30);
            expect(state.completed).toBe(false);
            expect(state.cells).toHaveLength(9);
            expect(state.cells[0]).toHaveLength(9);
            // clue cell
            expect(state.cells[0][0]).toEqual({ value: 5, input: 0, notes: [] });
            // slot cell
            expect(state.cells[0][2]).toEqual({ value: 0, input: 0, notes: [] });
        });

        it("should include player input and notes", () => {
            spyGeneratePuzzle();
            const sudoku = new Sudoku();
            sudoku.generate("easy");
            sudoku.input(0, 2, 4);
            sudoku.toggleNote(0, 3, 1);
            sudoku.toggleNote(0, 3, 6);

            const state = toGameState(sudoku, {
                difficulty: "easy",
                elapsedSeconds: 0,
                completed: false,
            });

            expect(state.cells[0][2]).toEqual({ value: 0, input: 4, notes: [] });
            expect(state.cells[0][3]).toEqual({ value: 0, input: 0, notes: [1, 6] });
        });
    });
});
