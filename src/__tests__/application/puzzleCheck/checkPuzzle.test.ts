import { describe, expect, it } from "vitest";
import { checkPuzzle } from "@/application/puzzleCheck/checkPuzzle";
import { buildSolvePath } from "@/domain/solver/SolvePath";
import { UNKNOWN_SOLUTION_COUNT } from "@/domain/generator/SudokuSolver";
import { singlesPuzzle } from "@/__tests__/fixtures/singlesPuzzle";
import { contradictorySparsePuzzle, openNoSolutionPuzzle } from "@/__tests__/fixtures/openPuzzles";

describe("checkPuzzle", () => {
    it("should count one solution and give the solve path for a unique puzzle", () => {
        const check = checkPuzzle(singlesPuzzle);

        expect(check.solutionCount).toBe(1);
        expect(check.path).toEqual(buildSolvePath(singlesPuzzle));
    });

    it("should skip the solve path when the puzzle has no solution", () => {
        const check = checkPuzzle(contradictorySparsePuzzle);

        expect(check).toEqual({ solutionCount: 0, path: [] });
    });

    it("should give up on the count, within the budget, for a puzzle too open to settle", () => {
        const check = checkPuzzle(openNoSolutionPuzzle);

        expect(check.solutionCount).toBe(UNKNOWN_SOLUTION_COUNT);
    });

    it("should hold only plain data, so it survives the trip back from a worker", () => {
        const check = checkPuzzle(singlesPuzzle);

        expect(structuredClone(check)).toEqual(check);
    });
});
