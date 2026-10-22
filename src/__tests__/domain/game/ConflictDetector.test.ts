import { ConflictDetector } from "@/domain/game/ConflictDetector";
import { knownPuzzle } from "@/__tests__/fixtures/knownPuzzle";

const findConflicts = (row: number, column: number, value: number) =>
    new ConflictDetector().findConflicts(knownPuzzle, row, column, value);

describe("ConflictDetector.findConflicts", () => {
    it("should find nothing when the digit repeats nowhere in its row, column or box", () => {
        // (0, 2) is empty and 4 is its answer
        expect(findConflicts(0, 2, 4)).toEqual([]);
    });

    it("should find the same digit in the row", () => {
        // 5 at (0, 2) repeats the clue 5 at (0, 0)
        expect(findConflicts(0, 2, 5)).toContainEqual({ row: 0, column: 0 });
    });

    it("should find the same digit in the column", () => {
        // 9 at (1, 1) repeats the clue 9 at (2, 1)
        expect(findConflicts(1, 1, 9)).toContainEqual({ row: 2, column: 1 });
    });

    it("should find the same digit in the box", () => {
        // 6 at (0, 2) repeats the clue 6 at (1, 0), in the same box
        expect(findConflicts(0, 2, 6)).toContainEqual({ row: 1, column: 0 });
    });

    it("should find every repeat across row, column and box once", () => {
        // 9 at (1, 1) repeats (1, 4) in its row and (2, 1) in its column
        const conflicts = findConflicts(1, 1, 9);

        expect(conflicts).toContainEqual({ row: 1, column: 4 });
        expect(conflicts).toContainEqual({ row: 2, column: 1 });
        expect(conflicts).toHaveLength(2);
    });
});
