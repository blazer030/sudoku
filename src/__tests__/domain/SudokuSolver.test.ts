import { describe, expect, it } from "vitest";
import { solve } from "@/domain/SudokuSolver";

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

        const result = solve(board);

        expect(result).not.toBeNull();
        expect(result![8][8]).toBe(1);
    });
});
