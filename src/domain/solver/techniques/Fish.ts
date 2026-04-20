import { BOARD_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, SolveStep, TechniqueId } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

interface RowCandidates {
    row: number;
    columns: number[];
}

interface ColumnCandidates {
    column: number;
    rows: number[];
}

export class Fish implements Technique {
    public constructor(private readonly size: number) {}

    public find(state: BoardState): SolveStep | null {
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
            const rowStep = this.findRowBased(state, digit);
            if (rowStep) return rowStep;
            const columnStep = this.findColumnBased(state, digit);
            if (columnStep) return columnStep;
        }
        return null;
    }

    private findRowBased(state: BoardState, digit: number): SolveStep | null {
        const candidateRows = collectCandidateRows(state, digit, this.size);

        for (const combination of combinations(candidateRows, this.size)) {
            const unionColumns = unionColumnsOf(combination);
            if (unionColumns.length !== this.size) continue;

            const selectedRows = combination.map((entry) => entry.row);
            const eliminations = collectColumnEliminations(state, unionColumns, selectedRows, digit);
            if (eliminations.length === 0) continue;

            const focus: CellReference[] = [];
            for (const row of selectedRows) {
                for (const column of unionColumns) {
                    if (state.candidatesOf(row, column).includes(digit)) {
                        focus.push({ row, column });
                    }
                }
            }

            return {
                technique: this.techniqueId(),
                focus,
                assignments: [],
                eliminations,
                scopes: [
                    ...selectedRows.map((row): { kind: "row"; row: number } => ({ kind: "row", row })),
                    ...unionColumns.map((column): { kind: "column"; column: number } => ({ kind: "column", column })),
                ],
            };
        }

        return null;
    }

    private findColumnBased(state: BoardState, digit: number): SolveStep | null {
        const candidateColumns = collectCandidateColumns(state, digit, this.size);

        for (const combination of combinations(candidateColumns, this.size)) {
            const unionRows = unionRowsOf(combination);
            if (unionRows.length !== this.size) continue;

            const selectedColumns = combination.map((entry) => entry.column);
            const eliminations = collectRowEliminations(state, unionRows, selectedColumns, digit);
            if (eliminations.length === 0) continue;

            const focus: CellReference[] = [];
            for (const column of selectedColumns) {
                for (const row of unionRows) {
                    if (state.candidatesOf(row, column).includes(digit)) {
                        focus.push({ row, column });
                    }
                }
            }

            return {
                technique: this.techniqueId(),
                focus,
                assignments: [],
                eliminations,
                scopes: [
                    ...selectedColumns.map((column): { kind: "column"; column: number } => ({ kind: "column", column })),
                    ...unionRows.map((row): { kind: "row"; row: number } => ({ kind: "row", row })),
                ],
            };
        }

        return null;
    }

    private techniqueId(): TechniqueId {
        if (this.size === 2) return "xWing";
        if (this.size === 3) return "swordfish";
        if (this.size === 4) return "jellyfish";
        throw new Error(`Fish size ${this.size} is not supported`);
    }
}

function collectCandidateRows(state: BoardState, digit: number, maxSize: number): RowCandidates[] {
    const rows: RowCandidates[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        const columns: number[] = [];
        for (let column = 0; column < BOARD_SIZE; column++) {
            if (state.candidatesOf(row, column).includes(digit)) {
                columns.push(column);
            }
        }
        if (columns.length >= 2 && columns.length <= maxSize) {
            rows.push({ row, columns });
        }
    }
    return rows;
}

function collectCandidateColumns(state: BoardState, digit: number, maxSize: number): ColumnCandidates[] {
    const columns: ColumnCandidates[] = [];
    for (let column = 0; column < BOARD_SIZE; column++) {
        const rows: number[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            if (state.candidatesOf(row, column).includes(digit)) {
                rows.push(row);
            }
        }
        if (rows.length >= 2 && rows.length <= maxSize) {
            columns.push({ column, rows });
        }
    }
    return columns;
}

function unionColumnsOf(rows: RowCandidates[]): number[] {
    const set = new Set<number>();
    for (const entry of rows) {
        for (const column of entry.columns) {
            set.add(column);
        }
    }
    return Array.from(set).sort((a, b) => a - b);
}

function unionRowsOf(columns: ColumnCandidates[]): number[] {
    const set = new Set<number>();
    for (const entry of columns) {
        for (const row of entry.rows) {
            set.add(row);
        }
    }
    return Array.from(set).sort((a, b) => a - b);
}

function combinations<T>(items: T[], size: number): T[][] {
    if (size === 0) return [[]];
    if (items.length < size) return [];
    const result: T[][] = [];
    for (let index = 0; index <= items.length - size; index++) {
        const head = items[index];
        const tailCombinations = combinations(items.slice(index + 1), size - 1);
        for (const tail of tailCombinations) {
            result.push([head, ...tail]);
        }
    }
    return result;
}

function collectColumnEliminations(
    state: BoardState,
    columns: number[],
    excludedRows: number[],
    digit: number,
): Elimination[] {
    const excluded = new Set(excludedRows);
    const eliminations: Elimination[] = [];
    for (const column of columns) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            if (excluded.has(row)) continue;
            if (state.candidatesOf(row, column).includes(digit)) {
                eliminations.push({ cell: { row, column }, digit });
            }
        }
    }
    return eliminations;
}

function collectRowEliminations(
    state: BoardState,
    rows: number[],
    excludedColumns: number[],
    digit: number,
): Elimination[] {
    const excluded = new Set(excludedColumns);
    const eliminations: Elimination[] = [];
    for (const row of rows) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            if (excluded.has(column)) continue;
            if (state.candidatesOf(row, column).includes(digit)) {
                eliminations.push({ cell: { row, column }, digit });
            }
        }
    }
    return eliminations;
}
