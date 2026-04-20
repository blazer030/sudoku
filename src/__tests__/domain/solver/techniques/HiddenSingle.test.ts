import { BoardState } from "@/domain/solver/BoardState";
import { HiddenSingle } from "@/domain/solver/techniques/HiddenSingle";

describe("HiddenSingle", () => {
    it("should find a hidden single in a row", () => {
        const puzzle: number[][] = [
            [0, 2, 3, 4, 5, 6, 7, 8, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new HiddenSingle().find(state);

        expect(step).toEqual({
            technique: "hiddenSingle",
            focus: [{ row: 0, column: 0 }],
            assignments: [
                { cell: { row: 0, column: 0 }, digit: 1 },
            ],
            eliminations: [],
            scopes: [{ kind: "row", row: 0 }],
        });
    });

    it("should find a hidden single in a column", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [2, 0, 0, 0, 0, 0, 0, 0, 0],
            [3, 0, 0, 0, 0, 0, 0, 0, 0],
            [4, 0, 0, 0, 0, 0, 0, 0, 0],
            [5, 0, 0, 0, 0, 0, 0, 0, 0],
            [6, 0, 0, 0, 0, 0, 0, 0, 0],
            [7, 0, 0, 0, 0, 0, 0, 0, 0],
            [8, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new HiddenSingle().find(state);

        expect(step).toEqual({
            technique: "hiddenSingle",
            focus: [{ row: 0, column: 0 }],
            assignments: [
                { cell: { row: 0, column: 0 }, digit: 1 },
            ],
            eliminations: [],
            scopes: [{ kind: "column", column: 0 }],
        });
    });

    it("should find a hidden single when a digit is narrowed to a single cell across scopes", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new HiddenSingle().find(state);

        expect(step).toEqual({
            technique: "hiddenSingle",
            focus: [{ row: 4, column: 4 }],
            assignments: [
                { cell: { row: 4, column: 4 }, digit: 1 },
            ],
            eliminations: [],
            scopes: [{ kind: "row", row: 4 }],
        });
    });
});
