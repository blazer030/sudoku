import { ConflictDetector, Conflict } from "@/domain/ConflictDetector";
import PuzzleCell from "@/domain/PuzzleCell";
import { Difficulty, SudokuGenerator } from "@/domain/SudokuGenerator";

class Sudoku {
    private _answer: number[][] = [];
    private _puzzle: PuzzleCell[][] = [];
    private generator = new SudokuGenerator();
    private conflictDetector = new ConflictDetector();

    public generate(difficulty: Difficulty = "easy") {
        const { puzzle, answer } = this.generator.generatePuzzle(difficulty);
        this._answer = answer;

        this._puzzle = puzzle.map((row) => {
            return row.map((value) => {
                return new PuzzleCell(value);
            });
        });

        return this._puzzle;
    }

    public check(row: number, column: number, value: number): boolean {
        return this._answer[row][column] === value;
    }

    public findConflicts(row: number, column: number, value: number): Conflict[] {
        const board = this._puzzle.map(puzzleRow =>
            puzzleRow.map(cell => cell.isTip ? cell.value : cell.input)
        );
        return this.conflictDetector.findConflicts(board, row, column, value);
    }
}

export default Sudoku;
