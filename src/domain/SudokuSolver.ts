import { SudokuBoard } from "@/domain/SudokuBoard";

export type NumbersProvider = () => number[];

export class SudokuSolver {
    private board = new SudokuBoard();

    solve(board: number[][], numbersProvider?: NumbersProvider): number[][] | null {
        const puzzle = board.map(row => [...row]);

        if (this.fillBoard(puzzle, numbersProvider)) {
            return puzzle;
        }
        return null;
    }

    private fillBoard(board: number[][], numbersProvider?: NumbersProvider): boolean {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const numbers = numbersProvider ? numbersProvider() : [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    for (const num of numbers) {
                        if (this.board.isValidPlacement(board, row, col, num)) {
                            board[row][col] = num;
                            if (this.fillBoard(board, numbersProvider)) {
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
