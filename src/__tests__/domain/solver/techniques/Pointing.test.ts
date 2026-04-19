import { BoardState } from "@/domain/solver/BoardState";
import { Pointing } from "@/domain/solver/techniques/Pointing";

describe("Pointing", () => {
    it("should eliminate a digit from a column outside a box when it is confined to one column inside the box", () => {
        const puzzle: number[][] = [
            [0, 2, 3, 0, 0, 0, 0, 0, 0],
            [0, 4, 5, 0, 0, 0, 0, 0, 0],
            [0, 6, 7, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new Pointing().find(state);

        expect(step).toEqual({
            technique: "pointing",
            focus: [
                { row: 0, column: 0 },
                { row: 1, column: 0 },
                { row: 2, column: 0 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 3, column: 0 }, digit: 1 },
                { cell: { row: 4, column: 0 }, digit: 1 },
                { cell: { row: 5, column: 0 }, digit: 1 },
                { cell: { row: 6, column: 0 }, digit: 1 },
                { cell: { row: 7, column: 0 }, digit: 1 },
                { cell: { row: 8, column: 0 }, digit: 1 },
            ],
            scopes: [
                { kind: "box", boxRow: 0, boxColumn: 0 },
                { kind: "column", column: 0 },
            ],
        });
    });

    it("should return null when no pointing opportunity exists", () => {
        const emptyPuzzle: number[][] = Array.from({ length: 9 }, () =>
            Array<number>(9).fill(0),
        );
        const state = BoardState.fromPuzzle(emptyPuzzle);

        const step = new Pointing().find(state);

        expect(step).toBeNull();
    });

    it("should eliminate a digit from a row outside a box when it is confined to one row inside the box", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [2, 3, 4, 0, 0, 0, 0, 0, 0],
            [5, 6, 7, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new Pointing().find(state);

        expect(step).toEqual({
            technique: "pointing",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
                { row: 0, column: 2 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 3 }, digit: 1 },
                { cell: { row: 0, column: 4 }, digit: 1 },
                { cell: { row: 0, column: 5 }, digit: 1 },
                { cell: { row: 0, column: 6 }, digit: 1 },
                { cell: { row: 0, column: 7 }, digit: 1 },
                { cell: { row: 0, column: 8 }, digit: 1 },
            ],
            scopes: [
                { kind: "box", boxRow: 0, boxColumn: 0 },
                { kind: "row", row: 0 },
            ],
        });
    });
});
