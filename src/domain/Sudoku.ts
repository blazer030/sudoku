import { BoardHistory } from "@/domain/BoardHistory";
import { Conflict, ConflictDetector } from "@/domain/ConflictDetector";
import { BOARD_SIZE, BOX_SIZE } from "@/domain/constants";
import { HintTracker } from "@/domain/HintTracker";
import PuzzleCell from "@/domain/PuzzleCell";
import { SudokuBoard } from "@/domain/SudokuBoard";
import { Difficulty, SudokuGenerator } from "@/domain/SudokuGenerator";

class Sudoku {
    private _answer: number[][] = [];
    private _puzzle: PuzzleCell[][] = [];
    private history = new BoardHistory();
    private generator = new SudokuGenerator();
    private conflictDetector = new ConflictDetector();
    private board = new SudokuBoard();
    private _hintTracker = new HintTracker();

    public get hintTracker(): HintTracker {
        return this._hintTracker;
    }

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
        this.history.restore(this._puzzle);
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
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                const cell = this._puzzle[row][column];
                if (cell.isClue || cell.hasEntry) continue;
                cell.clearNotes();
                for (let digit = 1; digit <= BOARD_SIZE; digit++) {
                    if (this.board.isValidPlacement(currentBoard, row, column, digit)) {
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

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                const cell = this._puzzle[row][column];
                if (cell.isClue || !cell.hasEntry) continue;
                const value = cell.entry;
                const cellConflicts = this.conflictDetector.findConflicts(board, row, column, value);
                for (const conflict of cellConflicts) {
                    const key = `${conflict.row},${conflict.column}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        conflicts.push(conflict);
                    }
                }
                if (cellConflicts.length > 0) {
                    const selfKey = `${row},${column}`;
                    if (!seen.has(selfKey)) {
                        seen.add(selfKey);
                        conflicts.push({ row, column });
                    }
                }
            }
        }
        return conflicts;
    }

    public revealRandomCell(): Conflict | null {
        const candidates: Conflict[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                const cell = this._puzzle[row][column];
                if (cell.isClue) continue;
                if (!cell.hasEntry || cell.entry !== this._answer[row][column]) {
                    candidates.push({ row, column });
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
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                const cell = this._puzzle[row][column];
                if (cell.isClue || !cell.hasEntry) continue;
                if (cell.entry !== this._answer[row][column]) {
                    errors.push({ row, column });
                }
            }
        }
        return errors;
    }

    public findConflicts(row: number, column: number, value: number): Conflict[] {
        return this.conflictDetector.findConflicts(this.getCurrentBoard(), row, column, value);
    }

    private snapshot(): void {
        this.history.save(this._puzzle);
    }

    private removeNoteFromPeers(row: number, column: number, value: number): void {
        // 同行
        for (let peerColumn = 0; peerColumn < BOARD_SIZE; peerColumn++) {
            if (peerColumn !== column) this._puzzle[row][peerColumn].removeNote(value);
        }
        // 同列
        for (let peerRow = 0; peerRow < BOARD_SIZE; peerRow++) {
            if (peerRow !== row) this._puzzle[peerRow][column].removeNote(value);
        }
        // 同宮
        const boxRowStart = Math.floor(row / BOX_SIZE) * BOX_SIZE;
        const boxColStart = Math.floor(column / BOX_SIZE) * BOX_SIZE;
        for (let boxRow = boxRowStart; boxRow < boxRowStart + BOX_SIZE; boxRow++) {
            for (let boxColumn = boxColStart; boxColumn < boxColStart + BOX_SIZE; boxColumn++) {
                if (boxRow !== row || boxColumn !== column) this._puzzle[boxRow][boxColumn].removeNote(value);
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
