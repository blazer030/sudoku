export function isValidInRow(board: number[][], row: number, num: number): boolean {
    return !board[row].includes(num);
}

export function isValidInColumn(board: number[][], col: number, num: number): boolean {
    return !board.some(row => row[col] === num);
}

export function isValidInBox(board: number[][], row: number, col: number, num: number): boolean {
    const boxRowStart = Math.floor(row / 3) * 3;
    const boxColStart = Math.floor(col / 3) * 3;
    for (let currentRow = boxRowStart; currentRow < boxRowStart + 3; currentRow++) {
        for (let currentCol = boxColStart; currentCol < boxColStart + 3; currentCol++) {
            if (board[currentRow][currentCol] === num) return false;
        }
    }
    return true;
}
