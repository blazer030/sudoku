import { boxIndexOf } from "@/domain/board/geometry";
import type { CellReference } from "@/domain/solver/SolveStep";

export const sameCell = (first: CellReference, second: CellReference): boolean =>
    first.row === second.row && first.column === second.column;

export const inSameBox = (first: CellReference, second: CellReference): boolean =>
    boxIndexOf(first.row, first.column) === boxIndexOf(second.row, second.column);

/** Two different cells that share a row, column or box. */
export const arePeers = (first: CellReference, second: CellReference): boolean => {
    if (sameCell(first, second)) return false;
    return first.row === second.row || first.column === second.column || inSameBox(first, second);
};
