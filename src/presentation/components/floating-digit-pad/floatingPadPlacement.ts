import { BOARD_SIZE } from "@/domain/board/constants";

/** The pad's usual size in cells: three rows of digits and the erase key's shorter row. */
export const FLOATING_PAD_ROWS = 3.6;
export const FLOATING_PAD_COLUMNS = 3;

// A digit key is never smaller than this, however small the board makes its cells
const MINIMUM_KEY_PX = 36;

/** What the pad's padding, gaps and border take from its keys, in pixels. */
export interface FloatingPadChrome {
    width: number;
    height: number;
}

// Used until the pad can be measured, as each style may give it more room
const USUAL_PAD_CHROME: FloatingPadChrome = { width: 10, height: 12 };

export interface FloatingPadSize {
    rows: number;
    columns: number;
}

export interface FloatingPadPlacement {
    rowStart: number;
    columnStart: number;
}

/** The pad's size in cells. An unmeasured board (0) gets the usual size. */
export const floatingPadSize = (cellSize: number, chrome: FloatingPadChrome = USUAL_PAD_CHROME): FloatingPadSize => {
    if (cellSize <= 0) return { rows: FLOATING_PAD_ROWS, columns: FLOATING_PAD_COLUMNS };
    return {
        rows: Math.max(FLOATING_PAD_ROWS, (MINIMUM_KEY_PX * FLOATING_PAD_ROWS + chrome.height) / cellSize),
        columns: Math.max(FLOATING_PAD_COLUMNS, (MINIMUM_KEY_PX * FLOATING_PAD_COLUMNS + chrome.width) / cellSize),
    };
};

// After the cell if the pad fits there, else before it if it fits there, else wherever it leaves the board the least
const placeAlong = (position: number, length: number): number => {
    const overflowAfter = position + 1 + length - BOARD_SIZE;
    if (overflowAfter <= 0) return position + 1;
    const overflowBefore = length - position;
    if (overflowBefore <= 0 || overflowBefore < overflowAfter) return position - length;
    return position + 1;
};

/**
 * The pad's corner touches the cell's, below and to the right unless that leaves the board. Cornerwise it
 * covers none of the cell's row or column, only, at most, some of its box.
 */
export const floatingPadPlacement = (
    { row, column }: { row: number; column: number },
    size: FloatingPadSize = { rows: FLOATING_PAD_ROWS, columns: FLOATING_PAD_COLUMNS },
): FloatingPadPlacement => ({
    rowStart: placeAlong(row, size.rows),
    columnStart: placeAlong(column, size.columns),
});
