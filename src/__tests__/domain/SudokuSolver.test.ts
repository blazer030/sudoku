import { describe, expect, it } from "vitest";
import { SudokuSolver } from "@/domain/SudokuSolver";
import { isValidSolution } from "./helpers";

const solver = new SudokuSolver();

describe("SudokuSolver", () => {
    it("should correctly fill in a board missing only one cell", () => {
        const board = [
            [4, 9, 6, 7, 5, 1, 8, 2, 3],
            [2, 1, 8, 6, 9, 3, 7, 5, 4],
            [7, 5, 3, 4, 8, 2, 1, 6, 9],
            [1, 8, 5, 3, 6, 7, 4, 9, 2],
            [9, 6, 2, 5, 1, 4, 3, 8, 7],
            [3, 7, 4, 8, 2, 9, 5, 1, 6],
            [5, 3, 1, 2, 7, 6, 9, 4, 8],
            [6, 4, 9, 1, 3, 8, 2, 7, 5],
            [8, 2, 7, 9, 4, 5, 6, 3, 0],
        ];

        const result = solver.solve(board);

        expect(result).not.toBeNull();
        expect(result![8][8]).toBe(1);
    });

    it("should solve a board with a few missing cells", () => {
        const board = [
            [4, 9, 6, 7, 5, 1, 8, 2, 3],
            [2, 1, 8, 6, 9, 3, 7, 5, 4],
            [7, 5, 3, 4, 8, 2, 1, 6, 9],
            [1, 8, 5, 3, 6, 7, 4, 9, 2],
            [9, 6, 2, 5, 1, 4, 3, 8, 7],
            [3, 7, 4, 8, 2, 9, 5, 1, 6],
            [5, 3, 1, 2, 7, 6, 9, 4, 8],
            [6, 4, 9, 1, 3, 8, 2, 0, 0],
            [8, 2, 7, 9, 4, 5, 0, 0, 0],
        ];

        const result = solver.solve(board);

        expect(result).not.toBeNull();
        expect(result![7][7]).toBe(7);
        expect(result![7][8]).toBe(5);
        expect(result![8][6]).toBe(6);
        expect(result![8][7]).toBe(3);
        expect(result![8][8]).toBe(1);
    });

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
        expect(isValidSolution(result!)).toBe(true);
    });
});
