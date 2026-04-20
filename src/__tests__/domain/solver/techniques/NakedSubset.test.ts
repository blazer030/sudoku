import { BoardState } from "@/domain/solver/BoardState";
import { NakedSubset } from "@/domain/solver/techniques/NakedSubset";

describe("NakedSubset", () => {
    it("should find a naked triple in a row and eliminate the triple digits from other row cells", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 0, 5, 6, 7, 8, 9],
            [4, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new NakedSubset(3).find(state);

        expect(step).toEqual({
            technique: "nakedTriple",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
                { row: 0, column: 2 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 3 }, digit: 1 },
                { cell: { row: 0, column: 3 }, digit: 2 },
                { cell: { row: 0, column: 3 }, digit: 3 },
            ],
            scopes: [{ kind: "row", row: 0 }],
        });
    });

    it("should find a naked quad in a row and eliminate the quad digits from other row cells", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 0, 0, 6, 7, 8, 9],
            [5, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 5, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new NakedSubset(4).find(state);

        expect(step).toEqual({
            technique: "nakedQuad",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
                { row: 0, column: 2 },
                { row: 0, column: 3 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 4 }, digit: 1 },
                { cell: { row: 0, column: 4 }, digit: 2 },
                { cell: { row: 0, column: 4 }, digit: 3 },
                { cell: { row: 0, column: 4 }, digit: 4 },
            ],
            scopes: [{ kind: "row", row: 0 }],
        });
    });

    it("should return null when no naked pair exists in the board", () => {
        const emptyPuzzle: number[][] = Array.from({ length: 9 }, () =>
            Array<number>(9).fill(0),
        );
        const state = BoardState.fromPuzzle(emptyPuzzle);

        const step = new NakedSubset(2).find(state);

        expect(step).toBeNull();
    });

    it("should find a naked pair in a column and eliminate pair digits from other column cells", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 3, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 3, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [4, 0, 0, 0, 0, 0, 0, 0, 0],
            [5, 0, 0, 0, 0, 0, 0, 0, 0],
            [6, 0, 0, 0, 0, 0, 0, 0, 0],
            [7, 0, 0, 0, 0, 0, 0, 0, 0],
            [8, 0, 0, 0, 0, 0, 0, 0, 0],
            [9, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new NakedSubset(2).find(state);

        expect(step).toEqual({
            technique: "nakedPair",
            focus: [
                { row: 0, column: 0 },
                { row: 1, column: 0 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 2, column: 0 }, digit: 1 },
                { cell: { row: 2, column: 0 }, digit: 2 },
            ],
            scopes: [{ kind: "column", column: 0 }],
        });
    });

    it("should find a naked pair in a box and eliminate pair digits from other box cells", () => {
        const puzzle: number[][] = [
            [0, 4, 5, 0, 0, 3, 0, 0, 0],
            [6, 0, 7, 0, 0, 0, 0, 0, 0],
            [8, 9, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 3, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new NakedSubset(2).find(state);

        expect(step).toEqual({
            technique: "nakedPair",
            focus: [
                { row: 0, column: 0 },
                { row: 1, column: 1 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 2, column: 2 }, digit: 1 },
                { cell: { row: 2, column: 2 }, digit: 2 },
            ],
            scopes: [{ kind: "box", boxRow: 0, boxColumn: 0 }],
        });
    });

    it("should find a naked pair in a row and eliminate pair digits from other row cells", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 4, 5, 6, 7, 8, 9],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [3, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 3, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new NakedSubset(2).find(state);

        expect(step).toEqual({
            technique: "nakedPair",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 2 }, digit: 1 },
                { cell: { row: 0, column: 2 }, digit: 2 },
            ],
            scopes: [{ kind: "row", row: 0 }],
        });
    });
});
