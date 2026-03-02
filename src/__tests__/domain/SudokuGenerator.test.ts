import { describe, expect, it } from "vitest";
import { SudokuBoard } from "@/domain/SudokuBoard";
import { SudokuGenerator } from "@/domain/SudokuGenerator";
import { SudokuSolver } from "@/domain/SudokuSolver";

const sudokuBoard = new SudokuBoard();
const generator = new SudokuGenerator();

describe("SudokuGenerator", () => {
    it("should generate different boards on multiple calls", () => {
        const boards = Array.from({ length: 5 }, () => generator.generateFullBoard());
        const serialized = boards.map(board => JSON.stringify(board));
        const unique = new Set(serialized);

        expect(unique.size).toBeGreaterThan(1);
    });

    it("should generate a puzzle with the specified number of clues", () => {
        const clueCount = 30;
        const puzzle = generator.generatePuzzle(clueCount);

        const filledCells = puzzle.flat().filter(cell => cell !== 0).length;
        expect(filledCells).toBe(clueCount);
    });

    it("should preserve clue values that form part of a valid solution", () => {
        const puzzle = generator.generatePuzzle(30);
        const solver = new SudokuSolver();
        const solution = solver.solve(puzzle);

        expect(solution).not.toBeNull();
        expect(sudokuBoard.isValidSolution(solution!)).toBe(true);
    });

    it("should generate a valid 9x9 board that satisfies all sudoku rules", () => {
        const board = generator.generateFullBoard();

        expect(board).toHaveLength(9);
        board.forEach(row => {
            expect(row).toHaveLength(9);
        });
        expect(sudokuBoard.isValidSolution(board)).toBe(true);
    });
});
