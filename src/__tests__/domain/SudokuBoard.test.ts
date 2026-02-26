import { describe, expect, it } from "vitest";
import { SudokuBoard } from "@/domain/SudokuBoard";

const sudokuBoard = new SudokuBoard();

describe("SudokuBoard", () => {
    describe("isValidInRow", () => {
        it("should return true when placing a number in an empty row", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

            expect(sudokuBoard.isValidInRow(board, 0, 5)).toBe(true);
        });

        it("should return false when the row already contains the same number", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[0][3] = 5;

            expect(sudokuBoard.isValidInRow(board, 0, 5)).toBe(false);
        });

        it("should return true when the row contains different numbers", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[0][0] = 1;
            board[0][1] = 2;
            board[0][2] = 3;

            expect(sudokuBoard.isValidInRow(board, 0, 5)).toBe(true);
        });
    });

    describe("isValidInColumn", () => {
        it("should return true when placing a number in an empty column", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

            expect(sudokuBoard.isValidInColumn(board, 0, 5)).toBe(true);
        });

        it("should return false when the column already contains the same number", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[4][0] = 5;

            expect(sudokuBoard.isValidInColumn(board, 0, 5)).toBe(false);
        });
    });

    describe("isValidInBox", () => {
        it("should return true when placing a number in an empty box", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

            expect(sudokuBoard.isValidInBox(board, 0, 0, 5)).toBe(true);
        });

        it("should return false when the box already contains the same number", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[1][2] = 5;

            expect(sudokuBoard.isValidInBox(board, 0, 0, 5)).toBe(false);
        });

        it("should correctly identify the box for different positions", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[5][8] = 7;

            expect(sudokuBoard.isValidInBox(board, 4, 7, 7)).toBe(false);
            expect(sudokuBoard.isValidInBox(board, 3, 6, 7)).toBe(false);
            expect(sudokuBoard.isValidInBox(board, 0, 7, 7)).toBe(true);
        });
    });

    describe("isValidPlacement", () => {
        it("should return true when row, column, and box are all valid", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[0][0] = 1;
            board[1][3] = 2;

            expect(sudokuBoard.isValidPlacement(board, 4, 4, 5)).toBe(true);
        });

        it("should return false when any rule is violated", () => {
            const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
            board[0][4] = 5;

            expect(sudokuBoard.isValidPlacement(board, 0, 1, 5)).toBe(false);
            expect(sudokuBoard.isValidPlacement(board, 3, 4, 5)).toBe(false);
            expect(sudokuBoard.isValidPlacement(board, 1, 3, 5)).toBe(false);
        });
    });
});
