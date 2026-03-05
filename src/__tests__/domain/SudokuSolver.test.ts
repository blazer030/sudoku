import { describe, expect, it } from "vitest";
import { SudokuBoard } from "@/domain/SudokuBoard";
import { SudokuSolver } from "@/domain/SudokuSolver";

const sudokuBoard = new SudokuBoard();
const solver = new SudokuSolver();

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
