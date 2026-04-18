import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { SolveStep } from "@/domain/solver/SolveStep";

export class HiddenSingle {
    public find(state: BoardState): SolveStep | null {
        for (let row = 0; row < BOARD_SIZE; row++) {
            const step = this.findInRow(state, row);
            if (step) return step;
        }
        return null;
    }

    private findInRow(state: BoardState, row: number): SolveStep | null {
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
            let candidateCount = 0;
            let lastColumn = -1;
            for (let column = 0; column < BOARD_SIZE; column++) {
                if (state.candidatesOf(row, column).includes(digit)) {
                    candidateCount++;
                    lastColumn = column;
                }
            }
            if (candidateCount === 1) {
                return {
                    technique: "hiddenSingle",
                    assignments: [
                        { cell: { row, column: lastColumn }, digit },
                    ],
                };
            }
        }
        return null;
    }
}
