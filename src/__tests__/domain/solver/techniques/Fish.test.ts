import { BoardState } from "@/domain/solver/BoardState";
import { Fish } from "@/domain/solver/techniques/Fish";

describe("Fish", () => {
    it("should eliminate digit from columns when two rows share the same candidate pair of columns", () => {
        let state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        for (const column of [1, 2, 3, 5, 6, 7, 8]) {
            state = state.eliminate(0, column, 1);
            state = state.eliminate(4, column, 1);
        }

        const step = new Fish(2).find(state);

        expect(step).toEqual({
            technique: "xWing",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 4 },
                { row: 4, column: 0 },
                { row: 4, column: 4 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 1, column: 0 }, digit: 1 },
                { cell: { row: 2, column: 0 }, digit: 1 },
                { cell: { row: 3, column: 0 }, digit: 1 },
                { cell: { row: 5, column: 0 }, digit: 1 },
                { cell: { row: 6, column: 0 }, digit: 1 },
                { cell: { row: 7, column: 0 }, digit: 1 },
                { cell: { row: 8, column: 0 }, digit: 1 },
                { cell: { row: 1, column: 4 }, digit: 1 },
                { cell: { row: 2, column: 4 }, digit: 1 },
                { cell: { row: 3, column: 4 }, digit: 1 },
                { cell: { row: 5, column: 4 }, digit: 1 },
                { cell: { row: 6, column: 4 }, digit: 1 },
                { cell: { row: 7, column: 4 }, digit: 1 },
                { cell: { row: 8, column: 4 }, digit: 1 },
            ],
            scopes: [
                { kind: "row", row: 0 },
                { kind: "row", row: 4 },
                { kind: "column", column: 0 },
                { kind: "column", column: 4 },
            ],
        });
    });

    it("should eliminate digit from rows when two columns share the same candidate pair of rows", () => {
        let state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        for (const row of [1, 2, 3, 5, 6, 7, 8]) {
            state = state.eliminate(row, 0, 2);
            state = state.eliminate(row, 4, 2);
        }

        const step = new Fish(2).find(state);

        expect(step).toEqual({
            technique: "xWing",
            focus: [
                { row: 0, column: 0 },
                { row: 4, column: 0 },
                { row: 0, column: 4 },
                { row: 4, column: 4 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 1 }, digit: 2 },
                { cell: { row: 0, column: 2 }, digit: 2 },
                { cell: { row: 0, column: 3 }, digit: 2 },
                { cell: { row: 0, column: 5 }, digit: 2 },
                { cell: { row: 0, column: 6 }, digit: 2 },
                { cell: { row: 0, column: 7 }, digit: 2 },
                { cell: { row: 0, column: 8 }, digit: 2 },
                { cell: { row: 4, column: 1 }, digit: 2 },
                { cell: { row: 4, column: 2 }, digit: 2 },
                { cell: { row: 4, column: 3 }, digit: 2 },
                { cell: { row: 4, column: 5 }, digit: 2 },
                { cell: { row: 4, column: 6 }, digit: 2 },
                { cell: { row: 4, column: 7 }, digit: 2 },
                { cell: { row: 4, column: 8 }, digit: 2 },
            ],
            scopes: [
                { kind: "column", column: 0 },
                { kind: "column", column: 4 },
                { kind: "row", row: 0 },
                { kind: "row", row: 4 },
            ],
        });
    });

    it("should return null when no fish pattern exists", () => {
        const state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );

        const step = new Fish(2).find(state);

        expect(step).toBeNull();
    });
});
