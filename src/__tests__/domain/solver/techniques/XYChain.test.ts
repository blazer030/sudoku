import { BoardState } from "@/domain/solver/BoardState";
import { XYChain } from "@/domain/solver/techniques/XYChain";

const emptyBoard = (): number[][] =>
    Array.from({ length: 9 }, () => Array<number>(9).fill(0));

describe("XYChain", () => {
    it("should return null when there are no bivalue cells", () => {
        const state = BoardState.fromPuzzle(emptyBoard());

        const step = new XYChain().find(state);

        expect(step).toBeNull();
    });

    it("should return null when a single bivalue cell cannot start a chain", () => {
        let state = BoardState.fromPuzzle(emptyBoard());
        for (const digit of [3, 4, 5, 6, 7, 8, 9]) state = state.eliminate(0, 0, digit);

        const step = new XYChain().find(state);

        expect(step).toBeNull();
    });

    it("should eliminate digit Z from cells seeing both ends of a bivalue chain", () => {
        let state = BoardState.fromPuzzle(emptyBoard());
        for (const digit of [3, 4, 5, 6, 7, 8, 9]) state = state.eliminate(0, 0, digit);
        for (const digit of [1, 4, 5, 6, 7, 8, 9]) state = state.eliminate(0, 5, digit);
        for (const digit of [2, 3, 5, 6, 7, 8, 9]) state = state.eliminate(5, 0, digit);
        for (const digit of [1, 2, 5, 6, 7, 8, 9]) state = state.eliminate(5, 5, digit);

        const step = new XYChain().find(state);

        expect(step).toEqual({
            technique: "xyChain",
            focus: [
                { row: 0, column: 0 },
                { row: 5, column: 0 },
                { row: 5, column: 5 },
                { row: 0, column: 5 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 1 }, digit: 2 },
                { cell: { row: 0, column: 2 }, digit: 2 },
                { cell: { row: 0, column: 3 }, digit: 2 },
                { cell: { row: 0, column: 4 }, digit: 2 },
                { cell: { row: 0, column: 6 }, digit: 2 },
                { cell: { row: 0, column: 7 }, digit: 2 },
                { cell: { row: 0, column: 8 }, digit: 2 },
            ],
            scopes: [],
            chainLinks: [
                { from: { row: 0, column: 0 }, to: { row: 5, column: 0 }, digit: 1, type: "strong" },
                { from: { row: 5, column: 0 }, to: { row: 5, column: 5 }, digit: 4, type: "strong" },
                { from: { row: 5, column: 5 }, to: { row: 0, column: 5 }, digit: 3, type: "strong" },
            ],
        });
    });
});
