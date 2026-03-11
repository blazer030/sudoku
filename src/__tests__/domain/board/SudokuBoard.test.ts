import { describe, expect, it } from "vitest";
import { SudokuBoard } from "@/domain/board/SudokuBoard";

const sudokuBoard = new SudokuBoard();

describe("SudokuBoard", () => {
    describe("isValidPlacement", () => {
        it("should return true when row, column, and box are all valid", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[0][0] = 1;
            board[1][3] = 2;

            expect(sudokuBoard.isValidPlacement(board, 4, 4, 5)).toBe(true);
        });

        it("should return false when the row contains the same number", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[0][4] = 5;

            expect(sudokuBoard.isValidPlacement(board, 0, 1, 5)).toBe(false);
        });

        it("should return false when the column contains the same number", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[0][4] = 5;

            expect(sudokuBoard.isValidPlacement(board, 3, 4, 5)).toBe(false);
        });

        it("should return false when the box contains the same number", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[0][4] = 5;

            expect(sudokuBoard.isValidPlacement(board, 1, 3, 5)).toBe(false);
        });

        it("should correctly identify the box for different positions", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[5][8] = 7;

            expect(sudokuBoard.isValidPlacement(board, 4, 7, 7)).toBe(false);
            expect(sudokuBoard.isValidPlacement(board, 3, 6, 7)).toBe(false);
            expect(sudokuBoard.isValidPlacement(board, 0, 7, 7)).toBe(true);
        });
    });
});
