import { ConflictDetector, Conflict } from "@/domain/ConflictDetector";
import PuzzleCell from "@/domain/PuzzleCell";
import { SudokuBoard } from "@/domain/SudokuBoard";
import { Difficulty, SudokuGenerator } from "@/domain/SudokuGenerator";

interface CellSnapshot { input: number; notes: number[] }
type BoardSnapshot = CellSnapshot[][]

class Sudoku {
    private _answer: number[][] = [];
    private _puzzle: PuzzleCell[][] = [];
    private _history: BoardSnapshot[] = [];
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

    public getState(): { answer: number[][]; cells: { value: number; input: number; notes: number[] }[][] } {
        return {
            answer: this._answer.map(row => [...row]),
            cells: this._puzzle.map(row =>
                row.map(cell => ({
                    value: cell.value,
                    input: cell.input,
                    notes: [...cell.notes],
                }))
            ),
        };
    }

    public isCompleted(): boolean {
        return this._puzzle.every((puzzleRow, rowIndex) =>
            puzzleRow.every((cell, columnIndex) => {
                const value = cell.isClue ? cell.value : cell.input;
                return value === this._answer[rowIndex][columnIndex];
            })
        );
    }

    private snapshot(): void {
        this._history.push(
            this._puzzle.map(row =>
                row.map(cell => ({ input: cell.input, notes: [...cell.notes] }))
            )
        );
    }

    public undo(): void {
        const snapshot = this._history.pop();
        if (!snapshot) return;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                this._puzzle[row][col].restore(snapshot[row][col].input, snapshot[row][col].notes);
            }
        }
    }

    public erase(row: number, column: number): void {
        const cell = this._puzzle[row][column];
        if (cell.isClue) return;
        this.snapshot();
        if (cell.isEntered) {
            cell.input = 0;
        } else if (cell.hasNotes) {
            cell.clearNotes();
        }
    }

    public toggleNote(row: number, column: number, value: number): void {
        const cell = this._puzzle[row][column];
        if (cell.isClue || cell.isEntered) return;
        this.snapshot();
        cell.toggleNote(value);
    }

    public input(row: number, column: number, value: number): void {
        this.snapshot();
        this._puzzle[row][column].input = value;
        if (value > 0) {
            this.removeNoteFromPeers(row, column, value);
        }
    }

    private removeNoteFromPeers(row: number, column: number, value: number): void {
        // 同行
        for (let col = 0; col < 9; col++) {
            if (col !== column) this._puzzle[row][col].removeNote(value);
        }
        // 同列
        for (let r = 0; r < 9; r++) {
            if (r !== row) this._puzzle[r][column].removeNote(value);
        }
        // 同宮
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(column / 3) * 3;
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                if (r !== row || c !== column) this._puzzle[r][c].removeNote(value);
            }
        }
    }

    public check(row: number, column: number, value: number): boolean {
        return this._answer[row][column] === value;
    }

    public autoNotes(): void {
        this.snapshot();
        const currentBoard = this.getCurrentBoard();
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = this._puzzle[row][col];
                if (cell.isClue || cell.isEntered) continue;
                cell.clearNotes();
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
