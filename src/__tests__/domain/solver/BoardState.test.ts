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

    it("should return the digit for a filled cell", () => {
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

        expect(state.valueAt(0, 0)).toBe(1);
    });

    it("should return 0 for an empty cell", () => {
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

        expect(state.valueAt(0, 1)).toBe(0);
    });

    it("should update value and clear candidates after assign", () => {
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

        const updated = state.assign(0, 0, 1);

        expect(updated.valueAt(0, 0)).toBe(1);
        expect(updated.candidatesOf(0, 0)).toEqual([]);
    });

    it("should remove assigned digit from peer candidates", () => {
        const puzzle: number[][] = Array.from({ length: 9 }, () =>
            Array<number>(9).fill(0),
        );
        const state = BoardState.fromPuzzle(puzzle);

        const updated = state.assign(0, 0, 5);

        expect(updated.candidatesOf(0, 4)).not.toContain(5);
        expect(updated.candidatesOf(4, 0)).not.toContain(5);
        expect(updated.candidatesOf(1, 1)).not.toContain(5);
    });
});
