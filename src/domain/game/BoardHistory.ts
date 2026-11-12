import { BOARD_SIZE } from "@/domain/board/constants";
import { PuzzleCell } from "@/domain/board/PuzzleCell";

import { snapshotOf, type CellSnapshot } from "@/domain/board/cellState";

type BoardSnapshot = CellSnapshot[][];

export class BoardHistory {
    private _history: BoardSnapshot[] = [];

    public save(puzzle: PuzzleCell[][]): void {
        this._history.push(
            puzzle.map(row => row.map(snapshotOf))
        );
    }

    public restore(puzzle: PuzzleCell[][]): void {
        const snapshot = this._history.pop();
        if (!snapshot) return;
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                puzzle[row][column].restore(snapshot[row][column].entry, snapshot[row][column].notes);
            }
        }
    }
}
