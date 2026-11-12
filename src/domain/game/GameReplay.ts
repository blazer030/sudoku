import type { CellState } from "@/domain/board/cellState";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import type { GameStep } from "@/domain/game/GameStep";

/** A game's moves as kept for Game Review: the board it started from and each step after. */
export interface GameReplayData {
    initialBoard: CellState[][];
    steps: GameStep[];
}

export class GameReplay {
    private readonly _initialBoard: CellState[][];
    private readonly _steps: GameStep[];
    private _currentStep = 0;

    public constructor(initialBoard: CellState[][], steps: GameStep[]) {
        this._initialBoard = initialBoard;
        this._steps = steps;
    }

    public get currentStep(): number {
        return this._currentStep;
    }

    public get totalSteps(): number {
        return this._steps.length;
    }

    public get board(): PuzzleCell[][] {
        if (this._currentStep === 0) {
            return this.buildBoardFromInitial();
        }
        return this.buildBoardFromStep(this._steps[this._currentStep - 1]);
    }

    public get currentGameStep(): GameStep | null {
        if (this._currentStep === 0) return null;
        return this._steps[this._currentStep - 1];
    }

    public next(): void {
        if (this._currentStep < this._steps.length) {
            this._currentStep++;
        }
    }

    public previous(): void {
        if (this._currentStep > 0) {
            this._currentStep--;
        }
    }

    public goToFirst(): void {
        this._currentStep = 0;
    }

    public goToLast(): void {
        this._currentStep = this._steps.length;
    }

    public goToStep(step: number): void {
        this._currentStep = Math.max(0, Math.min(step, this._steps.length));
    }

    private buildBoardFromInitial(): PuzzleCell[][] {
        return this._initialBoard.map(row => row.map(cell => PuzzleCell.fromState(cell)));
    }

    private buildBoardFromStep(step: GameStep): PuzzleCell[][] {
        return this._initialBoard.map((row, rowIndex) =>
            row.map((cell, columnIndex) => PuzzleCell.fromState({ clue: cell.clue, ...step.board[rowIndex][columnIndex] })));
    }
}
