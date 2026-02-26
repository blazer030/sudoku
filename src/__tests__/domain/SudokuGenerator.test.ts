import { describe, expect, it } from "vitest";
import { SudokuGenerator } from "@/domain/SudokuGenerator";
import { isValidSolution } from "./helpers";

const generator = new SudokuGenerator();

describe("SudokuGenerator", () => {
    it("should generate different boards on multiple calls", () => {
        const boards = Array.from({ length: 5 }, () => generator.generateFullBoard());
        const serialized = boards.map(board => JSON.stringify(board));
        const unique = new Set(serialized);

        expect(unique.size).toBeGreaterThan(1);
    });

    it("should generate a valid 9x9 board that satisfies all sudoku rules", () => {
        const board = generator.generateFullBoard();

        expect(board).toHaveLength(9);
        board.forEach(row => {
            expect(row).toHaveLength(9);
        });
        expect(isValidSolution(board)).toBe(true);
    });
});
