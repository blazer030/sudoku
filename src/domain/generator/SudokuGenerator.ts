import { BOARD_SIZE, TOTAL_CELLS } from "@/domain/board/constants";
import { SudokuSolver } from "@/domain/generator/SudokuSolver";

export type Difficulty = "easy" | "medium" | "hard";
export const DifficultyLabels: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

export class SudokuGenerator {
    private solver = new SudokuSolver();

    public generateFullBoard(): number[][] {
        const emptyBoard = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 0));
        const board = this.solver.solve(emptyBoard, () => this.shuffle(Array.from({ length: BOARD_SIZE }, (_, index) => index + 1)));
        if (!board) throw new Error("Failed to generate a full board");
        return board;
    }

    public generatePuzzle(difficulty: Difficulty): { puzzle: number[][], answer: number[][] } {
        for (;;) {
            const answer = this.generateFullBoard();
            const puzzle = answer.map(row => [...row]);
            const clueCount = this.clueCountForDifficulty(difficulty);
            if (this.removeClues(puzzle, TOTAL_CELLS - clueCount)) {
                return { puzzle, answer };
            }
        }
    }

    private removeClues(board: number[][], count: number): boolean {
        const positions = this.shuffle(
            Array.from({ length: TOTAL_CELLS }, (_, index) => index)
        );

        let removed = 0;
        for (const position of positions) {
            if (removed >= count) break;
            const row = Math.floor(position / BOARD_SIZE);
            const column = position % BOARD_SIZE;
            const backup = board[row][column];
            board[row][column] = 0;

            if (this.solver.countSolutions(board, 2) !== 1) {
                board[row][column] = backup;
            } else {
                removed++;
            }
        }
        return removed >= count;
    }

    private clueCountForDifficulty(difficulty: Difficulty): number {
        const ranges: Record<Difficulty, [number, number]> = {
            easy: [36, 45],
            medium: [27, 35],
            hard: [22, 26],
        };
        const [minimum, maximum] = ranges[difficulty];
        return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    }

    private shuffle(array: number[]): number[] {
        const result = [...array];
        for (let index = result.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
        }
        return result;
    }
}
