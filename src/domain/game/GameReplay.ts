import { PuzzleCell } from "@/domain/board/PuzzleCell";
import type { GameStep } from "@/domain/game/GameStep";

// 與 application/GameState 的 CellState 結構相同，但 domain 層不可引入 application 層
interface InitialCell {
    clue: number;
    entry: number;
    notes: number[];
}

export class GameReplay {
    private readonly _initialBoard: InitialCell[][];
    private readonly _steps: GameStep[];
    private _currentStep = 0;

    public constructor(initialBoard: InitialCell[][], steps: GameStep[]) {
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
        return this._initialBoard.map(row =>
            row.map(cell => {
                const puzzleCell = new PuzzleCell(cell.clue);
                puzzleCell.restore(cell.entry, cell.notes);
                return puzzleCell;
            })
        );
    }

    private buildBoardFromStep(step: GameStep): PuzzleCell[][] {
        return this._initialBoard.map((row, rowIndex) =>
            row.map((cell, columnIndex) => {
                const puzzleCell = new PuzzleCell(cell.clue);
                const snapshot = step.board[rowIndex][columnIndex];
                puzzleCell.restore(snapshot.entry, snapshot.notes);
                return puzzleCell;
            })
        );
    }
}
