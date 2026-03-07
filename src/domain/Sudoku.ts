import { Conflict, ConflictDetector } from "@/domain/ConflictDetector";
import PuzzleCell from "@/domain/PuzzleCell";
import { SudokuBoard } from "@/domain/SudokuBoard";
import { Difficulty, SudokuGenerator } from "@/domain/SudokuGenerator";

interface CellSnapshot {
    entry: number;
    notes: number[]
}

type BoardSnapshot = CellSnapshot[][]

class Sudoku {
    private _answer: number[][] = [];
    private _puzzle: PuzzleCell[][] = [];
    private _history: BoardSnapshot[] = [];
    private generator = new SudokuGenerator();
    private conflictDetector = new ConflictDetector();
    private board = new SudokuBoard();

    public get answer(): number[][] {
        return this._answer;
    }

    public get puzzle(): PuzzleCell[][] {
        return this._puzzle;
    }

    public restore(answer: number[][], puzzle: PuzzleCell[][]): void {
        this._answer = answer;
        this._puzzle = puzzle;
    }

    public static restoreSave(answer: number[][], puzzle: PuzzleCell[][]): Sudoku {
        const instance = new Sudoku();
        instance.restore(answer, puzzle);
        return instance;
    }

    public raw() {
        return this;
    }

    public generate(difficulty: Difficulty = "easy"): void {
        const { puzzle, answer } = this.generator.generatePuzzle(difficulty);
        this._answer = answer;

        this._puzzle = puzzle.map((row) => {
            return row.map((puzzleValue) => {
                return new PuzzleCell(puzzleValue);
            });
        });
    }

    public isCompleted(): boolean {
        return this._puzzle.every((puzzleRow, rowIndex) =>
            puzzleRow.every((cell, columnIndex) => {
                const value = cell.isClue ? cell.clue : cell.entry;
                return value === this._answer[rowIndex][columnIndex];
            })
        );
    }

    public undo(): void {
        const snapshot = this._history.pop();
        if (!snapshot) return;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                this._puzzle[row][col].restore(snapshot[row][col].entry, snapshot[row][col].notes);
            }
        }
    }

    public erase(row: number, column: number): void {
        const cell = this._puzzle[row][column];
        if (cell.isClue) return;
        this.snapshot();
        if (cell.hasEntry) {
            cell.entry = 0;
        } else if (cell.hasNotes) {
            cell.clearNotes();
        }
    }

    public toggleNote(row: number, column: number, value: number): void {
        const cell = this._puzzle[row][column];
        if (cell.isClue || cell.hasEntry) return;
        this.snapshot();
        cell.toggleNote(value);
    }

    public fill(row: number, column: number, value: number): void {
        this.snapshot();
        this._puzzle[row][column].entry = value;
        if (value > 0) {
            this.removeNoteFromPeers(row, column, value);
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
                if (cell.isClue || cell.hasEntry) continue;
                cell.clearNotes();
                for (let digit = 1; digit <= 9; digit++) {
                    if (this.board.isValidPlacement(currentBoard, row, col, digit)) {
                        cell.toggleNote(digit);
                    }
                }
            }
        }
    }

    public checkAllConflicts(): Conflict[] {
        const board = this.getCurrentBoard();
        const conflicts: Conflict[] = [];
        const seen = new Set<string>();

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = this._puzzle[row][col];
                if (cell.isClue || !cell.hasEntry) continue;
                const value = cell.entry;
                const cellConflicts = this.conflictDetector.findConflicts(board, row, col, value);
                for (const c of cellConflicts) {
                    const key = `${c.row},${c.column}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        conflicts.push(c);
                    }
                }
                if (cellConflicts.length > 0) {
                    const selfKey = `${row},${col}`;
                    if (!seen.has(selfKey)) {
                        seen.add(selfKey);
                        conflicts.push({ row, column: col });
                    }
                }
            }
        }
        return conflicts;
    }

    public revealRandomCell(): Conflict | null {
        const candidates: Conflict[] = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = this._puzzle[row][col];
                if (cell.isClue) continue;
                if (!cell.hasEntry || cell.entry !== this._answer[row][col]) {
                    candidates.push({ row, column: col });
                }
            }
        }
        if (candidates.length === 0) return null;
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        this.snapshot();
        this._puzzle[target.row][target.column].entry = this._answer[target.row][target.column];
        return target;
    }

    public checkErrors(): Conflict[] {
        const errors: Conflict[] = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = this._puzzle[row][col];
                if (cell.isClue || !cell.hasEntry) continue;
                if (cell.entry !== this._answer[row][col]) {
                    errors.push({ row, column: col });
                }
            }
        }
        return errors;
    }

    public findConflicts(row: number, column: number, value: number): Conflict[] {
        return this.conflictDetector.findConflicts(this.getCurrentBoard(), row, column, value);
    }

    private snapshot(): void {
        this._history.push(
            this._puzzle.map(row =>
                row.map(cell => ({ entry: cell.entry, notes: [...cell.notes] }))
            )
        );
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

    private getCurrentBoard(): number[][] {
        return this._puzzle.map(puzzleRow =>
            puzzleRow.map(cell => cell.isClue ? cell.clue : cell.entry)
        );
    }
}

export default Sudoku;
