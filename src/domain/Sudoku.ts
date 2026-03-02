import PuzzleCell from "@/domain/PuzzleCell";
import { SudokuGenerator } from "@/domain/SudokuGenerator";

class Sudoku {
    private _answer: number[][] = [];
    private _puzzle: PuzzleCell[][] = [];
    private generator = new SudokuGenerator();

    public generate(difficulty: string = "easy") {
        this._answer = this.generator.generateFullBoard();
        const board = this.generator.generatePuzzle(difficulty, this._answer);

        this._puzzle = board.map((row) => {
            return row.map((value) => {
                return new PuzzleCell(value);
            });
        });

        return this._puzzle;
    }

    public check(row: number, column: number, value: number): boolean {
        return this._answer[row][column] === value;
    }
}

export default Sudoku;
