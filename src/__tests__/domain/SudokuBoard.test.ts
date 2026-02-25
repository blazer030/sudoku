import { describe, expect, it } from "vitest";
import { isValidInRow } from "@/domain/SudokuBoard";

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
    });
});
