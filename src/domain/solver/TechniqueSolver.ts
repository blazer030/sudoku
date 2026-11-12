import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { SolveStep } from "@/domain/solver/SolveStep";
import { TECHNIQUE_IDS, createTechniques, findFirstStep } from "@/domain/solver/techniqueRegistry";

const techniques = createTechniques(TECHNIQUE_IDS);

/** Receives a step the solver takes, with the board just before it. */
export type StepListener = (step: SolveStep, stateBefore: BoardState) => void;

export interface SolveResult {
    steps: SolveStep[];
    finalState: BoardState;
    solved: boolean;
    stuck: boolean;
}

// Every elimination-only step removes at least one of the board's 729 candidates, so the search for
// the next assignment ends within this many steps; the bound only guards against a technique bug.
const MAX_ASSIGNMENT_ITERATIONS = BOARD_SIZE * BOARD_SIZE * BOARD_SIZE;

export class TechniqueSolver {
    public nextStep(state: BoardState): SolveStep | null {
        return findFirstStep(state, techniques);
    }

    public stepsToNextAssignment(state: BoardState): SolveStep[] {
        const steps: SolveStep[] = [];
        let currentState = state;
        for (let iteration = 0; iteration < MAX_ASSIGNMENT_ITERATIONS; iteration++) {
            const step = this.nextStep(currentState);
            if (step === null) return [];
            steps.push(step);
            if (step.assignments.length > 0) return steps;
            currentState = currentState.apply(step);
        }
        return [];
    }

    /**
     * Applies techniques from `initialState` until the board is solved or none applies.
     * `onStep`, when given, sees each step with the board just before it.
     */
    public solveWithTechniques(initialState: BoardState, onStep?: StepListener): SolveResult {
        const steps: SolveStep[] = [];
        let currentState = initialState;

        while (!currentState.isSolved()) {
            const step = this.nextStep(currentState);
            if (!step) {
                return { steps, finalState: currentState, solved: false, stuck: true };
            }
            onStep?.(step, currentState);
            steps.push(step);
            currentState = currentState.apply(step);
        }

        return { steps, finalState: currentState, solved: true, stuck: false };
    }
}
