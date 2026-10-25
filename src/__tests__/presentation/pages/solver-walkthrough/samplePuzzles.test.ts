import { SudokuSolver } from "@/domain/generator/SudokuSolver";
import { BoardState } from "@/domain/solver/BoardState";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";
import { SAMPLE_PUZZLES, isSamplePuzzle } from "@/presentation/pages/solver-walkthrough/samplePuzzles";

describe("SAMPLE_PUZZLES", () => {
    it("should offer one sample per difficulty", () => {
        expect(SAMPLE_PUZZLES.map((sample) => sample.id)).toEqual(["easy", "medium", "hard"]);
    });

    it.each(SAMPLE_PUZZLES.map((sample) => [sample.id, sample.puzzle] as const))(
        "should have exactly one solution (%s)",
        (_, puzzle) => {
            expect(new SudokuSolver().countSolutions(puzzle, 2)).toBe(1);
        },
    );

    it("should let the solver finish the easy sample", () => {
        const easy = SAMPLE_PUZZLES.find((sample) => sample.id === "easy");
        if (!easy) throw new Error("expected the easy sample");

        expect(new TechniqueSolver().solveWithTechniques(BoardState.fromPuzzle(easy.puzzle)).solved).toBe(true);
    });

    describe("isSamplePuzzle", () => {
        it.each(SAMPLE_PUZZLES.map((sample) => [sample.id, sample.puzzle] as const))(
            "should recognise the %s sample",
            (_, puzzle) => {
                expect(isSamplePuzzle(puzzle)).toBe(true);
            },
        );

        it("should not recognise a sample with one extra digit", () => {
            const changed = SAMPLE_PUZZLES[0].puzzle.map((rowValues) => [...rowValues]);
            changed[0][0] = 5;

            expect(isSamplePuzzle(changed)).toBe(false);
        });

        it("should not recognise an empty board", () => {
            const empty = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

            expect(isSamplePuzzle(empty)).toBe(false);
        });
    });
});
