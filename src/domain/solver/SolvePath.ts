import { BoardState } from "@/domain/solver/BoardState";
import type { SolveStep } from "@/domain/solver/SolveStep";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";

/** A solver step with the board just before it: digits and candidates, indexed [row][column]. */
export interface SolvePathStep {
    step: SolveStep;
    valuesBefore: number[][];
    candidatesBefore: number[][][];
}

/**
 * Walks the technique solver from `puzzle`, recording the board before each step. Stops when the
 * board is solved or no technique applies.
 */
export const buildSolvePath = (puzzle: number[][]): SolvePathStep[] => {
    const path: SolvePathStep[] = [];
    new TechniqueSolver().solveWithTechniques(BoardState.fromPuzzle(puzzle), (step, stateBefore) => {
        path.push({ step, valuesBefore: stateBefore.valueGrid(), candidatesBefore: stateBefore.candidateGrid() });
    });
    return path;
};
