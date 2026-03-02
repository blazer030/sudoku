import { describe, expect, it } from "vitest";
import Sudoku from "@/domain/Sudoku";

describe("Sudoku", () => {
    it("should generate a different puzzle each time", () => {
        const sudoku1 = new Sudoku();
        const sudoku2 = new Sudoku();
        const puzzle1 = sudoku1.generate();
        const puzzle2 = sudoku2.generate();

        const values1 = puzzle1.flat().map(cell => cell.value);
        const values2 = puzzle2.flat().map(cell => cell.value);

        expect(values1).not.toEqual(values2);
    });

    it("should generate an easy puzzle with correct number of tips", () => {
        const sudoku = new Sudoku();
        const puzzle = sudoku.generate("easy");

        const tips = puzzle.flat().filter(cell => cell.isTip).length;
        expect(tips).toBeGreaterThanOrEqual(36);
        expect(tips).toBeLessThanOrEqual(45);
    });
});
