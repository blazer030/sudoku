import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import type { BoardState } from "@/domain/solver/BoardState";
import type { CellReference, Scope } from "@/domain/solver/SolveStep";

/** A row, column or box: its scope and its nine cells in reading order. */
export interface House {
    scope: Scope;
    cells: readonly CellReference[];
}

const range = (length: number): number[] => Array.from({ length }, (_, index) => index);

/** The first row or column of the box band that holds `index`. */
export const boxStart = (index: number): number => Math.floor(index / BOX_SIZE) * BOX_SIZE;

const rowHouse = (row: number): House => ({
    scope: { kind: "row", row },
    cells: range(BOARD_SIZE).map(column => ({ row, column })),
});

const columnHouse = (column: number): House => ({
    scope: { kind: "column", column },
    cells: range(BOARD_SIZE).map(row => ({ row, column })),
});

const boxHouse = (boxRow: number, boxColumn: number): House => ({
    scope: { kind: "box", boxRow, boxColumn },
    cells: range(BOX_SIZE).flatMap(rowOffset => range(BOX_SIZE).map(columnOffset => ({ row: boxRow + rowOffset, column: boxColumn + columnOffset }))),
});

const BOX_STARTS = range(BOX_SIZE).map(band => band * BOX_SIZE);

/** The 27 houses, rows first, then columns, then boxes from the top left, the order the techniques search them in. */
export const HOUSES: readonly House[] = [
    ...range(BOARD_SIZE).map(rowHouse),
    ...range(BOARD_SIZE).map(columnHouse),
    ...BOX_STARTS.flatMap(boxRow => BOX_STARTS.map(boxColumn => boxHouse(boxRow, boxColumn))),
];

/** An empty cell of a house with the candidates it still holds. */
export interface HouseCell {
    cell: CellReference;
    candidates: number[];
}

/** The house's empty cells, each with its candidates, in reading order; each cell a fresh copy a step may keep. */
export const emptyCellsOf = (state: BoardState, house: House): HouseCell[] =>
    house.cells
        .map(cell => ({ cell: { ...cell }, candidates: state.candidatesOf(cell.row, cell.column) }))
        .filter(entry => entry.candidates.length > 0);

/** The house's cells that still hold `digit` as a candidate, in reading order; each a fresh copy a step may keep. */
export const cellsWithCandidate = (state: BoardState, house: House, digit: number): CellReference[] =>
    house.cells.filter(cell => state.candidatesOf(cell.row, cell.column).includes(digit)).map(cell => ({ ...cell }));

/** Every way to pick `size` of the items, each keeping the items' order, in lexicographic order. */
export const combinationsOf = <T>(items: readonly T[], size: number): T[][] => {
    const results: T[][] = [];
    const recurse = (startIndex: number, current: T[]): void => {
        if (current.length === size) {
            results.push([...current]);
            return;
        }
        for (let index = startIndex; index < items.length; index++) {
            current.push(items[index]);
            recurse(index + 1, current);
            current.pop();
        }
    };
    recurse(0, []);
    return results;
};
