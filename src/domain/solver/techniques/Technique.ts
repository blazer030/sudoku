import { BoardState } from "@/domain/solver/BoardState";
import { SolveStep } from "@/domain/solver/SolveStep";

export interface Technique {
    find(state: BoardState): SolveStep | null;
}
