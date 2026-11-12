import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { boardStateOf, snapshotOf, stateOf } from "@/domain/board/cellState";

const cellWith = (entry: number, notes: number[]): PuzzleCell => PuzzleCell.fromState({ clue: 0, entry, notes });

describe("cellState", () => {
    it("should rebuild a cell from its saved state, and save it back the same", () => {
        const saved = { clue: 0, entry: 0, notes: [2, 7] };

        expect(stateOf(PuzzleCell.fromState(saved))).toEqual(saved);
        expect(stateOf(PuzzleCell.fromState({ clue: 4, entry: 0, notes: [] }))).toEqual({ clue: 4, entry: 0, notes: [] });
    });

    it("should copy the notes, so a later note leaves the copy as it was", () => {
        const cell = cellWith(0, [1]);
        const snapshot = snapshotOf(cell);
        const board = boardStateOf([[cell]]);

        cell.toggleNote(5);

        expect(snapshot.notes).toEqual([1]);
        expect(board[0][0].notes).toEqual([1]);
    });
});
