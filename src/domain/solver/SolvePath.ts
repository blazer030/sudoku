import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import type { SolveStep } from "@/domain/solver/SolveStep";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";

/** A solver step with the board just before it: digits and candidates, indexed [row][column]. */
export interface SolvePathStep {
    step: SolveStep;
    valuesBefore: number[][];
    candidatesBefore: number[][][];
}

const isSolved = (state: BoardState): boolean => {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            if (state.valueAt(row, column) === 0) return false;
        }
    }
    return true;
};

/**
 * Walks the technique solver from `puzzle` the way `solveWithTechniques` does, recording the board
 * before each step. Stops when the board is solved or no technique applies.
 */
export const buildSolvePath = (puzzle: number[][]): SolvePathStep[] => {
    const solver = new TechniqueSolver();
    const path: SolvePathStep[] = [];
    let state = BoardState.fromPuzzle(puzzle);

    while (!isSolved(state)) {
        const step = solver.nextStep(state);
        if (step === null) break;
        path.push({ step, valuesBefore: state.valueGrid(), candidatesBefore: state.candidateGrid() });
        for (const assignment of step.assignments) {
            state = state.assign(assignment.cell.row, assignment.cell.column, assignment.digit);
        }
        for (const elimination of step.eliminations) {
            state = state.eliminate(elimination.cell.row, elimination.cell.column, elimination.digit);
        }
    }
    return path;
};
