import { afterEach, describe, expect, it, vi } from "vitest";
import { SudokuBoard } from "@/domain/board/SudokuBoard";
import { SudokuGenerator } from "@/domain/generator/SudokuGenerator";
import { SudokuSolver } from "@/domain/generator/SudokuSolver";
import { BoardState } from "@/domain/solver/BoardState";
import { DifficultyRater } from "@/domain/solver/DifficultyRater";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";

afterEach(() => {
    vi.restoreAllMocks();
});

const sudokuBoard = new SudokuBoard();
const generator = new SudokuGenerator();
const solver = new SudokuSolver();

// Asks for the next reveal hint the way `Sudoku.planRevealHint` does, rebuilding the solver state
// from the givens plus the cells filled so far, and fills its answer until the board is complete.
const walkRevealHintsToCompletion = ({ puzzle, answer }: { puzzle: number[][]; answer: number[][] }) => {
    const technique = new TechniqueSolver();
    const board = puzzle.map(row => [...row]);
    let remaining = board.flat().filter(cell => cell === 0).length;
    while (remaining > 0) {
        const steps = technique.stepsToNextAssignment(BoardState.fromPuzzle(board));
        expect(steps.length).toBeGreaterThan(0);
        const { cell, digit } = steps[steps.length - 1].assignments[0];
        expect(digit).toBe(answer[cell.row][cell.column]);
        board[cell.row][cell.column] = digit;
        remaining--;
    }
};

describe("SudokuGenerator", () => {
    it.skip("should generate different boards on multiple calls", () => {
        const boards = Array.from({ length: 5 }, () => generator.generateFullBoard());
        const serialized = boards.map(board => JSON.stringify(board));
        const unique = new Set(serialized);

        expect(unique.size).toBeGreaterThan(1);
    });

    it.skip("should return a puzzle and its answer", () => {
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

    it.skip("should generate an easy puzzle with 36-45 clues", () => {
        const { puzzle } = generator.generatePuzzle("easy");
        const filledCells = puzzle.flat().filter(cell => cell !== 0).length;

        expect(filledCells).toBeGreaterThanOrEqual(36);
        expect(filledCells).toBeLessThanOrEqual(45);
    });

    it.skip("should generate a medium puzzle with 27-35 clues", () => {
        const { puzzle } = generator.generatePuzzle("medium");
        const filledCells = puzzle.flat().filter(cell => cell !== 0).length;

        expect(filledCells).toBeGreaterThanOrEqual(27);
        expect(filledCells).toBeLessThanOrEqual(35);
    });

    it.skip.each(["easy", "medium", "hard"] as const)("should generate a %s puzzle with unique solution and valid clue count", { timeout: 180000 }, (difficulty) => {
        const { puzzle } = generator.generatePuzzle(difficulty);
        const clueCount = puzzle.flat().filter(cell => cell !== 0).length;
        const ranges = { easy: [36, 45], medium: [27, 35], hard: [22, 26] };
        const [min, max] = ranges[difficulty];

        expect(clueCount).toBeGreaterThanOrEqual(min);
        expect(clueCount).toBeLessThanOrEqual(max);
        expect(solver.countSolutions(puzzle)).toBe(1);
    });

    it.skip("should generate a valid 9x9 board that satisfies all sudoku rules", () => {
        const board = generator.generateFullBoard();

        expect(board).toHaveLength(9);
        board.forEach(row => {
            expect(row).toHaveLength(9);
        });
        expect(sudokuBoard.isValidSolution(board)).toBe(true);
    });

    it("should retry generating when rater.matches returns false", () => {
        const matchesSpy = vi.spyOn(DifficultyRater.prototype, "matches");
        matchesSpy.mockReturnValueOnce(false);
        matchesSpy.mockReturnValueOnce(false);
        matchesSpy.mockReturnValueOnce(true);

        const localGenerator = new SudokuGenerator();
        const { puzzle } = localGenerator.generatePuzzle("easy");

        expect(matchesSpy).toHaveBeenCalledTimes(3);
        expect(puzzle).toHaveLength(9);
    });

    it("should only fall back to a technique-solvable puzzle", () => {
        vi.spyOn(DifficultyRater.prototype, "matches").mockReturnValue(false);
        const rateSpy = vi.spyOn(DifficultyRater.prototype, "rate");
        rateSpy.mockReturnValueOnce(null);
        rateSpy.mockReturnValueOnce(null);
        rateSpy.mockReturnValue("hard");

        const { puzzle } = new SudokuGenerator().generatePuzzle("easy");

        const solvableIndex = rateSpy.mock.results.findIndex(result => result.value !== null);
        expect(solvableIndex).toBe(2);
        expect(puzzle).toBe(rateSpy.mock.calls[solvableIndex][0]);
    });

    it.skip.each(["easy", "medium", "hard"] as const)("should keep every generated %s puzzle solvable step by step", { timeout: 180000 }, (difficulty) => {
        for (let round = 0; round < 2; round++) {
            walkRevealHintsToCompletion(generator.generatePuzzle(difficulty));
        }
    });

    it("should keep a generated medium puzzle solvable one reveal hint at a time", { timeout: 30000 }, () => {
        walkRevealHintsToCompletion(generator.generatePuzzle("medium"));
    });
});
