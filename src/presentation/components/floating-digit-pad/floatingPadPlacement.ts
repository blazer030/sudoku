import { BOARD_SIZE } from "@/domain/board/constants";

/** The pad's size in cells: three rows of digits and the erase key's shorter row. */
export const FLOATING_PAD_ROWS = 3.6;
export const FLOATING_PAD_COLUMNS = 3;

export interface FloatingPadPlacement {
    rowStart: number;
    columnStart: number;
}

/**
 * The pad's corner touches the cell's, below and to the right unless that leaves the board. Cornerwise it
 * covers none of the cell's row or column, only, at most, some of its box.
 */
export const floatingPadPlacement = ({ row, column }: { row: number; column: number }): FloatingPadPlacement => ({
    rowStart: row + 1 + FLOATING_PAD_ROWS <= BOARD_SIZE ? row + 1 : row - FLOATING_PAD_ROWS,
    columnStart: column + 1 + FLOATING_PAD_COLUMNS <= BOARD_SIZE ? column + 1 : column - FLOATING_PAD_COLUMNS,
});
