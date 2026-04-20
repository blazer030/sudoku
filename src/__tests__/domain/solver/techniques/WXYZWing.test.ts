import { BoardState } from "@/domain/solver/BoardState";
import { WXYZWing } from "@/domain/solver/techniques/WXYZWing";

describe("WXYZWing", () => {
    it("should return null when no WXYZ-Wing pattern exists", () => {
        const state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );

        const step = new WXYZWing().find(state);

        expect(step).toBeNull();
    });

    it("should return null when three pincers do not share a common Z digit", () => {
        let state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        for (const digit of [5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 0, digit);
        }
        for (const digit of [3, 4, 5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 1, digit);
        }
        for (const digit of [1, 4, 5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 2, digit);
        }
        for (const digit of [1, 2, 5, 6, 7, 8, 9]) {
            state = state.eliminate(1, 0, digit);
        }

        const step = new WXYZWing().find(state);

        expect(step).toBeNull();
    });

    it("should eliminate Z from cells seeing pivot {W,X,Y,Z} and three pincers {W,Z}, {X,Z}, {Y,Z}", () => {
        let state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        for (const digit of [5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 0, digit);
        }
        for (const digit of [2, 3, 5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 1, digit);
        }
        for (const digit of [1, 3, 5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 2, digit);
        }
        for (const digit of [1, 2, 5, 6, 7, 8, 9]) {
            state = state.eliminate(1, 0, digit);
        }

        const step = new WXYZWing().find(state);

        expect(step).toEqual({
            technique: "wxyzWing",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
                { row: 0, column: 2 },
                { row: 1, column: 0 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 1, column: 1 }, digit: 4 },
                { cell: { row: 1, column: 2 }, digit: 4 },
                { cell: { row: 2, column: 0 }, digit: 4 },
                { cell: { row: 2, column: 1 }, digit: 4 },
                { cell: { row: 2, column: 2 }, digit: 4 },
            ],
            scopes: [],
        });
    });
});
