import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

export class Pointing implements Technique {
    public find(state: BoardState): SolveStep | null {
        for (let boxRow = 0; boxRow < BOARD_SIZE; boxRow += BOX_SIZE) {
            for (let boxColumn = 0; boxColumn < BOARD_SIZE; boxColumn += BOX_SIZE) {
                for (let digit = 1; digit <= BOARD_SIZE; digit++) {
                    const step = this.findInBoxForDigit(state, boxRow, boxColumn, digit);
                    if (step) return step;
                }
            }
        }
        return null;
    }

    private findInBoxForDigit(
        state: BoardState,
        boxStartRow: number,
        boxStartColumn: number,
        digit: number,
    ): SolveStep | null {
        const candidateCells: CellReference[] = [];
        for (let row = boxStartRow; row < boxStartRow + BOX_SIZE; row++) {
            for (let column = boxStartColumn; column < boxStartColumn + BOX_SIZE; column++) {
                if (state.candidatesOf(row, column).includes(digit)) {
                    candidateCells.push({ row, column });
                }
            }
        }
        if (candidateCells.length < 2) return null;

        const uniqueRows = new Set(candidateCells.map((cell) => cell.row));
        const uniqueColumns = new Set(candidateCells.map((cell) => cell.column));

        if (uniqueRows.size === 1) {
            const targetRow = candidateCells[0].row;
            const eliminations = collectRowEliminationsOutsideBox(state, targetRow, boxStartColumn, digit);
            if (eliminations.length > 0) {
                return {
                    technique: "pointing",
                    focus: candidateCells,
                    assignments: [],
                    eliminations,
                };
            }
        }

        if (uniqueColumns.size === 1) {
            const targetColumn = candidateCells[0].column;
            const eliminations = collectColumnEliminationsOutsideBox(state, targetColumn, boxStartRow, digit);
            if (eliminations.length > 0) {
                return {
                    technique: "pointing",
                    focus: candidateCells,
                    assignments: [],
                    eliminations,
                };
            }
        }

        return null;
    }
}

function collectRowEliminationsOutsideBox(
    state: BoardState,
    row: number,
    boxStartColumn: number,
    digit: number,
): Elimination[] {
    const eliminations: Elimination[] = [];
    for (let column = 0; column < BOARD_SIZE; column++) {
        if (column >= boxStartColumn && column < boxStartColumn + BOX_SIZE) continue;
        if (state.candidatesOf(row, column).includes(digit)) {
            eliminations.push({ cell: { row, column }, digit });
        }
    }
    return eliminations;
}

function collectColumnEliminationsOutsideBox(
    state: BoardState,
    column: number,
    boxStartRow: number,
    digit: number,
): Elimination[] {
    const eliminations: Elimination[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        if (row >= boxStartRow && row < boxStartRow + BOX_SIZE) continue;
        if (state.candidatesOf(row, column).includes(digit)) {
            eliminations.push({ cell: { row, column }, digit });
        }
    }
    return eliminations;
}
