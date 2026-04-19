import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { SudokuBoard } from "@/domain/board/SudokuBoard";
import { BoardHistory } from "@/domain/game/BoardHistory";
import { Conflict, ConflictDetector } from "@/domain/game/ConflictDetector";
import { HintTracker } from "@/domain/game/HintTracker";
import { RevealOutcome } from "@/domain/game/RevealOutcome";
import { Difficulty, SudokuGenerator } from "@/domain/generator/SudokuGenerator";
import { BoardState } from "@/domain/solver/BoardState";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";

export interface CompletedCells {
    cells: { row: number; column: number }[];
}

export class Sudoku {
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

    public findCompletedGroups(row: number, column: number): CompletedCells {
        const cells: { row: number; column: number }[] = [];
        const seen = new Set<string>();

        const addCell = (cellRow: number, cellColumn: number) => {
            const key = `${cellRow},${cellColumn}`;
            if (!seen.has(key)) {
                seen.add(key);
                cells.push({ row: cellRow, column: cellColumn });
            }
        };

        if (this.isRowComplete(row)) {
            for (let columnIndex = 0; columnIndex < BOARD_SIZE; columnIndex++) addCell(row, columnIndex);
        }

        if (this.isColumnComplete(column)) {
            for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex++) addCell(rowIndex, column);
        }

        if (this.isBoxComplete(row, column)) {
            const boxRowStart = Math.floor(row / BOX_SIZE) * BOX_SIZE;
            const boxColStart = Math.floor(column / BOX_SIZE) * BOX_SIZE;
            for (let boxRow = boxRowStart; boxRow < boxRowStart + BOX_SIZE; boxRow++) {
                for (let boxColumn = boxColStart; boxColumn < boxColStart + BOX_SIZE; boxColumn++) {
                    addCell(boxRow, boxColumn);
                }
            }
        }

        return { cells };
    }

    private isRowComplete(row: number): boolean {
        return this._puzzle[row].every((cell, columnIndex) => {
            const value = cell.isClue ? cell.clue : cell.entry;
            return value === this._answer[row][columnIndex];
        });
    }

    private isColumnComplete(column: number): boolean {
        return this._puzzle.every((puzzleRow, rowIndex) => {
            const cell = puzzleRow[column];
            const value = cell.isClue ? cell.clue : cell.entry;
            return value === this._answer[rowIndex][column];
        });
    }

    private isBoxComplete(row: number, column: number): boolean {
        const boxRowStart = Math.floor(row / BOX_SIZE) * BOX_SIZE;
        const boxColStart = Math.floor(column / BOX_SIZE) * BOX_SIZE;
        for (let boxRow = boxRowStart; boxRow < boxRowStart + BOX_SIZE; boxRow++) {
            for (let boxColumn = boxColStart; boxColumn < boxColStart + BOX_SIZE; boxColumn++) {
                const cell = this._puzzle[boxRow][boxColumn];
                const value = cell.isClue ? cell.clue : cell.entry;
                if (value !== this._answer[boxRow][boxColumn]) return false;
            }
        }
        return true;
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

    public fill(row: number, column: number, value: number, options?: { autoRemoveNotes?: boolean }): void {
        this.snapshot();
        this._puzzle[row][column].entry = value;
        if (value > 0 && (options?.autoRemoveNotes ?? true)) {
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
        return this.conflictDetector.findAllConflicts(this._puzzle, this.getCurrentBoard());
    }

    public revealCellWithTechnique(): RevealOutcome | null {
        const state = BoardState.fromPuzzle(this.buildEffectiveNumberBoard());
        const step = new TechniqueSolver().nextAssignment(state);
        if (step !== null && step.assignments.length > 0) {
            const { cell, digit } = step.assignments[0];
            this.snapshot();
            this._puzzle[cell.row][cell.column].entry = digit;
            this.removeNoteFromPeers(cell.row, cell.column, digit);
            return { cell, value: digit, step, fallback: false };
        }

        const target = this.revealRandomCell();
        if (target === null) return null;
        return {
            cell: { row: target.row, column: target.column },
            value: this._answer[target.row][target.column],
            step: null,
            fallback: true,
        };
    }

    private buildEffectiveNumberBoard(): number[][] {
        const board: number[][] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            const rowValues: number[] = [];
            for (let column = 0; column < BOARD_SIZE; column++) {
                const cell = this._puzzle[row][column];
                if (cell.isClue) {
                    rowValues.push(cell.clue);
                } else if (cell.hasEntry && cell.entry === this._answer[row][column]) {
                    rowValues.push(cell.entry);
                } else {
                    rowValues.push(0);
                }
            }
            board.push(rowValues);
        }
        return board;
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
        const value = this._answer[target.row][target.column];
        this._puzzle[target.row][target.column].entry = value;
        this.removeNoteFromPeers(target.row, target.column, value);
        return target;
    }

    public checkErrors(): Conflict[] {
        return this.conflictDetector.findErrors(this._puzzle, this._answer);
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

