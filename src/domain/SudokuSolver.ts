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
            for (let column = 0; column < 9; column++) {
                if (board[row][column] === 0) {
                    const numbers = numbersProvider ? numbersProvider() : [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    for (const digit of numbers) {
                        if (this.board.isValidPlacement(board, row, column, digit)) {
                            board[row][column] = digit;
                            if (this.fillBoard(board, numbersProvider)) {
                                return true;
                            }
                            board[row][column] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
}
