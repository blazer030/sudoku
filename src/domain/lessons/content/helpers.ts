import { BOARD_SIZE } from "@/domain/board/constants";
import type { CellReference, ChainLink, Elimination } from "@/domain/solver/SolveStep";

// Rows, columns and boxes count from 1 here, as the lessons' copy does.

export const at = (row: number, column: number): CellReference => ({ row: row - 1, column: column - 1 });

export const cells = (...positions: readonly (readonly [number, number])[]): CellReference[] =>
    positions.map(([row, column]) => at(row, column));

export const rowOf = (row: number): CellReference[] =>
    Array.from({ length: BOARD_SIZE }, (_, column) => ({ row: row - 1, column }));

export const columnOf = (column: number): CellReference[] =>
    Array.from({ length: BOARD_SIZE }, (_, row) => ({ row, column: column - 1 }));

export const boxOf = (box: number): CellReference[] => {
    const firstRow = Math.floor((box - 1) / 3) * 3;
    const firstColumn = ((box - 1) % 3) * 3;
    const found: CellReference[] = [];
    for (let row = firstRow; row < firstRow + 3; row++) {
        for (let column = firstColumn; column < firstColumn + 3; column++) found.push({ row, column });
    }
    return found;
};

export const removal = (row: number, column: number, digit: number): Elimination => ({ cell: at(row, column), digit });

export const link = (
    from: readonly [number, number],
    to: readonly [number, number],
    digit: number,
    type: ChainLink["type"] = "strong",
): ChainLink => ({ from: at(from[0], from[1]), to: at(to[0], to[1]), digit, type });
