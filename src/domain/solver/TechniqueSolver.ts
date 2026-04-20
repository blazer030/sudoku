import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";
import { NakedSingle } from "@/domain/solver/techniques/NakedSingle";
import { HiddenSingle } from "@/domain/solver/techniques/HiddenSingle";
import { NakedSubset } from "@/domain/solver/techniques/NakedSubset";
import { HiddenSubset } from "@/domain/solver/techniques/HiddenSubset";
import { Pointing } from "@/domain/solver/techniques/Pointing";
import { Claiming } from "@/domain/solver/techniques/Claiming";
import { Fish } from "@/domain/solver/techniques/Fish";
import { XYWing } from "@/domain/solver/techniques/XYWing";
import { WWing } from "@/domain/solver/techniques/WWing";
import { XYZWing } from "@/domain/solver/techniques/XYZWing";

const techniques: Technique[] = [
    new NakedSingle(),
    new HiddenSingle(),
    new NakedSubset(2),
    new NakedSubset(3),
    new NakedSubset(4),
    new HiddenSubset(2),
    new HiddenSubset(3),
    new HiddenSubset(4),
    new Pointing(),
    new Claiming(),
    new Fish(2),
    new Fish(3),
    new Fish(4),
    new XYWing(),
    new WWing(),
    new XYZWing(),
];

export interface SolveResult {
    steps: SolveStep[];
    finalState: BoardState;
    solved: boolean;
    stuck: boolean;
}

const MAX_ASSIGNMENT_ITERATIONS = 20;

export class TechniqueSolver {
    public nextStep(state: BoardState): SolveStep | null {
        for (const technique of techniques) {
            const step = technique.find(state);
            if (step) return step;
        }
        return null;
    }

    public nextAssignment(state: BoardState): SolveStep | null {
        let currentState = state;
        for (let iteration = 0; iteration < MAX_ASSIGNMENT_ITERATIONS; iteration++) {
            const step = this.nextStep(currentState);
            if (step === null) return null;
            if (step.assignments.length > 0) return step;
            for (const elimination of step.eliminations) {
                currentState = currentState.eliminate(
                    elimination.cell.row,
                    elimination.cell.column,
                    elimination.digit,
                );
            }
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
            for (const elimination of step.eliminations) {
                currentState = currentState.eliminate(elimination.cell.row, elimination.cell.column, elimination.digit);
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
