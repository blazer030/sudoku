import { BoardState } from "@/domain/solver/BoardState";
import { Claiming } from "@/domain/solver/techniques/Claiming";

describe("Claiming", () => {
    it("should eliminate a digit from a box outside a column when it is confined to one box within the column", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [2, 0, 0, 0, 0, 0, 0, 0, 0],
            [3, 0, 0, 0, 0, 0, 0, 0, 0],
            [4, 0, 0, 0, 0, 0, 0, 0, 0],
            [5, 0, 0, 0, 0, 0, 0, 0, 0],
            [6, 0, 0, 0, 0, 0, 0, 0, 0],
            [7, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new Claiming().find(state);

        expect(step).toEqual({
            technique: "claiming",
            focus: [
                { row: 0, column: 0 },
                { row: 1, column: 0 },
                { row: 2, column: 0 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 1 }, digit: 1 },
                { cell: { row: 0, column: 2 }, digit: 1 },
                { cell: { row: 1, column: 1 }, digit: 1 },
                { cell: { row: 1, column: 2 }, digit: 1 },
                { cell: { row: 2, column: 1 }, digit: 1 },
                { cell: { row: 2, column: 2 }, digit: 1 },
            ],
            scopes: [
                { kind: "column", column: 0 },
                { kind: "box", boxRow: 0, boxColumn: 0 },
            ],
        });
    });

    it("should return null when no claiming opportunity exists", () => {
        const emptyPuzzle: number[][] = Array.from({ length: 9 }, () =>
            Array<number>(9).fill(0),
        );
        const state = BoardState.fromPuzzle(emptyPuzzle);

        const step = new Claiming().find(state);

        expect(step).toBeNull();
    });

    it("should eliminate a digit from a box outside a row when it is confined to one box within the row", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 2, 3, 4, 5, 6, 7],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new Claiming().find(state);

        expect(step).toEqual({
            technique: "claiming",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
                { row: 0, column: 2 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 1, column: 0 }, digit: 1 },
                { cell: { row: 1, column: 1 }, digit: 1 },
                { cell: { row: 1, column: 2 }, digit: 1 },
                { cell: { row: 2, column: 0 }, digit: 1 },
                { cell: { row: 2, column: 1 }, digit: 1 },
                { cell: { row: 2, column: 2 }, digit: 1 },
            ],
            scopes: [
                { kind: "row", row: 0 },
                { kind: "box", boxRow: 0, boxColumn: 0 },
            ],
        });
    });
});
