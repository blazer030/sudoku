import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

export class XWing implements Technique {
    public find(state: BoardState): SolveStep | null {
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
            const rowStep = this.findRowBasedXWing(state, digit);
            if (rowStep) return rowStep;
            const columnStep = this.findColumnBasedXWing(state, digit);
            if (columnStep) return columnStep;
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

    private findColumnBasedXWing(state: BoardState, digit: number): SolveStep | null {
        const columnsWithPair: { column: number; rows: [number, number] }[] = [];
        for (let column = 0; column < BOARD_SIZE; column++) {
            const rows = rowsWithCandidate(state, column, digit);
            if (rows.length === 2) {
                columnsWithPair.push({ column, rows: [rows[0], rows[1]] });
            }
        }

        for (let firstIndex = 0; firstIndex < columnsWithPair.length; firstIndex++) {
            for (let secondIndex = firstIndex + 1; secondIndex < columnsWithPair.length; secondIndex++) {
                const first = columnsWithPair[firstIndex];
                const second = columnsWithPair[secondIndex];
                if (first.rows[0] !== second.rows[0] || first.rows[1] !== second.rows[1]) continue;

                const focus: CellReference[] = [
                    { row: first.rows[0], column: first.column },
                    { row: first.rows[1], column: first.column },
                    { row: second.rows[0], column: second.column },
                    { row: second.rows[1], column: second.column },
                ];
                const eliminations = collectRowEliminations(
                    state,
                    first.rows,
                    [first.column, second.column],
                    digit,
                );
                if (eliminations.length === 0) continue;

                return {
                    technique: "xWing",
                    focus,
                    assignments: [],
                    eliminations,
                    scopes: [
                        { kind: "column", column: first.column },
                        { kind: "column", column: second.column },
                        { kind: "row", row: first.rows[0] },
                        { kind: "row", row: first.rows[1] },
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

function rowsWithCandidate(state: BoardState, column: number, digit: number): number[] {
    const rows: number[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        if (state.candidatesOf(row, column).includes(digit)) {
            rows.push(row);
        }
    }
    return rows;
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

function collectRowEliminations(
    state: BoardState,
    rows: [number, number],
    excludedColumns: [number, number],
    digit: number,
): Elimination[] {
    const eliminations: Elimination[] = [];
    for (const row of rows) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            if (column === excludedColumns[0] || column === excludedColumns[1]) continue;
            if (state.candidatesOf(row, column).includes(digit)) {
                eliminations.push({ cell: { row, column }, digit });
            }
        }
    }
    return eliminations;
}
