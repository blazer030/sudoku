import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

export class NakedSingle implements Technique {
    public find(state: BoardState): SolveStep | null {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                const candidates = state.candidatesOf(row, column);
                if (candidates.length === 1) {
                    return {
                        technique: "nakedSingle",
                        focus: [{ row, column }],
                        assignments: [
                            { cell: { row, column }, digit: candidates[0] },
                        ],
                        eliminations: [],
                        scopes: [],
                    };
                }
            }
        }
        return null;
    }
}
