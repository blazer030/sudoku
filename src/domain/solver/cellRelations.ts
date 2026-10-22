import { BOX_SIZE } from "@/domain/board/constants";
import type { CellReference } from "@/domain/solver/SolveStep";

export const sameCell = (a: CellReference, b: CellReference): boolean =>
    a.row === b.row && a.column === b.column;

export const inSameBox = (a: CellReference, b: CellReference): boolean =>
    Math.floor(a.row / BOX_SIZE) === Math.floor(b.row / BOX_SIZE)
    && Math.floor(a.column / BOX_SIZE) === Math.floor(b.column / BOX_SIZE);

/** Two different cells that share a row, column or box. */
export const arePeers = (a: CellReference, b: CellReference): boolean => {
    if (sameCell(a, b)) return false;
    return a.row === b.row || a.column === b.column || inSameBox(a, b);
};
