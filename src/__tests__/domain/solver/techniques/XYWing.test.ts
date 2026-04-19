import { BoardState } from "@/domain/solver/BoardState";
import { XYWing } from "@/domain/solver/techniques/XYWing";

describe("XYWing", () => {
    it("should eliminate Z from cells seeing both pincers when pivot {X,Y} has pincers {X,Z} and {Y,Z}", () => {
        let state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        for (const digit of [3, 4, 5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 0, digit);
        }
        for (const digit of [2, 4, 5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 5, digit);
        }
        for (const digit of [1, 4, 5, 6, 7, 8, 9]) {
            state = state.eliminate(4, 0, digit);
        }

        const step = new XYWing().find(state);

        expect(step).toEqual({
            technique: "xyWing",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 5 },
                { row: 4, column: 0 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 4, column: 5 }, digit: 3 },
            ],
            scopes: [],
        });
    });
});
