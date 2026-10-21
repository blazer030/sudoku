import { CellReference, SolveStep } from "@/domain/solver/SolveStep";

export interface RevealHintStep {
    step: SolveStep;
    /** [row][column] -> sorted candidates before this step; [] for filled cells. */
    candidatesBefore: number[][][];
}

export type RevealHintPlan =
    | { kind: "wrongEntry"; cell: CellReference }
    | { kind: "steps"; steps: RevealHintStep[]; target: CellReference; digit: number }
    | { kind: "noTechnique" }
    | { kind: "solved" };
