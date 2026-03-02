import { ConflictDetector, Conflict } from "@/domain/ConflictDetector";
import PuzzleCell from "@/domain/PuzzleCell";
import { SudokuBoard } from "@/domain/SudokuBoard";
import { Difficulty, SudokuGenerator } from "@/domain/SudokuGenerator";

class Sudoku {
    private _answer: number[][] = [];
    private _puzzle: PuzzleCell[][] = [];
    private generator = new SudokuGenerator();
    private conflictDetector = new ConflictDetector();
    private board = new SudokuBoard();

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

    public isCompleted(): boolean {
        return this._puzzle.every((puzzleRow, rowIndex) =>
            puzzleRow.every((cell, columnIndex) => {
                const value = cell.isClue ? cell.value : cell.input;
                return value === this._answer[rowIndex][columnIndex];
            })
        );
    }

    public input(row: number, column: number, value: number): void {
        this._puzzle[row][column].input = value;
    }

    public check(row: number, column: number, value: number): boolean {
        return this._answer[row][column] === value;
    }

    public autoNotes(): void {
        const currentBoard = this.getCurrentBoard();
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = this._puzzle[row][col];
                if (cell.isClue || cell.isEntered) continue;
                for (let digit = 1; digit <= 9; digit++) {
                    if (this.board.isValidPlacement(currentBoard, row, col, digit)) {
                        cell.toggleNote(digit);
                    }
                }
            }
        }
    }

    private getCurrentBoard(): number[][] {
        return this._puzzle.map(puzzleRow =>
            puzzleRow.map(cell => cell.isClue ? cell.value : cell.input)
        );
    }

    public findConflicts(row: number, column: number, value: number): Conflict[] {
        return this.conflictDetector.findConflicts(this.getCurrentBoard(), row, column, value);
    }
}

export default Sudoku;
