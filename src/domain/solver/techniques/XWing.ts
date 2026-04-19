import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

export class XWing implements Technique {
    public find(state: BoardState): SolveStep | null {
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
            const step = this.findRowBasedXWing(state, digit);
            if (step) return step;
        }
        return null;
    }

    private findRowBasedXWing(state: BoardState, digit: number): SolveStep | null {
        const rowsWithPair: { row: number; columns: [number, number] }[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            const columns = columnsWithCandidate(state, row, digit);
            if (columns.length === 2) {
                rowsWithPair.push({ row, columns: [columns[0], columns[1]] });
            }
        }

        for (let firstIndex = 0; firstIndex < rowsWithPair.length; firstIndex++) {
            for (let secondIndex = firstIndex + 1; secondIndex < rowsWithPair.length; secondIndex++) {
                const first = rowsWithPair[firstIndex];
                const second = rowsWithPair[secondIndex];
                if (first.columns[0] !== second.columns[0] || first.columns[1] !== second.columns[1]) continue;

                const focus: CellReference[] = [
                    { row: first.row, column: first.columns[0] },
                    { row: first.row, column: first.columns[1] },
                    { row: second.row, column: second.columns[0] },
                    { row: second.row, column: second.columns[1] },
                ];
                const eliminations = collectColumnEliminations(
                    state,
                    first.columns,
                    [first.row, second.row],
                    digit,
                );
                if (eliminations.length === 0) continue;

                return {
                    technique: "xWing",
                    focus,
                    assignments: [],
                    eliminations,
                    scopes: [
                        { kind: "row", row: first.row },
                        { kind: "row", row: second.row },
                        { kind: "column", column: first.columns[0] },
                        { kind: "column", column: first.columns[1] },
                    ],
                };
            }
        }

        return null;
    }
}

function columnsWithCandidate(state: BoardState, row: number, digit: number): number[] {
    const columns: number[] = [];
    for (let column = 0; column < BOARD_SIZE; column++) {
        if (state.candidatesOf(row, column).includes(digit)) {
            columns.push(column);
        }
    }
    return columns;
}

function collectColumnEliminations(
    state: BoardState,
    columns: [number, number],
    excludedRows: [number, number],
    digit: number,
): Elimination[] {
    const eliminations: Elimination[] = [];
    for (const column of columns) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            if (row === excludedRows[0] || row === excludedRows[1]) continue;
            if (state.candidatesOf(row, column).includes(digit)) {
                eliminations.push({ cell: { row, column }, digit });
            }
        }
    }
    return eliminations;
}
