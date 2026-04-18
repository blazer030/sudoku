import { BoardState } from "@/domain/solver/BoardState";
import { SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";
import { NakedSingle } from "@/domain/solver/techniques/NakedSingle";
import { HiddenSingle } from "@/domain/solver/techniques/HiddenSingle";

const techniques: Technique[] = [
    new NakedSingle(),
    new HiddenSingle(),
];

export class TechniqueSolver {
    public nextStep(state: BoardState): SolveStep | null {
        for (const technique of techniques) {
            const step = technique.find(state);
            if (step) return step;
        }
        return null;
    }
}
