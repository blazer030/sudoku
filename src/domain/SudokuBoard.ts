export class SudokuBoard {
    isValidPlacement(board: number[][], row: number, column: number, digit: number): boolean {
        return this.isValidInRow(board, row, digit)
            && this.isValidInColumn(board, column, digit)
            && this.isValidInBox(board, row, column, digit);
    }

    isValidSolution(board: number[][]): boolean {
        for (let index = 0; index < 9; index++) {
            const row = board[index];
            const column = board.map(row => row[index]);
            const boxRowStart = Math.floor(index / 3) * 3;
            const boxColumnStart = (index % 3) * 3;
            const box = [];
            for (let currentRow = boxRowStart; currentRow < boxRowStart + 3; currentRow++) {
                for (let currentColumn = boxColumnStart; currentColumn < boxColumnStart + 3; currentColumn++) {
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
        return new Set(digits).size === 9
            && digits.every(digit => digit >= 1 && digit <= 9);
    }

    private isValidInRow(board: number[][], row: number, digit: number): boolean {
        return !board[row].includes(digit);
    }

    private isValidInColumn(board: number[][], column: number, digit: number): boolean {
        return !board.some(row => row[column] === digit);
    }

    private isValidInBox(board: number[][], row: number, column: number, digit: number): boolean {
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColumnStart = Math.floor(column / 3) * 3;
        for (let currentRow = boxRowStart; currentRow < boxRowStart + 3; currentRow++) {
            for (let currentColumn = boxColumnStart; currentColumn < boxColumnStart + 3; currentColumn++) {
                if (board[currentRow][currentColumn] === digit) return false;
            }
        }
        return true;
    }
}
