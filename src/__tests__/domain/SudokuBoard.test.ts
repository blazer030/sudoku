import { describe, expect, it } from "vitest";
import { isValidInRow, isValidInColumn, isValidInBox } from "@/domain/SudokuBoard";

describe("SudokuBoard", () => {
    describe("isValidInRow", () => {
        it("should return true when placing a number in an empty row", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

            expect(isValidInRow(board, 0, 5)).toBe(true);
        });

        it("should return false when the row already contains the same number", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[0][3] = 5;

            expect(isValidInRow(board, 0, 5)).toBe(false);
        });

        it("should return true when the row contains different numbers", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[0][0] = 1;
            board[0][1] = 2;
            board[0][2] = 3;

            expect(isValidInRow(board, 0, 5)).toBe(true);
        });
    });

    describe("isValidInColumn", () => {
        it("should return true when placing a number in an empty column", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

            expect(isValidInColumn(board, 0, 5)).toBe(true);
        });

        it("should return false when the column already contains the same number", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[4][0] = 5;

            expect(isValidInColumn(board, 0, 5)).toBe(false);
        });
    });

    describe("isValidInBox", () => {
        it("should return true when placing a number in an empty box", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

            expect(isValidInBox(board, 0, 0, 5)).toBe(true);
        });
    });
});
