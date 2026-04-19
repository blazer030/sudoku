import { BoardState } from "@/domain/solver/BoardState";
import { Pointing } from "@/domain/solver/techniques/Pointing";

describe("Pointing", () => {
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
        });
    });
});
