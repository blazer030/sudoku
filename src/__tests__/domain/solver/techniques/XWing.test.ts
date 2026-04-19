import { BoardState } from "@/domain/solver/BoardState";
import { XWing } from "@/domain/solver/techniques/XWing";

describe("XWing", () => {
    it("should eliminate digit from columns when two rows share the same candidate pair of columns", () => {
        let state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        for (const column of [1, 2, 3, 5, 6, 7, 8]) {
            state = state.eliminate(0, column, 1);
            state = state.eliminate(4, column, 1);
        }

        const step = new XWing().find(state);

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
});
