import { SudokuSolver, type SolutionCount } from "@/domain/generator/SudokuSolver";
import { buildSolvePath, type SolvePathStep } from "@/domain/solver/SolvePath";

/** What the walkthrough needs before playback: how many solutions, and the technique path. Plain data only. */
export interface PuzzleCheck {
    solutionCount: SolutionCount;
    path: SolvePathStep[];
}

// Bounds the count to roughly a tenth of a second on a desktop; a board it can't settle in time gets a warning.
const SOLUTION_COUNT_NODE_BUDGET = 40000;

/** Counts the puzzle's solutions (up to two) and, unless it has none, walks the technique solver over it. */
export const checkPuzzle = (values: number[][]): PuzzleCheck => {
    const solutionCount = new SudokuSolver().countSolutions(values, 2, { maxNodes: SOLUTION_COUNT_NODE_BUDGET });
    return { solutionCount, path: solutionCount === 0 ? [] : buildSolvePath(values) };
};
