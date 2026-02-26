import { SudokuBoard } from "@/domain/SudokuBoard";

export class SudokuSolver {
    private board = new SudokuBoard();

    solve(board: number[][]): number[][] | null {
        const puzzle = board.map(row => [...row]);

        if (this.fillBoard(puzzle)) {
            return puzzle;
        }
        return null;
    }

    private fillBoard(board: number[][]): boolean {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.board.isValidPlacement(board, row, col, num)) {
                            board[row][col] = num;
                            if (this.fillBoard(board)) {
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
}
