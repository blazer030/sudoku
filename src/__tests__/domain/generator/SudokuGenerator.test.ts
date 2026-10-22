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

// A small seeded generator (mulberry32), so a run of `Math.random` can be replayed exactly.
const seededRandom = (seed: number) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
};

// Puzzles the generator made from seed 20261022 before the solution counter learned to propagate;
// any change here means generated puzzles changed.
const SEEDED_PUZZLES = {
    easy: "903700060600580390000690007135070846009041530080006000020000005098025000507900020",
    medium: "003700000600080300000690007035070846009001530080000000020000005098025000007900000",
    hard: "000000960430020700060800100000000000500007000090563070028050006000700003900004000",
} as const;

const GENERATION_SEEDS = [1, 20261022, 424242];
const CLUE_RANGES = { easy: [36, 45], medium: [27, 35], hard: [22, 26] } as const;

describe("SudokuGenerator", () => {
    it("should generate different boards on multiple calls", () => {
        const boards = Array.from({ length: 5 }, () => generator.generateFullBoard());
        const serialized = boards.map(board => JSON.stringify(board));
        const unique = new Set(serialized);

        expect(unique.size).toBeGreaterThan(1);
    });

    // Real generation, rating and uniqueness checks; fixed seeds keep every run the same puzzles
    it.each((["easy", "medium", "hard"] as const).flatMap(difficulty => GENERATION_SEEDS.map(seed => [difficulty, seed] as const)))(
        "should generate a puzzle of %s difficulty from seed %i with one solution, its clue count and a step-by-step path",
        (difficulty, seed) => {
            vi.spyOn(Math, "random").mockImplementation(seededRandom(seed));

            const generated = new SudokuGenerator().generatePuzzle(difficulty);

            const { puzzle, answer } = generated;
            expect(sudokuBoard.isValidSolution(answer)).toBe(true);
            puzzle.flat().forEach((cell, index) => {
                if (cell !== 0) expect(cell).toBe(answer[Math.floor(index / 9)][index % 9]);
            });
            const [min, max] = CLUE_RANGES[difficulty];
            const clueCount = puzzle.flat().filter(cell => cell !== 0).length;
            expect(clueCount).toBeGreaterThanOrEqual(min);
            expect(clueCount).toBeLessThanOrEqual(max);
            expect(solver.countSolutions(puzzle)).toBe(1);
            walkRevealHintsToCompletion(generated);
        },
    );

    it("should generate a valid 9x9 board that satisfies all sudoku rules", () => {
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

    it.each(["easy", "medium", "hard"] as const)("should generate the same %s puzzle from the same random numbers", (difficulty) => {
        vi.spyOn(Math, "random").mockImplementation(seededRandom(20261022));
        vi.spyOn(DifficultyRater.prototype, "matches").mockReturnValue(true);

        const { puzzle } = new SudokuGenerator().generatePuzzle(difficulty);

        expect(puzzle.flat().join("")).toBe(SEEDED_PUZZLES[difficulty]);
    });

    it("should count solutions without a search budget", () => {
        vi.spyOn(Math, "random").mockImplementation(seededRandom(20261022));
        vi.spyOn(DifficultyRater.prototype, "matches").mockReturnValue(true);
        const countSpy = vi.spyOn(SudokuSolver.prototype, "countSolutions");

        new SudokuGenerator().generatePuzzle("easy");

        expect(countSpy).toHaveBeenCalled();
        for (const call of countSpy.mock.calls) {
            expect(call).toHaveLength(2);
        }
    });
});
