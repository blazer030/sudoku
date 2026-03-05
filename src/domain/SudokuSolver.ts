import { SudokuBoard } from "@/domain/SudokuBoard";

export type DigitsProvider = () => number[];

export class SudokuSolver {
    private board = new SudokuBoard();

    public solve(board: number[][], digitsProvider?: DigitsProvider): number[][] | null {
        const puzzle = board.map(row => [...row]);

        if (this.fillBoard(puzzle, digitsProvider)) {
            return puzzle;
        }
        return null;
    }

    public countSolutions(board: number[][], limit: number = 2): number {
        const puzzle = board.map(row => [...row]);
        return this.countSolutionsRecursive(puzzle, limit);
    }

    private countSolutionsRecursive(puzzle: number[][], limit: number): number {
        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (puzzle[row][column] === 0) {
                    let count = 0;
                    for (let digit = 1; digit <= 9; digit++) {
                        if (this.board.isValidPlacement(puzzle, row, column, digit)) {
                            puzzle[row][column] = digit;
                            count += this.countSolutionsRecursive(puzzle, limit - count);
                            puzzle[row][column] = 0;
                            if (count >= limit) return count;
                        }
                    }
                    return count;
                }
            }
        }
        return 1;
    }

    private fillBoard(board: number[][], digitsProvider?: DigitsProvider): boolean {
        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (board[row][column] === 0) {
                    const digits = digitsProvider ? digitsProvider() : [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    for (const digit of digits) {
                        if (this.board.isValidPlacement(board, row, column, digit)) {
                            board[row][column] = digit;
                            if (this.fillBoard(board, digitsProvider)) {
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
