import { BoardState } from "@/domain/solver/BoardState";
import { HiddenSubset } from "@/domain/solver/techniques/HiddenSubset";

describe("HiddenSubset", () => {
    it("should find a hidden pair in a column and eliminate other candidates from the pair cells", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 2, 0, 0, 0, 0],
            [4, 0, 0, 0, 0, 0, 0, 0, 0],
            [5, 0, 0, 0, 0, 0, 0, 0, 0],
            [6, 0, 0, 0, 0, 0, 0, 0, 0],
            [7, 0, 0, 0, 0, 0, 0, 0, 0],
            [8, 0, 0, 0, 0, 0, 0, 0, 0],
            [9, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new HiddenSubset(2).find(state);

        expect(step).toEqual({
            technique: "hiddenPair",
            focus: [
                { row: 0, column: 0 },
                { row: 1, column: 0 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 0 }, digit: 3 },
                { cell: { row: 1, column: 0 }, digit: 3 },
            ],
        });
    });

    it("should find a hidden pair in a box and eliminate other candidates from the pair cells", () => {
        const puzzle: number[][] = [
            [0, 0, 4, 0, 0, 0, 0, 0, 0],
            [5, 6, 7, 0, 0, 0, 0, 0, 0],
            [8, 0, 9, 1, 2, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new HiddenSubset(2).find(state);

        expect(step).toEqual({
            technique: "hiddenPair",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 0 }, digit: 3 },
                { cell: { row: 0, column: 1 }, digit: 3 },
            ],
        });
    });

    it("should return null when no hidden subset exists in the board", () => {
        const emptyPuzzle: number[][] = Array.from({ length: 9 }, () =>
            Array<number>(9).fill(0),
        );
        const state = BoardState.fromPuzzle(emptyPuzzle);

        const step = new HiddenSubset(2).find(state);

        expect(step).toBeNull();
    });

    it("should find a hidden triple in a row and eliminate other candidates from the triple cells", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 4, 5, 6, 8, 9, 0],
            [0, 0, 0, 0, 0, 0, 1, 2, 3],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new HiddenSubset(3).find(state);

        expect(step).toEqual({
            technique: "hiddenTriple",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
                { row: 0, column: 2 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 0 }, digit: 7 },
                { cell: { row: 0, column: 1 }, digit: 7 },
                { cell: { row: 0, column: 2 }, digit: 7 },
            ],
        });
    });

    it("should find a hidden pair in a row and eliminate other candidates from the pair cells", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 4, 5, 6, 7, 8, 9],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 2, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new HiddenSubset(2).find(state);

        expect(step).toEqual({
            technique: "hiddenPair",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 0 }, digit: 3 },
                { cell: { row: 0, column: 1 }, digit: 3 },
            ],
        });
    });
});
