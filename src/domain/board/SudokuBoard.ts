import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";

export class SudokuBoard {
    public isValidPlacement(board: number[][], row: number, column: number, digit: number): boolean {
        return this.isValidInRow(board, row, digit)
            && this.isValidInColumn(board, column, digit)
            && this.isValidInBox(board, row, column, digit);
    }

    public isValidSolution(board: number[][]): boolean {
        for (let index = 0; index < BOARD_SIZE; index++) {
            const row = board[index];
            const column = board.map(row => row[index]);
            const boxRowStart = Math.floor(index / BOX_SIZE) * BOX_SIZE;
            const boxColumnStart = (index % BOX_SIZE) * BOX_SIZE;
            const box = [];
            for (let currentRow = boxRowStart; currentRow < boxRowStart + BOX_SIZE; currentRow++) {
                for (let currentColumn = boxColumnStart; currentColumn < boxColumnStart + BOX_SIZE; currentColumn++) {
                    box.push(board[currentRow][currentColumn]);
                }
            }
            if (!this.hasAllDigits(row) || !this.hasAllDigits(column) || !this.hasAllDigits(box)) {
                return false;
            }
        }
        return true;
    }

    private hasAllDigits(digits: number[]): boolean {
        return new Set(digits).size === BOARD_SIZE
            && digits.every(digit => digit >= 1 && digit <= BOARD_SIZE);
    }

    private isValidInRow(board: number[][], row: number, digit: number): boolean {
        return !board[row].includes(digit);
    }

    private isValidInColumn(board: number[][], column: number, digit: number): boolean {
        return !board.some(row => row[column] === digit);
    }

    private isValidInBox(board: number[][], row: number, column: number, digit: number): boolean {
        const boxRowStart = Math.floor(row / BOX_SIZE) * BOX_SIZE;
        const boxColumnStart = Math.floor(column / BOX_SIZE) * BOX_SIZE;
        for (let currentRow = boxRowStart; currentRow < boxRowStart + BOX_SIZE; currentRow++) {
            for (let currentColumn = boxColumnStart; currentColumn < boxColumnStart + BOX_SIZE; currentColumn++) {
                if (board[currentRow][currentColumn] === digit) return false;
            }
        }
        return true;
    }
}
