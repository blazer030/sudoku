import type { PuzzleCell } from "@/domain/board/PuzzleCell";

/** What the player has put in a cell: its entry (0 for none) and its notes. */
export interface CellSnapshot {
    entry: number;
    notes: number[];
}

/** A cell as saved: its clue (0 for none) and what the player has put in it. */
export interface CellState extends CellSnapshot {
    clue: number;
}

/** A copy of what the player has put in the cell. */
export const snapshotOf = (cell: PuzzleCell): CellSnapshot => ({ entry: cell.entry, notes: [...cell.notes] });

/** A copy of the cell, as saved. */
export const stateOf = (cell: PuzzleCell): CellState => ({ clue: cell.clue, entry: cell.entry, notes: [...cell.notes] });

/** A copy of the whole board, as saved. */
export const boardStateOf = (puzzle: readonly (readonly PuzzleCell[])[]): CellState[][] => puzzle.map(row => row.map(stateOf));
