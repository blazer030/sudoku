import { SudokuSolver } from "@/domain/SudokuSolver";

export type Difficulty = "easy" | "medium" | "hard";

export class SudokuGenerator {
    private solver = new SudokuSolver();

    generateFullBoard(): number[][] {
        const emptyBoard = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
        const board = this.solver.solve(emptyBoard, () => this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]));
        if (!board) throw new Error("Failed to generate a full board");
        return board;
    }

    generatePuzzle(difficulty: Difficulty): { puzzle: number[][], answer: number[][] } {
        const answer = this.generateFullBoard();
        const puzzle = answer.map(row => [...row]);
        const clueCount = this.clueCountForDifficulty(difficulty);
        this.removeClues(puzzle, 81 - clueCount);
        return { puzzle, answer };
    }

    private removeClues(board: number[][], count: number): void {
        const positions = this.shuffle(
            Array.from({ length: 81 }, (_, index) => index)
        );

        for (let index = 0; index < count; index++) {
            const row = Math.floor(positions[index] / 9);
            const col = positions[index] % 9;
            board[row][col] = 0;
        }
    }

    private clueCountForDifficulty(difficulty: Difficulty): number {
        const ranges: Record<Difficulty, [number, number]> = {
            easy: [36, 45],
            medium: [27, 35],
            hard: [22, 26],
        };
        const [min, max] = ranges[difficulty];
        return Math.floor(Math.random() * (max - min + 1)) + min;
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
