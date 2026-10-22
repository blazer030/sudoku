import { BoardState } from "@/domain/solver/BoardState";
import { buildSolvePath } from "@/domain/solver/SolvePath";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";
import { singlesPuzzle, singlesSolution } from "@/__tests__/fixtures/singlesPuzzle";

describe("buildSolvePath", () => {
    it("should list the same steps as solveWithTechniques", () => {
        const expected = new TechniqueSolver().solveWithTechniques(BoardState.fromPuzzle(singlesPuzzle)).steps;

        expect(buildSolvePath(singlesPuzzle).map((entry) => entry.step)).toEqual(expected);
    });

    it("should record the board before each step", () => {
        const path = buildSolvePath(singlesPuzzle);

        expect(path[0].valuesBefore).toEqual(singlesPuzzle);
        expect(path[0].candidatesBefore).toEqual(BoardState.fromPuzzle(singlesPuzzle).candidateGrid());

        const { cell, digit } = path[0].step.assignments[0];
        expect(path[1].valuesBefore[cell.row][cell.column]).toBe(digit);
        expect(path[1].candidatesBefore[cell.row][cell.column]).toEqual([]);
    });

    it("should stop where no technique applies", () => {
        const emptyBoard = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

        expect(buildSolvePath(emptyBoard)).toEqual([]);
    });

    it("should return no steps for a solved board", () => {
        expect(buildSolvePath(singlesSolution)).toEqual([]);
    });
});
