import { BoardState } from "@/domain/solver/BoardState";
import { WWing } from "@/domain/solver/techniques/WWing";

describe("WWing", () => {
    it("should eliminate Y from cells seeing both bivalue endpoints when a strong link on X connects them", () => {
        let state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        for (const digit of [3, 4, 5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 0, digit);
            state = state.eliminate(4, 4, digit);
        }
        for (const column of [1, 2, 3, 5, 6, 7, 8]) {
            state = state.eliminate(2, column, 1);
        }

        const step = new WWing().find(state);

        expect(step).toEqual({
            technique: "wWing",
            focus: [
                { row: 0, column: 0 },
                { row: 4, column: 4 },
            ],
            supporters: [
                { row: 2, column: 0 },
                { row: 2, column: 4 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 4 }, digit: 2 },
                { cell: { row: 4, column: 0 }, digit: 2 },
            ],
            scopes: [{ kind: "row", row: 2 }],
        });
    });

    it("should return null when no W-Wing pattern exists", () => {
        const state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );

        const step = new WWing().find(state);

        expect(step).toBeNull();
    });

    it("should not match when bivalue endpoints see each other directly", () => {
        let state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        for (const digit of [3, 4, 5, 6, 7, 8, 9]) {
            state = state.eliminate(0, 0, digit);
            state = state.eliminate(0, 4, digit);
        }
        for (const column of [1, 2, 3, 5, 6, 7, 8]) {
            state = state.eliminate(2, column, 1);
        }

        const step = new WWing().find(state);

        expect(step).toBeNull();
    });
});
