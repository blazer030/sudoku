import { afterEach, describe, expect, it, vi } from "vitest";
import Sudoku from "@/domain/Sudoku";
import { GameStateConverter } from "@/application/GameState";
import { knownAnswer, knownPuzzle, spyGeneratePuzzle } from "@/__tests__/fixtures/knownPuzzle";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("GameStateConverter", () => {
    describe("fromSudoku", () => {
        it("should convert Sudoku to GameState with answer and cells", () => {
            spyGeneratePuzzle();
            const sudoku = new Sudoku();
            sudoku.generate("easy");

            const state = GameStateConverter.fromSudoku(sudoku, {
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
            expect(state.cells[0][0]).toEqual({ clue: 5, entry: 0, notes: [] });
            // slot cell
            expect(state.cells[0][2]).toEqual({ clue: 0, entry: 0, notes: [] });
        });

        it("should include player input and notes", () => {
            spyGeneratePuzzle();
            const sudoku = new Sudoku();
            sudoku.generate("easy");
            sudoku.fill(0, 2, 4);
            sudoku.toggleNote(0, 3, 1);
            sudoku.toggleNote(0, 3, 6);

            const state = GameStateConverter.fromSudoku(sudoku, {
                difficulty: "easy",
                elapsedSeconds: 0,
                completed: false,
            });

            expect(state.cells[0][2]).toEqual({ clue: 0, entry: 4, notes: [] });
            expect(state.cells[0][3]).toEqual({ clue: 0, entry: 0, notes: [1, 6] });
        });

        it("should include hintsUsed from hintTracker", () => {
            spyGeneratePuzzle();
            const sudoku = new Sudoku();
            sudoku.generate("easy");
            sudoku.hintTracker.useHint();
            sudoku.hintTracker.useHint();

            const state = GameStateConverter.fromSudoku(sudoku, {
                difficulty: "easy",
                elapsedSeconds: 0,
                completed: false,
            });

            expect(state.hintsUsed).toBe(2);
        });
    });

    describe("toSudoku", () => {
        it("should restore Sudoku from GameState and allow continued play", () => {
            const state = {
                difficulty: "easy" as const,
                answer: knownAnswer.map(row => [...row]),
                cells: knownPuzzle.map((row, rowIndex) =>
                    row.map((puzzleValue, colIndex) => ({
                        clue: puzzleValue,
                        entry: rowIndex === 0 && colIndex === 2 ? 4 : 0,
                        notes: rowIndex === 0 && colIndex === 3 ? [1, 6] : [],
                    }))
                ),
                elapsedSeconds: 60,
                completed: false,
            };

            const sudoku = GameStateConverter.toSudoku(state);

            // clue 還原
            expect(sudoku.puzzle[0][0].clue).toBe(5);
            expect(sudoku.puzzle[0][0].isClue).toBe(true);
            // entry 還原
            expect(sudoku.puzzle[0][2].entry).toBe(4);
            // notes 還原
            expect(sudoku.puzzle[0][3].notes).toEqual([1, 6]);
            // 可繼續操作
            expect(sudoku.check(0, 2, 4)).toBe(true);
            expect(sudoku.isCompleted()).toBe(false);
        });

        it("should restore hintTracker totalUsed from hintsUsed", () => {
            const state = {
                difficulty: "easy" as const,
                answer: knownAnswer.map(row => [...row]),
                cells: knownPuzzle.map(row =>
                    row.map(puzzleValue => ({
                        clue: puzzleValue,
                        entry: 0,
                        notes: [] as number[],
                    }))
                ),
                elapsedSeconds: 60,
                completed: false,
                hintsUsed: 3,
            };

            const sudoku = GameStateConverter.toSudoku(state);

            expect(sudoku.hintTracker.totalUsed).toBe(3);
            expect(sudoku.hintTracker.recordedUsed).toBe(2);
        });
    });
});
