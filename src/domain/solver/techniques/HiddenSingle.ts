import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";
import { HOUSES, cellsWithCandidate } from "@/domain/solver/houses";

export class HiddenSingle implements Technique {
    public find(state: BoardState): SolveStep | null {
        for (const house of HOUSES) {
            for (let digit = 1; digit <= BOARD_SIZE; digit++) {
                const cells = cellsWithCandidate(state, house, digit);
                if (cells.length !== 1) continue;
                const [cell] = cells;
                return {
                    technique: "hiddenSingle",
                    focus: [cell],
                    assignments: [{ cell, digit }],
                    eliminations: [],
                    scopes: [house.scope],
                };
            }
        }
        return null;
    }
}
