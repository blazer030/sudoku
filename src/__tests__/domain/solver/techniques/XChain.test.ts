import { BoardState } from "@/domain/solver/BoardState";
import { XChain } from "@/domain/solver/techniques/XChain";

const emptyBoard = (): number[][] =>
    Array.from({ length: 9 }, () => Array<number>(9).fill(0));

describe("XChain", () => {
    it("should eliminate digit from cells seeing both ends of a strong-weak-strong chain", () => {
        let state = BoardState.fromPuzzle(emptyBoard());
        for (const column of [1, 2, 3, 4, 6, 7, 8]) {
            state = state.eliminate(0, column, 1);
        }
        for (const column of [0, 2, 3, 4, 6, 7, 8]) {
            state = state.eliminate(2, column, 1);
        }

        const step = new XChain().find(state);

        expect(step).toEqual({
            technique: "xChain",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 5 },
                { row: 2, column: 5 },
                { row: 2, column: 1 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 1, column: 0 }, digit: 1 },
                { cell: { row: 1, column: 1 }, digit: 1 },
                { cell: { row: 1, column: 2 }, digit: 1 },
            ],
            scopes: [],
            chainLinks: [
                { from: { row: 0, column: 0 }, to: { row: 0, column: 5 }, digit: 1, type: "strong" },
                { from: { row: 0, column: 5 }, to: { row: 2, column: 5 }, digit: 1, type: "weak" },
                { from: { row: 2, column: 5 }, to: { row: 2, column: 1 }, digit: 1, type: "strong" },
            ],
        });
    });
});
