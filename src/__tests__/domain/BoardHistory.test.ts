import { describe, expect, it } from "vitest";
import { BoardHistory } from "@/domain/BoardHistory";
import PuzzleCell from "@/domain/PuzzleCell";

const createPuzzle = (): PuzzleCell[][] => {
    return Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new PuzzleCell(0))
    );
};

describe("BoardHistory", () => {
    it("should save and restore a snapshot", () => {
        const history = new BoardHistory();
        const puzzle = createPuzzle();
        puzzle[0][0].entry = 5;

        history.save(puzzle);
        puzzle[0][0].entry = 3;

        history.restore(puzzle);

        expect(puzzle[0][0].entry).toBe(5);
    });

    it("should restore notes from snapshot", () => {
        const history = new BoardHistory();
        const puzzle = createPuzzle();
        puzzle[0][0].toggleNote(1);
        puzzle[0][0].toggleNote(2);

        history.save(puzzle);
        puzzle[0][0].clearNotes();

        history.restore(puzzle);

        expect(puzzle[0][0].notes).toEqual([1, 2]);
    });

    it("should do nothing when restoring with no history", () => {
        const history = new BoardHistory();
        const puzzle = createPuzzle();
        puzzle[0][0].entry = 5;

        history.restore(puzzle);

        expect(puzzle[0][0].entry).toBe(5);
    });

    it("should support multiple snapshots with LIFO order", () => {
        const history = new BoardHistory();
        const puzzle = createPuzzle();

        puzzle[0][0].entry = 1;
        history.save(puzzle);

        puzzle[0][0].entry = 2;
        history.save(puzzle);

        puzzle[0][0].entry = 3;

        history.restore(puzzle);
        expect(puzzle[0][0].entry).toBe(2);

        history.restore(puzzle);
        expect(puzzle[0][0].entry).toBe(1);
    });
});
