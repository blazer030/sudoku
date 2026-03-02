import { describe, expect, it } from "vitest";
import Sudoku from "@/domain/Sudoku";

describe("Sudoku", () => {
    it("should correctly check answers against the solution", () => {
        const sudoku = new Sudoku();
        const puzzle = sudoku.generate("easy");

        const tipCell = puzzle.flat().find(cell => cell.isTip);
        expect(tipCell).toBeDefined();
        if (!tipCell) return;
        const row = puzzle.findIndex(puzzleRow => puzzleRow.includes(tipCell));
        const column = puzzle[row].indexOf(tipCell);

        expect(sudoku.check(row, column, tipCell.value)).toBe(true);
        expect(sudoku.check(row, column, tipCell.value === 9 ? 1 : tipCell.value + 1)).toBe(false);
    });
});
