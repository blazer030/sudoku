import { BoardState } from "@/domain/solver/BoardState";
import type { SolveStep } from "@/domain/solver/SolveStep";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";
import { singlesPuzzle, singlesSolution } from "@/__tests__/fixtures/singlesPuzzle";
import { SAMPLE_PUZZLES } from "@/presentation/pages/solver-walkthrough/samplePuzzles";

// Unique solution, but after its last assignment the solver finds two X-Chain eliminations and then stalls.
const stallingPuzzle: number[][] = [
    [0, 0, 0, 6, 7, 0, 9, 0, 0],
    [6, 7, 2, 1, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 0, 0, 0, 0, 0, 0, 0],
    [4, 0, 0, 0, 0, 0, 0, 0, 1],
    [7, 0, 3, 0, 0, 4, 0, 5, 6],
    [0, 0, 0, 5, 0, 7, 0, 0, 4],
    [0, 8, 0, 4, 0, 0, 6, 3, 5],
    [3, 0, 0, 0, 8, 0, 0, 0, 0],
];

afterEach(() => {
    vi.restoreAllMocks();
});

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
            eliminations: [],
            scopes: [],
        });
    });

    it("nextStep should find a naked pair when no singles are available", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 0, 5, 6, 7, 8, 9],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [3, 0, 0, 0, 0, 0, 0, 0, 0],
            [4, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 3, 0, 0, 0, 0, 0, 0, 0],
            [0, 4, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);
        const solver = new TechniqueSolver();

        const step = solver.nextStep(state);

        expect(step?.technique).toBe("nakedPair");
    });

    it("solveWithTechniques should apply eliminations from subset steps to progress state", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 0, 5, 6, 7, 8, 9],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [3, 0, 0, 0, 0, 0, 0, 0, 0],
            [4, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 3, 0, 0, 0, 0, 0, 0, 0],
            [0, 4, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const state = BoardState.fromPuzzle(puzzle);
        const solver = new TechniqueSolver();

        const result = solver.solveWithTechniques(state);

        expect(result.steps[0].technique).toBe("nakedPair");
        expect(result.finalState.candidatesOf(0, 2)).not.toContain(1);
        expect(result.finalState.candidatesOf(0, 2)).not.toContain(2);
    });

    it("nextStep should find an X-Wing when no simpler technique applies", () => {
        let state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        for (const column of [1, 2, 3, 5, 6, 7, 8]) {
            state = state.eliminate(0, column, 1);
            state = state.eliminate(4, column, 1);
        }
        const solver = new TechniqueSolver();

        const step = solver.nextStep(state);

        expect(step?.technique).toBe("xWing");
    });

    it("nextStep should find an XY-Wing when no simpler technique applies", () => {
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
        const solver = new TechniqueSolver();

        const step = solver.nextStep(state);

        expect(step?.technique).toBe("xyWing");
    });

    it("nextStep should find a W-Wing when no simpler technique applies", () => {
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
        const solver = new TechniqueSolver();

        const step = solver.nextStep(state);

        expect(step?.technique).toBe("wWing");
    });

    it("nextStep should find an XYZ-Wing when no simpler technique applies", () => {
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
        const solver = new TechniqueSolver();

        const step = solver.nextStep(state);

        expect(step?.technique).toBe("xyzWing");
    });

    it("nextAssignment should return the first step containing an assignment", () => {
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

        const step = solver.nextAssignment(state);

        expect(step?.technique).toBe("nakedSingle");
        expect(step?.assignments).toEqual([{ cell: { row: 0, column: 0 }, digit: 1 }]);
    });

    it("nextAssignment should advance past elimination-only steps to reach an assignment", () => {
        const puzzle: number[][] = [
            [0, 0, 0, 0, 0, 6, 7, 8, 9],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        let state = BoardState.fromPuzzle(puzzle);
        for (const digit of [3, 4, 5]) {
            state = state.eliminate(0, 0, digit);
            state = state.eliminate(0, 1, digit);
        }
        for (const digit of [4, 5]) {
            state = state.eliminate(0, 2, digit);
        }
        for (const digit of [1, 2]) {
            state = state.eliminate(0, 3, digit);
        }
        for (const digit of [1, 2, 3]) {
            state = state.eliminate(0, 4, digit);
        }
        const solver = new TechniqueSolver();

        const step = solver.nextAssignment(state);

        expect(step?.technique).toBe("nakedSingle");
        expect(step?.assignments).toEqual([{ cell: { row: 0, column: 2 }, digit: 3 }]);
    });

    it("nextAssignment should return null when the solver is stuck", () => {
        const state = BoardState.fromPuzzle(
            Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
        );
        const solver = new TechniqueSolver();

        const step = solver.nextAssignment(state);

        expect(step).toBeNull();
    });

    describe("stepsToNextAssignment", () => {
        it("should return only the assignment step when a single is available", () => {
            const state = BoardState.fromPuzzle(singlesPuzzle);

            const steps = new TechniqueSolver().stepsToNextAssignment(state);

            expect(steps).toHaveLength(1);
            expect(steps[0].assignments.length).toBeGreaterThan(0);
        });

        it("should return elimination steps before the assignment", () => {
            const hardPreset = SAMPLE_PUZZLES.find((preset) => preset.label === "Hard");
            if (!hardPreset) throw new Error("Hard preset missing");
            const hardPuzzle = hardPreset.puzzle;
            const solver = new TechniqueSolver();
            let state = BoardState.fromPuzzle(hardPuzzle);
            for (;;) {
                const step = solver.nextStep(state);
                if (step === null) throw new Error("no elimination-only step found");
                if (step.assignments.length === 0) break;
                for (const assignment of step.assignments) {
                    state = state.assign(assignment.cell.row, assignment.cell.column, assignment.digit);
                }
                for (const elimination of step.eliminations) {
                    state = state.eliminate(elimination.cell.row, elimination.cell.column, elimination.digit);
                }
            }

            const steps = solver.stepsToNextAssignment(state);

            expect(steps.length).toBeGreaterThan(1);
            for (const step of steps.slice(0, -1)) {
                expect(step.assignments).toHaveLength(0);
                expect(step.eliminations.length).toBeGreaterThan(0);
            }
            expect(steps[steps.length - 1].assignments.length).toBeGreaterThan(0);
        });

        it("should return an empty list when the solver stalls after some eliminations", () => {
            const solver = new TechniqueSolver();
            const initialState = BoardState.fromPuzzle(stallingPuzzle);
            const { steps, stuck } = solver.solveWithTechniques(initialState);
            const lastAssignmentIndex = steps.map((step) => step.assignments.length > 0).lastIndexOf(true);
            expect(stuck).toBe(true);
            expect(lastAssignmentIndex).toBeLessThan(steps.length - 1);
            let state = initialState;
            for (const step of steps.slice(0, lastAssignmentIndex + 1)) {
                for (const assignment of step.assignments) {
                    state = state.assign(assignment.cell.row, assignment.cell.column, assignment.digit);
                }
                for (const elimination of step.eliminations) {
                    state = state.eliminate(elimination.cell.row, elimination.cell.column, elimination.digit);
                }
            }

            expect(solver.stepsToNextAssignment(state)).toEqual([]);
        });

        it("should keep going through more than twenty elimination-only steps", () => {
            const solver = new TechniqueSolver();
            const eliminationStepCount = 25;
            let calls = 0;
            vi.spyOn(solver, "nextStep").mockImplementation((): SolveStep => {
                const cell = { row: Math.floor(calls / 9), column: calls % 9 };
                calls++;
                if (calls > eliminationStepCount) {
                    return { technique: "nakedSingle", focus: [cell], assignments: [{ cell, digit: 1 }], eliminations: [], scopes: [] };
                }
                return { technique: "pointing", focus: [], assignments: [], eliminations: [{ cell, digit: 1 }], scopes: [] };
            });
            const state = BoardState.fromPuzzle(Array.from({ length: 9 }, () => Array<number>(9).fill(0)));

            const steps = solver.stepsToNextAssignment(state);

            expect(steps).toHaveLength(eliminationStepCount + 1);
            expect(steps[eliminationStepCount].assignments).toHaveLength(1);
        });

        it("should return an empty list when no technique applies", () => {
            const state = BoardState.fromPuzzle(
                Array.from({ length: 9 }, () => Array<number>(9).fill(0)),
            );

            expect(new TechniqueSolver().stepsToNextAssignment(state)).toEqual([]);
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
