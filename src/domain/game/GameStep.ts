export interface CellSnapshot {
    entry: number;
    notes: number[];
}

export type GameStepAction = "fill" | "erase" | "toggleNote" | "autoNotes" | "undo" | "hint";

export interface GameStep {
    board: CellSnapshot[][];
    action: GameStepAction;
    row: number;
    column: number;
    value: number;
}
