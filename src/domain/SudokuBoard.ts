export function isValidInRow(board: number[][], row: number, num: number): boolean {
    return !board[row].includes(num);
}
