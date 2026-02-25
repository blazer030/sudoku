import { describe, expect, it } from "vitest";
import { generateFullBoard } from "@/domain/SudokuGenerator";
import { isValidSolution } from "./helpers";

describe("SudokuGenerator", () => {
    it("should generate a valid 9x9 board that satisfies all sudoku rules", () => {
        const board = generateFullBoard();

        expect(board).toHaveLength(9);
        board.forEach(row => {
            expect(row).toHaveLength(9);
        });
        expect(isValidSolution(board)).toBe(true);
    });
});
