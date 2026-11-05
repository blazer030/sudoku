import { describe, expect, it } from "vitest";
import { FLOATING_PAD_COLUMNS, FLOATING_PAD_ROWS, floatingPadPlacement, floatingPadSize } from "@/presentation/components/floating-digit-pad/floatingPadPlacement";

const BOARD_SIZE = 9;
const ALL_CELLS = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
    row: Math.floor(index / BOARD_SIZE),
    column: index % BOARD_SIZE,
}));

describe("floatingPadSize", () => {
    it.each([
        // Measured cell widths; the pad's own padding, gaps and border take 10px across and 12px down
        [24.2, 118 / 24.2, 141.6 / 24.2],
        [26.5, 118 / 26.5, 141.6 / 26.5],
        [32.7, 118 / 32.7, 141.6 / 32.7],
    ])("should grow past three cells for keys of 36px with cells of %fpx", (cellSize, columns, rows) => {
        const size = floatingPadSize(cellSize);

        expect(size.columns).toBeCloseTo(columns, 5);
        expect(size.rows).toBeCloseTo(rows, 5);
    });

    it.each([39.4, 41.5, 60])("should stay three cells wide with cells of %fpx", (cellSize) => {
        expect(floatingPadSize(cellSize)).toEqual({ rows: FLOATING_PAD_ROWS, columns: FLOATING_PAD_COLUMNS });
    });

    it("should grow further when a style gives the pad more room round its keys", () => {
        const size = floatingPadSize(40, { width: 20, height: 24 });

        expect(size.columns).toBeCloseTo(128 / 40, 5);
        expect(size.rows).toBeCloseTo(153.6 / 40, 5);
    });

    it("should keep its usual size before the board is measured", () => {
        expect(floatingPadSize(0)).toEqual({ rows: FLOATING_PAD_ROWS, columns: FLOATING_PAD_COLUMNS });
    });
});

describe("floatingPadPlacement on a small board", () => {
    // iPhone SE in Safari, measured: a 375×547 screen, and the grid's first cell at (79, 79)
    const SCREEN = { width: 375, height: 547 };
    const CELL = 24.2;
    const GRID_ORIGIN = 79;
    const size = floatingPadSize(CELL);

    it.each(ALL_CELLS)("should stay on the screen and off the row and column of cell ($row, $column)", (cell) => {
        const { rowStart, columnStart } = floatingPadPlacement(cell, size);

        const left = GRID_ORIGIN + columnStart * CELL;
        const top = GRID_ORIGIN + rowStart * CELL;
        expect(left).toBeGreaterThanOrEqual(0);
        expect(left + size.columns * CELL).toBeLessThanOrEqual(SCREEN.width);
        expect(top).toBeGreaterThanOrEqual(0);
        expect(top + size.rows * CELL).toBeLessThanOrEqual(SCREEN.height);
        expect(rowStart < cell.row + 1 && rowStart + size.rows > cell.row).toBe(false);
        expect(columnStart < cell.column + 1 && columnStart + size.columns > cell.column).toBe(false);
    });

    it("should open on the side where it leaves the board the least", () => {
        // 5.85 rows tall: from row 3 it runs 0.85 past the bottom but 2.85 past the top
        expect(floatingPadPlacement({ row: 3, column: 0 }, size).rowStart).toBe(4);
        // From row 5, the other way round
        expect(floatingPadPlacement({ row: 5, column: 0 }, size).rowStart).toBeCloseTo(5 - size.rows, 5);
    });

    it("should stay inside the board wherever it fits", () => {
        const { rowStart, columnStart } = floatingPadPlacement({ row: 0, column: 0 }, size);

        expect(rowStart).toBe(1);
        expect(columnStart).toBe(1);
    });
});

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
