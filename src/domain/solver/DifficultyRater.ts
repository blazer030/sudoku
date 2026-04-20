import { BOARD_SIZE } from "@/domain/board/constants";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import { BoardState } from "@/domain/solver/BoardState";
import type { SolveStep } from "@/domain/solver/SolveStep";
import { Claiming } from "@/domain/solver/techniques/Claiming";
import { HiddenSingle } from "@/domain/solver/techniques/HiddenSingle";
import { HiddenSubset } from "@/domain/solver/techniques/HiddenSubset";
import { NakedSingle } from "@/domain/solver/techniques/NakedSingle";
import { NakedSubset } from "@/domain/solver/techniques/NakedSubset";
import { Pointing } from "@/domain/solver/techniques/Pointing";
import type { Technique } from "@/domain/solver/techniques/Technique";
import { Fish } from "@/domain/solver/techniques/Fish";
import { WWing } from "@/domain/solver/techniques/WWing";
import { XYWing } from "@/domain/solver/techniques/XYWing";
import { XYZWing } from "@/domain/solver/techniques/XYZWing";

const MAX_SOLVE_ITERATIONS = 200;

const easyTechniques = (): Technique[] => [new NakedSingle(), new HiddenSingle()];

const mediumTechniques = (): Technique[] => [
    ...easyTechniques(),
    new NakedSubset(2),
    new NakedSubset(3),
    new NakedSubset(4),
    new HiddenSubset(2),
    new HiddenSubset(3),
    new HiddenSubset(4),
    new Pointing(),
    new Claiming(),
];

const hardTechniques = (): Technique[] => [
    ...mediumTechniques(),
    new Fish(2),
    new XYWing(),
    new WWing(),
    new XYZWing(),
];

export class DifficultyRater {
    public rate(puzzle: number[][]): Difficulty | null {
        if (canSolveWith(puzzle, easyTechniques())) return "easy";
        if (canSolveWith(puzzle, mediumTechniques())) return "medium";
        if (canSolveWith(puzzle, hardTechniques())) return "hard";
        return null;
    }

    public matches(puzzle: number[][], target: Difficulty): boolean {
        if (target === "easy") {
            return canSolveWith(puzzle, easyTechniques());
        }
        if (target === "medium") {
            return canSolveWith(puzzle, mediumTechniques()) && !canSolveWith(puzzle, easyTechniques());
        }
        return canSolveWith(puzzle, hardTechniques()) && !canSolveWith(puzzle, mediumTechniques());
    }
}

function canSolveWith(puzzle: number[][], techniques: Technique[]): boolean {
    let state = BoardState.fromPuzzle(puzzle);
    for (let iteration = 0; iteration < MAX_SOLVE_ITERATIONS; iteration++) {
        if (isSolved(state)) return true;
        const step = findFirstStep(state, techniques);
        if (step === null) return false;
        state = applyStep(state, step);
    }
    return false;
}

function findFirstStep(state: BoardState, techniques: Technique[]): SolveStep | null {
    for (const technique of techniques) {
        const step = technique.find(state);
        if (step) return step;
    }
    return null;
}

function applyStep(state: BoardState, step: SolveStep): BoardState {
    let updated = state;
    for (const assignment of step.assignments) {
        updated = updated.assign(assignment.cell.row, assignment.cell.column, assignment.digit);
    }
    for (const elimination of step.eliminations) {
        updated = updated.eliminate(elimination.cell.row, elimination.cell.column, elimination.digit);
    }
    return updated;
}

function isSolved(state: BoardState): boolean {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            if (state.valueAt(row, column) === 0) return false;
        }
    }
    return true;
}
