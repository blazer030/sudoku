import { BoardState } from "@/domain/solver/BoardState";
import { NakedSubset } from "@/domain/solver/techniques/NakedSubset";

describe("NakedSubset", () => {
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
        });
    });
});
