import { BoardState } from "@/domain/solver/BoardState";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";
import { singlesPuzzle, singlesSolution } from "@/__tests__/fixtures/singlesPuzzle";

describe("TechniqueSolver", () => {
    it("nextStep should find the first applicable technique", () => {
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
        const solver = new TechniqueSolver();

        const step = solver.nextStep(state);

        expect(step).toEqual({
            technique: "nakedSingle",
            focus: [{ row: 0, column: 0 }],
            assignments: [
                { cell: { row: 0, column: 0 }, digit: 1 },
            ],
        });
    });

    it("solveWithTechniques should solve a singles-only puzzle", () => {
        const state = BoardState.fromPuzzle(singlesPuzzle);
        const solver = new TechniqueSolver();

        const result = solver.solveWithTechniques(state);

        expect(result.solved).toBe(true);
        expect(result.stuck).toBe(false);
        expect(result.steps.length).toBeGreaterThan(0);
        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                expect(result.finalState.valueAt(row, column)).toBe(singlesSolution[row][column]);
            }
        }
    });
});
