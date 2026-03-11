import { describe, expect, it } from "vitest";
import { SudokuBoard } from "@/domain/board/SudokuBoard";
import { SudokuGenerator } from "@/domain/generator/SudokuGenerator";
import { SudokuSolver } from "@/domain/generator/SudokuSolver";

const sudokuBoard = new SudokuBoard();
const generator = new SudokuGenerator();
const solver = new SudokuSolver();

describe("SudokuGenerator", () => {
    it("should generate different boards on multiple calls", () => {
        const boards = Array.from({ length: 5 }, () => generator.generateFullBoard());
        const serialized = boards.map(board => JSON.stringify(board));
        const unique = new Set(serialized);

        expect(unique.size).toBeGreaterThan(1);
    });

    it("should return a puzzle and its answer", () => {
        const { puzzle, answer } = generator.generatePuzzle("easy");

        expect(sudokuBoard.isValidSolution(answer)).toBe(true);
        puzzle.flat().forEach((cell, index) => {
            if (cell !== 0) {
                const row = Math.floor(index / 9);
                const column = index % 9;
                expect(cell).toBe(answer[row][column]);
            }
        });
    });

    it("should generate an easy puzzle with 36-45 clues", () => {
        const { puzzle } = generator.generatePuzzle("easy");
        const filledCells = puzzle.flat().filter(cell => cell !== 0).length;

        expect(filledCells).toBeGreaterThanOrEqual(36);
        expect(filledCells).toBeLessThanOrEqual(45);
    });

    it("should generate a medium puzzle with 27-35 clues", () => {
        const { puzzle } = generator.generatePuzzle("medium");
        const filledCells = puzzle.flat().filter(cell => cell !== 0).length;

        expect(filledCells).toBeGreaterThanOrEqual(27);
        expect(filledCells).toBeLessThanOrEqual(35);
    });

    it("should generate a hard puzzle with 22-26 clues", () => {
        const { puzzle } = generator.generatePuzzle("hard");
        const filledCells = puzzle.flat().filter(cell => cell !== 0).length;

        expect(filledCells).toBeGreaterThanOrEqual(22);
        expect(filledCells).toBeLessThanOrEqual(26);
    });

    it("should generate a puzzle with a unique solution", () => {
        const { puzzle } = generator.generatePuzzle("easy");

        expect(solver.countSolutions(puzzle)).toBe(1);
    });

    it.each(["easy", "medium", "hard"] as const)("should generate a %s puzzle with unique solution and valid clue count", (difficulty) => {
        const { puzzle } = generator.generatePuzzle(difficulty);
        const clueCount = puzzle.flat().filter(cell => cell !== 0).length;
        const ranges = { easy: [36, 45], medium: [27, 35], hard: [22, 26] };
        const [min, max] = ranges[difficulty];

        expect(clueCount).toBeGreaterThanOrEqual(min);
        expect(clueCount).toBeLessThanOrEqual(max);
        expect(solver.countSolutions(puzzle)).toBe(1);
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
