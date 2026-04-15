import type { PuzzleCell } from "@/domain/board/PuzzleCell";
import type { GameStep, GameStepAction } from "@/domain/game/GameStep";

export class StepRecorder {
    private _steps: GameStep[] = [];

    public record(puzzle: PuzzleCell[][], action: GameStepAction, row: number, column: number, value: number): void {
        this._steps.push({
            board: puzzle.map(row => row.map(cell => ({ entry: cell.entry, notes: [...cell.notes] }))),
            action,
            row,
            column,
            value,
        });
    }

    public get steps(): GameStep[] {
        return [...this._steps];
    }
}
