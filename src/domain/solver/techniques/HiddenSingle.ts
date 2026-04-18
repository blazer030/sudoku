import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

export class HiddenSingle implements Technique {
    public find(state: BoardState): SolveStep | null {
        for (let row = 0; row < BOARD_SIZE; row++) {
            const step = this.findInRow(state, row);
            if (step) return step;
        }
        for (let column = 0; column < BOARD_SIZE; column++) {
            const step = this.findInColumn(state, column);
            if (step) return step;
        }
        for (let boxRow = 0; boxRow < BOARD_SIZE; boxRow += BOX_SIZE) {
            for (let boxColumn = 0; boxColumn < BOARD_SIZE; boxColumn += BOX_SIZE) {
                const step = this.findInBox(state, boxRow, boxColumn);
                if (step) return step;
            }
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

    private findInColumn(state: BoardState, column: number): SolveStep | null {
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
            let candidateCount = 0;
            let lastRow = -1;
            for (let row = 0; row < BOARD_SIZE; row++) {
                if (state.candidatesOf(row, column).includes(digit)) {
                    candidateCount++;
                    lastRow = row;
                }
            }
            if (candidateCount === 1) {
                return {
                    technique: "hiddenSingle",
                    assignments: [
                        { cell: { row: lastRow, column }, digit },
                    ],
                };
            }
        }
        return null;
    }

    private findInBox(state: BoardState, boxStartRow: number, boxStartColumn: number): SolveStep | null {
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
            let candidateCount = 0;
            let foundRow = -1;
            let foundColumn = -1;
            for (let row = boxStartRow; row < boxStartRow + BOX_SIZE; row++) {
                for (let column = boxStartColumn; column < boxStartColumn + BOX_SIZE; column++) {
                    if (state.candidatesOf(row, column).includes(digit)) {
                        candidateCount++;
                        foundRow = row;
                        foundColumn = column;
                    }
                }
            }
            if (candidateCount === 1) {
                return {
                    technique: "hiddenSingle",
                    assignments: [
                        { cell: { row: foundRow, column: foundColumn }, digit },
                    ],
                };
            }
        }
        return null;
    }
}
