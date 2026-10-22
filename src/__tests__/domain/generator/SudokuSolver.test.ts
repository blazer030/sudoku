import { afterEach, describe, expect, it, vi } from "vitest";
import { SudokuBoard } from "@/domain/board/SudokuBoard";
import { SudokuSolver, UNKNOWN_SOLUTION_COUNT } from "@/domain/generator/SudokuSolver";
import { openNoSolutionPuzzle } from "@/__tests__/fixtures/openPuzzles";
import { singlesPuzzle } from "@/__tests__/fixtures/singlesPuzzle";

const sudokuBoard = new SudokuBoard();
const solver = new SudokuSolver();

afterEach(() => {
    vi.restoreAllMocks();
});

describe("SudokuSolver", () => {
    it("should return null for an unsolvable board", () => {
        const board = [
            [1, 2, 3, 4, 5, 6, 7, 8, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 9],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 9],
        ];

        const result = solver.solve(board);

        expect(result).toBeNull();
    });

    it("countSolutions should return 1 for a puzzle with a unique solution", () => {
        const board = [
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [4, 5, 6, 7, 8, 9, 1, 2, 3],
            [7, 8, 9, 1, 2, 3, 4, 5, 6],
            [2, 3, 1, 5, 6, 4, 8, 9, 7],
            [5, 6, 4, 8, 9, 7, 2, 3, 1],
            [8, 9, 7, 2, 3, 1, 5, 6, 4],
            [3, 1, 2, 6, 4, 5, 9, 7, 8],
            [6, 4, 5, 9, 7, 8, 3, 1, 2],
            [9, 7, 8, 3, 1, 2, 6, 4, 0],
        ];

        expect(solver.countSolutions(board)).toBe(1);
    });

    it("countSolutions should return 2 for a puzzle with multiple solutions (limit=2)", () => {
        const board = [
            [4, 9, 0, 0, 0, 0, 8, 0, 0],
            [2, 0, 0, 0, 9, 0, 0, 0, 4],
            [0, 0, 3, 0, 0, 2, 0, 6, 0],
            [0, 0, 5, 3, 0, 0, 0, 0, 2],
            [0, 0, 0, 5, 0, 4, 0, 0, 0],
            [3, 0, 4, 0, 0, 9, 5, 0, 0],
            [5, 0, 0, 0, 7, 0, 9, 0, 8],
            [0, 0, 9, 0, 0, 8, 0, 0, 5],
            [8, 0, 0, 0, 0, 0, 0, 3, 1],
        ];

        expect(solver.countSolutions(board, 2)).toBe(2);
    });

    it("countSolutions should return 0 for an unsolvable board", () => {
        const board = [
            [1, 2, 3, 4, 5, 6, 7, 8, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 9],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 9],
        ];

        expect(solver.countSolutions(board)).toBe(0);
    });

    it("should count no solutions when two givens already conflict", () => {
        const emptyBoard = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
        const sameRow = emptyBoard();
        sameRow[0][0] = 5;
        sameRow[0][4] = 5;
        const sameBox = emptyBoard();
        sameBox[0][0] = 5;
        sameBox[1][1] = 5;

        expect(solver.countSolutions(sameRow, 2)).toBe(0);
        expect(solver.countSolutions(sameBox, 2)).toBe(0);
    });

    it("should give up at once when an empty cell has no candidate", () => {
        const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
        for (let row = 1; row <= 8; row++) board[row][8] = row;
        board[0][0] = 9;
        const placementCheck = vi.spyOn(SudokuBoard.prototype, "isValidPlacement");

        expect(solver.countSolutions(board, 2)).toBe(0);
        expect(placementCheck.mock.calls.length).toBeLessThan(5000);
    });

    describe("with a node budget", () => {
        it("should report an unknown count when the search runs past its budget", () => {
            expect(solver.countSolutions(openNoSolutionPuzzle, 2, { maxNodes: 1000 })).toBe(UNKNOWN_SOLUTION_COUNT);
        });

        it("should count normally when the search fits in its budget", () => {
            expect(solver.countSolutions(singlesPuzzle, 2, { maxNodes: 1000 })).toBe(1);
        });
    });

    it("should solve a standard difficulty puzzle", () => {
        const board = [
            [4, 9, 0, 0, 0, 0, 8, 0, 0],
            [2, 0, 0, 0, 9, 0, 0, 0, 4],
            [0, 0, 3, 0, 0, 2, 0, 6, 0],
            [0, 0, 5, 3, 0, 0, 0, 0, 2],
            [0, 0, 0, 5, 0, 4, 0, 0, 0],
            [3, 0, 4, 0, 0, 9, 5, 0, 0],
            [5, 0, 0, 0, 7, 0, 9, 0, 8],
            [0, 0, 9, 0, 0, 8, 0, 0, 5],
            [8, 0, 0, 0, 0, 0, 0, 3, 1],
        ];

        const result = solver.solve(board);

        expect(result).not.toBeNull();
        if (!result) return;
        expect(sudokuBoard.isValidSolution(result)).toBe(true);
    });
});
