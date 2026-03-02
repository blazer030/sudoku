export class SudokuBoard {
    isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
        return this.isValidInRow(board, row, num)
            && this.isValidInColumn(board, col, num)
            && this.isValidInBox(board, row, col, num);
    }

    isValidSolution(board: number[][]): boolean {
        for (let index = 0; index < 9; index++) {
            const row = board[index];
            const column = board.map(row => row[index]);
            const boxRowStart = Math.floor(index / 3) * 3;
            const boxColStart = (index % 3) * 3;
            const box = [];
            for (let currentRow = boxRowStart; currentRow < boxRowStart + 3; currentRow++) {
                for (let currentCol = boxColStart; currentCol < boxColStart + 3; currentCol++) {
                    box.push(board[currentRow][currentCol]);
                }
            }
            if (!this.hasAllDigits(row) || !this.hasAllDigits(column) || !this.hasAllDigits(box)) {
                return false;
            }
        }
        return true;
    }

    private hasAllDigits(numbers: number[]): boolean {
        return new Set(numbers).size === 9
            && numbers.every(number => number >= 1 && number <= 9);
    }

    private isValidInRow(board: number[][], row: number, num: number): boolean {
        return !board[row].includes(num);
    }

    private isValidInColumn(board: number[][], col: number, num: number): boolean {
        return !board.some(row => row[col] === num);
    }

    private isValidInBox(board: number[][], row: number, col: number, num: number): boolean {
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;
        for (let currentRow = boxRowStart; currentRow < boxRowStart + 3; currentRow++) {
            for (let currentCol = boxColStart; currentCol < boxColStart + 3; currentCol++) {
                if (board[currentRow][currentCol] === num) return false;
            }
        }
        return true;
    }
}
