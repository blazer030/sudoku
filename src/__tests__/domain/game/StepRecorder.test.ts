import { describe, expect, it } from "vitest";
import { StepRecorder } from "@/domain/game/StepRecorder";
import { PuzzleCell } from "@/domain/board/PuzzleCell";

const createPuzzle = (): PuzzleCell[][] =>
    Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new PuzzleCell(0))
    );

describe("StepRecorder", () => {
    it("should start with empty steps", () => {
        const recorder = new StepRecorder();
        expect(recorder.steps).toEqual([]);
    });

    it("should record a step with board snapshot and action", () => {
        const recorder = new StepRecorder();
        const puzzle = createPuzzle();
        puzzle[2][4].entry = 6;

        recorder.record(puzzle, "fill", 2, 4, 6);

        expect(recorder.steps).toHaveLength(1);
        expect(recorder.steps[0].action).toBe("fill");
        expect(recorder.steps[0].row).toBe(2);
        expect(recorder.steps[0].column).toBe(4);
        expect(recorder.steps[0].value).toBe(6);
        expect(recorder.steps[0].board[2][4].entry).toBe(6);
    });

    it("should record multiple steps in order", () => {
        const recorder = new StepRecorder();
        const puzzle = createPuzzle();

        puzzle[0][0].entry = 1;
        recorder.record(puzzle, "fill", 0, 0, 1);

        puzzle[1][1].entry = 2;
        recorder.record(puzzle, "fill", 1, 1, 2);

        expect(recorder.steps).toHaveLength(2);
        expect(recorder.steps[0].board[0][0].entry).toBe(1);
        expect(recorder.steps[0].board[1][1].entry).toBe(0);
        expect(recorder.steps[1].board[0][0].entry).toBe(1);
        expect(recorder.steps[1].board[1][1].entry).toBe(2);
    });
});
