import { BoardState } from "@/domain/solver/BoardState";
import { XYZWing } from "@/domain/solver/techniques/XYZWing";

describe("XYZWing", () => {
    it("should eliminate Z from cells seeing all of pivot {X,Y,Z}, pincer {X,Z}, pincer {Y,Z}", () => {
        let state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        for (const digit of [4, 5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 0, digit);
        }
        for (const digit of [2, 4, 5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 3, digit);
        }
        for (const digit of [1, 4, 5, 6, 7, 8, 9]) {
            state = state.eliminate(2, 0, digit);
        }

        const step = new XYZWing().find(state);

        expect(step).toEqual({
            technique: "xyzWing",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 3 },
                { row: 2, column: 0 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 1 }, digit: 3 },
                { cell: { row: 0, column: 2 }, digit: 3 },
            ],
            scopes: [],
        });
    });

    it("should return null when no XYZ-Wing pattern exists", () => {
        const state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );

        const step = new XYZWing().find(state);

        expect(step).toBeNull();
    });
});
