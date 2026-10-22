import { BOARD_SIZE } from "@/domain/board/constants";
import { SudokuBoard } from "@/domain/board/SudokuBoard";
import { countSolutionsWithPropagation } from "@/domain/generator/PropagatingSolutionCounter";

export type DigitsProvider = () => number[];

/** The count of a search that ran out of budget before it could tell how many solutions there are. */
export const UNKNOWN_SOLUTION_COUNT = "unknown";

export type SolutionCount = number | typeof UNKNOWN_SOLUTION_COUNT;

export interface CountSolutionsOptions {
    /** How many search nodes to visit before giving up with `UNKNOWN_SOLUTION_COUNT`. */
    maxNodes: number;
}

export class SudokuSolver {
    private board = new SudokuBoard();

    public solve(board: number[][], digitsProvider?: DigitsProvider): number[][] | null {
        const puzzle = board.map(row => [...row]);

        if (this.fillBoard(puzzle, digitsProvider)) {
            return puzzle;
        }
        return null;
    }

    /**
     * Counts solutions up to `limit`. Without options the search runs to the end; with `maxNodes`
     * it gives up with `UNKNOWN_SOLUTION_COUNT` once it has visited that many nodes.
     */
    public countSolutions(board: number[][], limit?: number): number;
    public countSolutions(board: number[][], limit: number, options: CountSolutionsOptions): SolutionCount;
    public countSolutions(board: number[][], limit = 2, options?: CountSolutionsOptions): SolutionCount {
        const maxNodes = options?.maxNodes ?? Number.POSITIVE_INFINITY;
        const { solutions, exhausted } = countSolutionsWithPropagation(board, limit, maxNodes);
        return exhausted ? UNKNOWN_SOLUTION_COUNT : solutions;
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
