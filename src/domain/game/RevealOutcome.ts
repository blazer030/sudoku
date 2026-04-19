import { SolveStep } from "@/domain/solver/SolveStep";

export interface RevealOutcome {
    cell: { row: number; column: number };
    value: number;
    step: SolveStep | null;
    fallback: boolean;
}
