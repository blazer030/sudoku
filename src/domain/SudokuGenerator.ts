import { SudokuBoard } from "@/domain/SudokuBoard";

export class SudokuGenerator {
    private board = new SudokuBoard();

    generateFullBoard(): number[][] {
        const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
        this.fillBoard(board);
        return board;
    }

    generatePuzzle(clueCountOrDifficulty: number | string, fullBoard?: number[][]): number[][] {
        const clueCount = typeof clueCountOrDifficulty === "string"
            ? this.clueCountForDifficulty(clueCountOrDifficulty)
            : clueCountOrDifficulty;
        const board = fullBoard
            ? fullBoard.map(row => [...row])
            : this.generateFullBoard();
        this.removeClues(board, 81 - clueCount);
        return board;
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

    private clueCountForDifficulty(difficulty: string): number {
        const ranges: Record<string, [number, number]> = {
            easy: [36, 45],
            medium: [27, 35],
            hard: [22, 26],
        };
        const [min, max] = ranges[difficulty];
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private fillBoard(board: number[][]): boolean {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    for (const num of numbers) {
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

    private shuffle(array: number[]): number[] {
        const result = [...array];
        for (let index = result.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
        }
        return result;
    }
}
