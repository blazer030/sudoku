import { SudokuBoard } from "@/domain/SudokuBoard";

export class SudokuGenerator {
    private board = new SudokuBoard();

    generateFullBoard(): number[][] {
        const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
        this.fillBoard(board);
        return board;
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
