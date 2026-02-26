export class SudokuBoard {
    isValidInRow(board: number[][], row: number, num: number): boolean {
        return !board[row].includes(num);
    }

    isValidInColumn(board: number[][], col: number, num: number): boolean {
        return !board.some(row => row[col] === num);
    }

    isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
        return this.isValidInRow(board, row, num)
            && this.isValidInColumn(board, col, num)
            && this.isValidInBox(board, row, col, num);
    }

    isValidInBox(board: number[][], row: number, col: number, num: number): boolean {
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
