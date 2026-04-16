import { BoardState } from "@/domain/solver/BoardState";

describe("BoardState", () => {
    it("should initialize candidates for an empty cell with all digits except peer values", () => {
        const puzzle: number[][] = [
            [1, 0, 0, 0, 0, 0, 0, 0, 0],
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

        expect(state.candidatesOf(0, 1)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    });
});
