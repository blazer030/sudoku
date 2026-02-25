import { isValidPlacement } from "@/domain/SudokuBoard";

export function solve(board: number[][]): number[][] | null {
    const puzzle = board.map(row => [...row]);

    if (fillBoard(puzzle)) {
        return puzzle;
    }
    return null;
}

function fillBoard(board: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isValidPlacement(board, row, col, num)) {
                        board[row][col] = num;
                        if (fillBoard(board)) {
                            return true;
                        }
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}
