import { BoardState } from "@/domain/solver/BoardState";
import { eliminationsSeenByAll } from "@/domain/solver/eliminations";

const emptyState = () => BoardState.fromPuzzle(Array.from({ length: 9 }, () => Array<number>(9).fill(0)));

describe("eliminationsSeenByAll", () => {
    it("should take the digit from every cell that sees all the seers, in reading order", () => {
        // R1C1 and R1C5 share row 1, so only the rest of row 1 sees both
        const eliminations = eliminationsSeenByAll(emptyState(), [{ row: 0, column: 0 }, { row: 0, column: 4 }], 7);

        expect(eliminations.map(({ cell }) => cell.column)).toEqual([1, 2, 3, 5, 6, 7, 8]);
        expect(eliminations.every(({ cell, digit }) => cell.row === 0 && digit === 7)).toBe(true);
    });

    it("should leave out the excluded cells and those without the digit", () => {
        const state = emptyState().eliminate(0, 2, 7);

        const eliminations = eliminationsSeenByAll(state, [{ row: 0, column: 0 }, { row: 0, column: 4 }], 7, [{ row: 0, column: 1 }]);

        expect(eliminations.map(({ cell }) => cell.column)).toEqual([3, 5, 6, 7, 8]);
    });
});
