export function isValidInRow(board: number[][], row: number, num: number): boolean {
    return !board[row].includes(num);
}

export function isValidInColumn(board: number[][], col: number, num: number): boolean {
    return !board.some(row => row[col] === num);
}
