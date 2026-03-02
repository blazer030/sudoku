import { describe, expect, it } from "vitest";
import Sudoku from "@/domain/Sudoku";

describe("Sudoku", () => {
    it("should correctly check answers against the solution", () => {
        const sudoku = new Sudoku();
        const puzzle = sudoku.generate("easy");

        const tipCell = puzzle.flat().find(cell => cell.isTip)!;
        const row = puzzle.findIndex(puzzleRow => puzzleRow.includes(tipCell));
        const col = puzzle[row].indexOf(tipCell);

        expect(sudoku.check(row, col, tipCell.value)).toBe(true);
        expect(sudoku.check(row, col, tipCell.value === 9 ? 1 : tipCell.value + 1)).toBe(false);
    });
});
