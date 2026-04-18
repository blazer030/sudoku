import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";
import { NakedSingle } from "@/domain/solver/techniques/NakedSingle";
import { HiddenSingle } from "@/domain/solver/techniques/HiddenSingle";

const techniques: Technique[] = [
    new NakedSingle(),
    new HiddenSingle(),
];

export interface SolveResult {
    steps: SolveStep[];
    finalState: BoardState;
    solved: boolean;
    stuck: boolean;
}

export class TechniqueSolver {
    public nextStep(state: BoardState): SolveStep | null {
        for (const technique of techniques) {
            const step = technique.find(state);
            if (step) return step;
        }
        return null;
    }

    public solveWithTechniques(initialState: BoardState): SolveResult {
        const steps: SolveStep[] = [];
        let currentState = initialState;

        while (!this.isSolved(currentState)) {
            const step = this.nextStep(currentState);
            if (!step) {
                return { steps, finalState: currentState, solved: false, stuck: true };
            }
            steps.push(step);
            for (const assignment of step.assignments) {
                currentState = currentState.assign(assignment.cell.row, assignment.cell.column, assignment.digit);
            }
        }

        return { steps, finalState: currentState, solved: true, stuck: false };
    }

    private isSolved(state: BoardState): boolean {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                if (state.valueAt(row, column) === 0) return false;
            }
        }
        return true;
    }
}
