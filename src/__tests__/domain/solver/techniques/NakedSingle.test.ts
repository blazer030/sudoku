import { BoardState } from "@/domain/solver/BoardState";
import { NakedSingle } from "@/domain/solver/techniques/NakedSingle";

describe("NakedSingle", () => {
    it("should find a naked single when a cell has exactly one candidate", () => {
        const puzzle: number[][] = [
            [0, 2, 3, 4, 5, 6, 7, 8, 9],
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

        const step = new NakedSingle().find(state);

        expect(step).toEqual({
            technique: "nakedSingle",
            assignments: [
                { cell: { row: 0, column: 0 }, digit: 1 },
            ],
        });
    });

    it("should return null when no cell has exactly one candidate", () => {
        const emptyPuzzle: number[][] = Array.from({ length: 9 }, () =>
            Array<number>(9).fill(0),
        );
        const state = BoardState.fromPuzzle(emptyPuzzle);

        const step = new NakedSingle().find(state);

        expect(step).toBeNull();
    });
});
