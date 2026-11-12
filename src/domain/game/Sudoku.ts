import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { SudokuBoard } from "@/domain/board/SudokuBoard";
import { BoardHistory } from "@/domain/game/BoardHistory";
import { ConflictDetector } from "@/domain/game/ConflictDetector";
import { HintTracker } from "@/domain/game/HintTracker";
import { RevealHintPlan, RevealHintStep } from "@/domain/game/RevealHint";
import { BoardState } from "@/domain/solver/BoardState";
import { Elimination } from "@/domain/solver/SolveStep";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";
import { boxStart, boxIndexOf, type HouseKind } from "@/domain/board/geometry";
import type { CellReference } from "@/domain/board/CellReference";


/** A completed row, column or box; boxes are numbered from 0 at the top left, in reading order. */
export interface CompletedGroup {
    kind: HouseKind;
    index: number;
}

export interface CompletedCells {
    cells: CellReference[];
    groups: CompletedGroup[];
}

export class Sudoku {
    private _answer: number[][] = [];
    private _puzzle: PuzzleCell[][] = [];
    private history = new BoardHistory();
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

    public isCompleted(): boolean {
        return this._puzzle.every((puzzleRow, rowIndex) =>
            puzzleRow.every((cell, columnIndex) => {
                const value = cell.value;
                return value === this._answer[rowIndex][columnIndex];
            })
        );
    }

    public findCompletedGroups(row: number, column: number): CompletedCells {
        const cells: CellReference[] = [];
        const groups: CompletedGroup[] = [];
        const seen = new Set<string>();

        const addCell = (cellRow: number, cellColumn: number) => {
            const key = `${cellRow},${cellColumn}`;
            if (!seen.has(key)) {
                seen.add(key);
                cells.push({ row: cellRow, column: cellColumn });
            }
        };

        if (this.isRowComplete(row)) {
            groups.push({ kind: "row", index: row });
            for (let columnIndex = 0; columnIndex < BOARD_SIZE; columnIndex++) addCell(row, columnIndex);
        }

        if (this.isColumnComplete(column)) {
            groups.push({ kind: "column", index: column });
            for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex++) addCell(rowIndex, column);
        }

        if (this.isBoxComplete(row, column)) {
            const boxRowStart = boxStart(row);
            const boxColumnStart = boxStart(column);
            groups.push({ kind: "box", index: boxIndexOf(row, column) });
            for (let boxRow = boxRowStart; boxRow < boxRowStart + BOX_SIZE; boxRow++) {
                for (let boxColumn = boxColumnStart; boxColumn < boxColumnStart + BOX_SIZE; boxColumn++) {
                    addCell(boxRow, boxColumn);
                }
            }
        }

        return { cells, groups };
    }

    private isRowComplete(row: number): boolean {
        return this._puzzle[row].every((cell, columnIndex) => {
            const value = cell.value;
            return value === this._answer[row][columnIndex];
        });
    }

    private isColumnComplete(column: number): boolean {
        return this._puzzle.every((puzzleRow, rowIndex) => {
            const cell = puzzleRow[column];
            const value = cell.value;
            return value === this._answer[rowIndex][column];
        });
    }

    private isBoxComplete(row: number, column: number): boolean {
        const boxRowStart = boxStart(row);
        const boxColumnStart = boxStart(column);
        for (let boxRow = boxRowStart; boxRow < boxRowStart + BOX_SIZE; boxRow++) {
            for (let boxColumn = boxColumnStart; boxColumn < boxColumnStart + BOX_SIZE; boxColumn++) {
                const cell = this._puzzle[boxRow][boxColumn];
                const value = cell.value;
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
        this.fillInRun(row, column, value, options);
    }

    /** The cells showing exactly one note and no entry, in reading order. */
    public singleNoteCells(): { row: number; column: number; digit: number }[] {
        return this._puzzle.flatMap((puzzleRow, row) => puzzleRow.flatMap((cell, column) =>
            !cell.isClue && !cell.hasEntry && cell.notes.length === 1 ? [{ row, column, digit: cell.notes[0] }] : []));
    }

    /** Takes the one snapshot a run of fills undoes to; each fill then goes through `fillInRun`. */
    public beginFillRun(): void {
        this.snapshot();
    }

    public fillInRun(row: number, column: number, value: number, options?: { autoRemoveNotes?: boolean }): void {
        this._puzzle[row][column].entry = value;
        if (value > 0 && (options?.autoRemoveNotes ?? true)) {
            this.removeNoteFromPeers(row, column, value);
        }
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

    public checkAllConflicts(): CellReference[] {
        return this.conflictDetector.findAllConflicts(this._puzzle, this.getCurrentBoard());
    }

    public planRevealHint(): RevealHintPlan {
        const errors = this.checkErrors();
        if (errors.length > 0) return { kind: "wrongEntry", cell: errors[0] };

        const effectiveBoard = this.buildEffectiveNumberBoard();
        if (effectiveBoard.every(rowValues => rowValues.every(value => value > 0))) return { kind: "solved" };

        const initialState = BoardState.fromPuzzle(effectiveBoard);
        const solveSteps = new TechniqueSolver().stepsToNextAssignment(initialState);
        if (solveSteps.length === 0) return { kind: "noTechnique" };

        const steps: RevealHintStep[] = [];
        let currentState = initialState;
        for (const step of solveSteps) {
            steps.push({ step, candidatesBefore: currentState.candidateGrid() });
            currentState = currentState.apply(step);
        }
        const { cell, digit } = solveSteps[solveSteps.length - 1].assignments[0];
        return { kind: "steps", steps, target: cell, digit };
    }

    public applyRevealHint(
        target: CellReference,
        digit: number,
        eliminations: Elimination[],
        options?: { autoRemoveNotes?: boolean },
    ): void {
        this.snapshot();
        this._puzzle[target.row][target.column].entry = digit;
        if (options?.autoRemoveNotes ?? true) {
            this.removeNoteFromPeers(target.row, target.column, digit);
        }
        for (const elimination of eliminations) {
            this._puzzle[elimination.cell.row][elimination.cell.column].removeNote(elimination.digit);
        }
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

    public revealRandomCell(): CellReference | null {
        const candidates: CellReference[] = [];
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

    public checkErrors(): CellReference[] {
        return this.conflictDetector.findErrors(this._puzzle, this._answer);
    }

    private snapshot(): void {
        this.history.save(this._puzzle);
    }

    private removeNoteFromPeers(row: number, column: number, value: number): void {
        // The same row
        for (let peerColumn = 0; peerColumn < BOARD_SIZE; peerColumn++) {
            if (peerColumn !== column) this._puzzle[row][peerColumn].removeNote(value);
        }
        // The same column
        for (let peerRow = 0; peerRow < BOARD_SIZE; peerRow++) {
            if (peerRow !== row) this._puzzle[peerRow][column].removeNote(value);
        }
        // The same box
        const boxRowStart = boxStart(row);
        const boxColumnStart = boxStart(column);
        for (let boxRow = boxRowStart; boxRow < boxRowStart + BOX_SIZE; boxRow++) {
            for (let boxColumn = boxColumnStart; boxColumn < boxColumnStart + BOX_SIZE; boxColumn++) {
                if (boxRow !== row || boxColumn !== column) this._puzzle[boxRow][boxColumn].removeNote(value);
            }
        }
    }

    private getCurrentBoard(): number[][] {
        return this._puzzle.map(puzzleRow =>
            puzzleRow.map(cell => cell.value)
        );
    }
}

