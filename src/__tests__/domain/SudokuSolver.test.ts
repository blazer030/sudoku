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
        expect(sudokuBoard.isValidSolution(result!)).toBe(true);
    });
});
