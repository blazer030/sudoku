import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { BoardState } from "@/domain/solver/BoardState";
import { CellReference, Elimination, SolveStep } from "@/domain/solver/SolveStep";
import { Technique } from "@/domain/solver/techniques/Technique";

export class Claiming implements Technique {
    public find(state: BoardState): SolveStep | null {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let digit = 1; digit <= BOARD_SIZE; digit++) {
                const step = this.findInRowForDigit(state, row, digit);
                if (step) return step;
            }
        }
        for (let column = 0; column < BOARD_SIZE; column++) {
            for (let digit = 1; digit <= BOARD_SIZE; digit++) {
                const step = this.findInColumnForDigit(state, column, digit);
                if (step) return step;
            }
        }
        return null;
    }

    private findInRowForDigit(state: BoardState, row: number, digit: number): SolveStep | null {
        const candidateCells: CellReference[] = [];
        for (let column = 0; column < BOARD_SIZE; column++) {
            if (state.candidatesOf(row, column).includes(digit)) {
                candidateCells.push({ row, column });
            }
        }
        if (candidateCells.length < 2) return null;

        const boxStartRows = new Set(candidateCells.map((cell) => Math.floor(cell.row / BOX_SIZE) * BOX_SIZE));
        const boxStartColumns = new Set(candidateCells.map((cell) => Math.floor(cell.column / BOX_SIZE) * BOX_SIZE));
        if (boxStartRows.size !== 1 || boxStartColumns.size !== 1) return null;

        const boxStartRow = [...boxStartRows][0];
        const boxStartColumn = [...boxStartColumns][0];
        const eliminations = collectBoxEliminationsOutsideRow(state, boxStartRow, boxStartColumn, row, digit);
        if (eliminations.length === 0) return null;

        return {
            technique: "claiming",
            focus: candidateCells,
            assignments: [],
            eliminations,
        };
    }

    private findInColumnForDigit(state: BoardState, column: number, digit: number): SolveStep | null {
        const candidateCells: CellReference[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            if (state.candidatesOf(row, column).includes(digit)) {
                candidateCells.push({ row, column });
            }
        }
        if (candidateCells.length < 2) return null;

        const boxStartRows = new Set(candidateCells.map((cell) => Math.floor(cell.row / BOX_SIZE) * BOX_SIZE));
        const boxStartColumns = new Set(candidateCells.map((cell) => Math.floor(cell.column / BOX_SIZE) * BOX_SIZE));
        if (boxStartRows.size !== 1 || boxStartColumns.size !== 1) return null;

        const boxStartRow = [...boxStartRows][0];
        const boxStartColumn = [...boxStartColumns][0];
        const eliminations = collectBoxEliminationsOutsideColumn(state, boxStartRow, boxStartColumn, column, digit);
        if (eliminations.length === 0) return null;

        return {
            technique: "claiming",
            focus: candidateCells,
            assignments: [],
            eliminations,
        };
    }
}

function collectBoxEliminationsOutsideRow(
    state: BoardState,
    boxStartRow: number,
    boxStartColumn: number,
    excludedRow: number,
    digit: number,
): Elimination[] {
    const eliminations: Elimination[] = [];
    for (let row = boxStartRow; row < boxStartRow + BOX_SIZE; row++) {
        if (row === excludedRow) continue;
        for (let column = boxStartColumn; column < boxStartColumn + BOX_SIZE; column++) {
            if (state.candidatesOf(row, column).includes(digit)) {
                eliminations.push({ cell: { row, column }, digit });
            }
        }
    }
    return eliminations;
}

function collectBoxEliminationsOutsideColumn(
    state: BoardState,
    boxStartRow: number,
    boxStartColumn: number,
    excludedColumn: number,
    digit: number,
): Elimination[] {
    const eliminations: Elimination[] = [];
    for (let row = boxStartRow; row < boxStartRow + BOX_SIZE; row++) {
        for (let column = boxStartColumn; column < boxStartColumn + BOX_SIZE; column++) {
            if (column === excludedColumn) continue;
            if (state.candidatesOf(row, column).includes(digit)) {
                eliminations.push({ cell: { row, column }, digit });
            }
        }
    }
    return eliminations;
}
