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
});
