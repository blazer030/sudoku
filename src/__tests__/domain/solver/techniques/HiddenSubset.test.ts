import { BoardState } from "@/domain/solver/BoardState";
import { HiddenSubset } from "@/domain/solver/techniques/HiddenSubset";

describe("HiddenSubset", () => {
    it("should not match a pair when one digit has no candidates anywhere in the scope", () => {
        let state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        state = state.assign(0, 3, 2);
        state = state.assign(0, 4, 1);
        state = state.assign(0, 6, 7);
        state = state.assign(0, 7, 6);
        state = state.assign(0, 8, 3);
        state = state.eliminate(0, 0, 4);
        state = state.eliminate(0, 0, 5);
        state = state.eliminate(0, 5, 5);
        state = state.eliminate(0, 5, 8);

        const step = new HiddenSubset(2).find(state);

        if (step !== null) {
            for (const focusCell of step.focus) {
                const candidates = state.candidatesOf(focusCell.row, focusCell.column);
                const eliminatedDigits = step.eliminations
                    .filter((elimination) =>
                        elimination.cell.row === focusCell.row
                        && elimination.cell.column === focusCell.column,
                    )
                    .map((elimination) => elimination.digit);
                const remainingCount = candidates.filter(
                    (digit) => !eliminatedDigits.includes(digit),
                ).length;
                expect(remainingCount).toBeGreaterThanOrEqual(2);
            }
        }
    });


    it("should find a hidden pair in a column and eliminate other candidates from the pair cells", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 2, 0, 0, 0, 0],
            [4, 0, 0, 0, 0, 0, 0, 0, 0],
            [5, 0, 0, 0, 0, 0, 0, 0, 0],
            [6, 0, 0, 0, 0, 0, 0, 0, 0],
            [7, 0, 0, 0, 0, 0, 0, 0, 0],
            [8, 0, 0, 0, 0, 0, 0, 0, 0],
            [9, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new HiddenSubset(2).find(state);

        expect(step).toEqual({
            technique: "hiddenPair",
            focus: [
                { row: 0, column: 0 },
                { row: 1, column: 0 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 0 }, digit: 3 },
                { cell: { row: 1, column: 0 }, digit: 3 },
            ],
            scopes: [{ kind: "column", column: 0 }],
        });
    });

    it("should find a hidden pair in a box and eliminate other candidates from the pair cells", () => {
        const puzzle: number[][] = [
            [0, 0, 4, 0, 0, 0, 0, 0, 0],
            [5, 6, 7, 0, 0, 0, 0, 0, 0],
            [8, 0, 9, 1, 2, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new HiddenSubset(2).find(state);

        expect(step).toEqual({
            technique: "hiddenPair",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 0 }, digit: 3 },
                { cell: { row: 0, column: 1 }, digit: 3 },
            ],
            scopes: [{ kind: "box", boxRow: 0, boxColumn: 0 }],
        });
    });

    it("should return null when no hidden subset exists in the board", () => {
        const emptyPuzzle: number[][] = Array.from({ length: 9 }, () =>
            Array<number>(9).fill(0),
        );
        const state = BoardState.fromPuzzle(emptyPuzzle);

        const step = new HiddenSubset(2).find(state);

        expect(step).toBeNull();
    });

    it("should find a hidden triple in a row and eliminate other candidates from the triple cells", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 4, 5, 6, 8, 9, 0],
            [0, 0, 0, 0, 0, 0, 1, 2, 3],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new HiddenSubset(3).find(state);

        expect(step).toEqual({
            technique: "hiddenTriple",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
                { row: 0, column: 2 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 0 }, digit: 7 },
                { cell: { row: 0, column: 1 }, digit: 7 },
                { cell: { row: 0, column: 2 }, digit: 7 },
            ],
            scopes: [{ kind: "row", row: 0 }],
        });
    });

    it("should find a hidden pair in a row and eliminate other candidates from the pair cells", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 4, 5, 6, 7, 8, 9],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 2, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);

        const step = new HiddenSubset(2).find(state);

        expect(step).toEqual({
            technique: "hiddenPair",
            focus: [
                { row: 0, column: 0 },
                { row: 0, column: 1 },
            ],
            assignments: [],
            eliminations: [
                { cell: { row: 0, column: 0 }, digit: 3 },
                { cell: { row: 0, column: 1 }, digit: 3 },
            ],
            scopes: [{ kind: "row", row: 0 }],
        });
    });
});
