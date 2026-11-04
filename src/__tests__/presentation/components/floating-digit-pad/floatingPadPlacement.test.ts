import { describe, expect, it } from "vitest";
import { FLOATING_PAD_COLUMNS, FLOATING_PAD_ROWS, floatingPadPlacement } from "@/presentation/components/floating-digit-pad/floatingPadPlacement";

const BOARD_SIZE = 9;
const ALL_CELLS = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
    row: Math.floor(index / BOARD_SIZE),
    column: index % BOARD_SIZE,
}));

describe("floatingPadPlacement", () => {
    it.each(ALL_CELLS)("should stay inside the board and off the row and column of cell ($row, $column)", (cell) => {
        const { rowStart, columnStart } = floatingPadPlacement(cell);

        expect(rowStart).toBeGreaterThanOrEqual(0);
        expect(rowStart + FLOATING_PAD_ROWS).toBeLessThanOrEqual(BOARD_SIZE);
        expect(columnStart).toBeGreaterThanOrEqual(0);
        expect(columnStart + FLOATING_PAD_COLUMNS).toBeLessThanOrEqual(BOARD_SIZE);
        const coversRow = rowStart < cell.row + 1 && rowStart + FLOATING_PAD_ROWS > cell.row;
        const coversColumn = columnStart < cell.column + 1 && columnStart + FLOATING_PAD_COLUMNS > cell.column;
        expect(coversRow).toBe(false);
        expect(coversColumn).toBe(false);
    });

    it.each(ALL_CELLS)("should touch the corner of cell ($row, $column)", (cell) => {
        const { rowStart, columnStart } = floatingPadPlacement(cell);

        const touchesRow = rowStart === cell.row + 1 || rowStart + FLOATING_PAD_ROWS === cell.row;
        const touchesColumn = columnStart === cell.column + 1 || columnStart + FLOATING_PAD_COLUMNS === cell.column;
        expect(touchesRow).toBe(true);
        expect(touchesColumn).toBe(true);
    });

    it.each([
        { row: 0, column: 0, below: true, right: true },
        { row: 4, column: 4, below: true, right: true },
        { row: 5, column: 5, below: false, right: true },
        { row: 2, column: 6, below: true, right: false },
        { row: 8, column: 8, below: false, right: false },
    ])("should open on the expected side of cell ($row, $column)", ({ row, column, below, right }) => {
        const { rowStart, columnStart } = floatingPadPlacement({ row, column });

        expect(rowStart > row).toBe(below);
        expect(columnStart > column).toBe(right);
    });
});
