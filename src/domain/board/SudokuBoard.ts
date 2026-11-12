import { BOX_SIZE } from "@/domain/board/constants";
import { boxStart } from "@/domain/board/geometry";

export class SudokuBoard {
    public isValidPlacement(board: number[][], row: number, column: number, digit: number): boolean {
        return this.isValidInRow(board, row, digit)
            && this.isValidInColumn(board, column, digit)
            && this.isValidInBox(board, row, column, digit);
    }

    private isValidInRow(board: number[][], row: number, digit: number): boolean {
        return !board[row].includes(digit);
    }

    private isValidInColumn(board: number[][], column: number, digit: number): boolean {
        return !board.some(row => row[column] === digit);
    }

    private isValidInBox(board: number[][], row: number, column: number, digit: number): boolean {
        const boxRowStart = boxStart(row);
        const boxColumnStart = boxStart(column);
        for (let currentRow = boxRowStart; currentRow < boxRowStart + BOX_SIZE; currentRow++) {
            for (let currentColumn = boxColumnStart; currentColumn < boxColumnStart + BOX_SIZE; currentColumn++) {
                if (board[currentRow][currentColumn] === digit) return false;
            }
        }
        return true;
    }
}
