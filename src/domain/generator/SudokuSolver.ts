import { BOARD_SIZE } from "@/domain/board/constants";
import { SudokuBoard } from "@/domain/board/SudokuBoard";

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

    public countSolutions(board: number[][], limit = 2): number {
        const puzzle = board.map(row => [...row]);
        if (this.hasConflictingGivens(puzzle)) return 0;
        return this.countSolutionsRecursive(puzzle, limit);
    }

    // The search only checks the digits it places, so givens that already clash must be caught first.
    private hasConflictingGivens(puzzle: number[][]): boolean {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                const digit = puzzle[row][column];
                if (digit === 0) continue;
                puzzle[row][column] = 0;
                const valid = this.board.isValidPlacement(puzzle, row, column, digit);
                puzzle[row][column] = digit;
                if (!valid) return true;
            }
        }
        return false;
    }

    // Branches on the empty cell with the fewest candidates, so a dead end shows up at once.
    private countSolutionsRecursive(puzzle: number[][], limit: number): number {
        let bestRow = -1;
        let bestColumn = -1;
        let bestCandidates: number[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                if (puzzle[row][column] !== 0) continue;
                const candidates = this.candidatesAt(puzzle, row, column);
                if (candidates.length === 0) return 0;
                if (bestRow === -1 || candidates.length < bestCandidates.length) {
                    bestRow = row;
                    bestColumn = column;
                    bestCandidates = candidates;
                }
            }
        }
        if (bestRow === -1) return 1;

        let count = 0;
        for (const digit of bestCandidates) {
            puzzle[bestRow][bestColumn] = digit;
            count += this.countSolutionsRecursive(puzzle, limit - count);
            puzzle[bestRow][bestColumn] = 0;
            if (count >= limit) return count;
        }
        return count;
    }

    private candidatesAt(puzzle: number[][], row: number, column: number): number[] {
        const candidates: number[] = [];
        for (let digit = 1; digit <= BOARD_SIZE; digit++) {
            if (this.board.isValidPlacement(puzzle, row, column, digit)) candidates.push(digit);
        }
        return candidates;
    }

    private fillBoard(board: number[][], digitsProvider?: DigitsProvider): boolean {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                if (board[row][column] === 0) {
                    const digits = digitsProvider ? digitsProvider() : Array.from({ length: BOARD_SIZE }, (_, index) => index + 1);
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
