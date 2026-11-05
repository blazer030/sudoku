import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, type EffectScope } from "vue";
import { StepRecorder } from "@/domain/game/StepRecorder";
import type { CompletedCells, Sudoku } from "@/domain/game/Sudoku";
import { createKnownSudoku, knownAnswer, knownPuzzle } from "@/__tests__/fixtures/knownPuzzle";
import { useSingleNoteFill } from "@/presentation/pages/game/useSingleNoteFill";

const WRONG_FOR_0_2 = 1;

// Notes the cell with one digit each; the known puzzle's (0, 2) answers 4, (0, 3) answers 6, (1, 1) answers 7
const noteCells = (sudoku: Sudoku, cells: readonly (readonly [number, number, number])[]) => {
    for (const [row, column, digit] of cells) sudoku.toggleNote(row, column, digit);
};

const emptyCellsOfRow = (row: number) =>
    knownPuzzle[row].flatMap((value, column) => value === 0 ? [column] : []);

let scope: EffectScope;

const setup = (sudoku: Sudoku, { motion = true, autoRemove = true } = {}) => {
    const stepRecorder = new StepRecorder();
    const checkAndComplete = vi.fn();
    const onGroupCompleted = vi.fn<(completed: CompletedCells, origin: { row: number; column: number }) => void>();
    const run = scope.run(() => useSingleNoteFill({
        sudoku,
        stepRecorder,
        autoRemoveNotes: () => autoRemove,
        motionAllowed: () => motion,
        checkAndComplete,
        onGroupCompleted,
    }));
    if (run === undefined) throw new Error("the scope did not run");
    return { run, stepRecorder, checkAndComplete, onGroupCompleted };
};

beforeEach(() => {
    vi.useFakeTimers();
    scope = effectScope();
});

afterEach(() => {
    scope.stop();
    vi.useRealTimers();
});

describe("useSingleNoteFill", () => {
    describe("what a run fills", () => {
        it("should stop a chain after one round", () => {
            const sudoku = createKnownSudoku();
            noteCells(sudoku, [[0, 2, 5], [0, 3, 3], [0, 3, 5]]);
            const { run } = setup(sudoku, { motion: false });

            run.start();

            expect(sudoku.puzzle[0][2].entry).toBe(5);
            expect(sudoku.puzzle[0][3].entry).toBe(0);
            expect(sudoku.puzzle[0][3].notes).toEqual([3]);
        });

        it("should fill two peers that hold the same single note", () => {
            const sudoku = createKnownSudoku();
            noteCells(sudoku, [[0, 2, 5], [0, 3, 5]]);
            const { run } = setup(sudoku, { motion: false });

            run.start();

            expect(sudoku.puzzle[0][2].entry).toBe(5);
            expect(sudoku.puzzle[0][3].entry).toBe(5);
        });

        it("should fill a wrong note without flagging anything", () => {
            const sudoku = createKnownSudoku();
            noteCells(sudoku, [[0, 2, WRONG_FOR_0_2]]);
            const { run } = setup(sudoku, { motion: false });

            run.start();

            expect(sudoku.puzzle[0][2].entry).toBe(WRONG_FOR_0_2);
        });

        it("should leave peer notes alone with Auto Remove Notes off", () => {
            const sudoku = createKnownSudoku();
            noteCells(sudoku, [[0, 2, 4], [0, 3, 4], [0, 3, 6]]);
            const { run } = setup(sudoku, { motion: false, autoRemove: false });

            run.start();

            expect(sudoku.puzzle[0][3].notes).toEqual([4, 6]);
        });

        it("should leave the board and history alone with nothing to fill", () => {
            const sudoku = createKnownSudoku();
            const { run, stepRecorder } = setup(sudoku, { motion: false });

            run.start();

            expect(stepRecorder.steps).toEqual([]);
            expect(run.running.value).toBe(false);
        });
    });

    describe("undo and the replay", () => {
        it("should restore the whole run with one undo", () => {
            const sudoku = createKnownSudoku();
            noteCells(sudoku, [[0, 2, 4], [0, 3, 6], [1, 1, 7], [1, 2, 2], [1, 2, 4]]);
            const { run } = setup(sudoku, { motion: false });
            run.start();

            sudoku.undo();

            expect(sudoku.puzzle[0][2].entry).toBe(0);
            expect(sudoku.puzzle[0][2].notes).toEqual([4]);
            expect(sudoku.puzzle[0][3].entry).toBe(0);
            expect(sudoku.puzzle[1][1].entry).toBe(0);
            expect(sudoku.puzzle[1][2].notes).toEqual([2, 4]);
        });

        it("should record each cell as its own fill step", () => {
            const sudoku = createKnownSudoku();
            noteCells(sudoku, [[0, 2, 4], [0, 3, 6]]);
            const { run, stepRecorder } = setup(sudoku, { motion: false });

            run.start();

            expect(stepRecorder.steps.map(({ action, row, column, value }) => ({ action, row, column, value }))).toEqual([
                { action: "fill", row: 0, column: 2, value: 4 },
                { action: "fill", row: 0, column: 3, value: 6 },
            ]);
        });
    });

    describe("timing", () => {
        it("should fill one cell every 60ms in reading order, with motion allowed", () => {
            const sudoku = createKnownSudoku();
            noteCells(sudoku, [[0, 2, 4], [0, 3, 6], [1, 1, 7]]);
            const { run } = setup(sudoku);

            run.start();
            expect(sudoku.puzzle[0][2].entry).toBe(4);
            expect(sudoku.puzzle[0][3].entry).toBe(0);
            expect(run.running.value).toBe(true);

            vi.advanceTimersByTime(59);
            expect(sudoku.puzzle[0][3].entry).toBe(0);
            vi.advanceTimersByTime(1);
            expect(sudoku.puzzle[0][3].entry).toBe(6);
            expect(sudoku.puzzle[1][1].entry).toBe(0);

            vi.advanceTimersByTime(60);
            expect(sudoku.puzzle[1][1].entry).toBe(7);
            expect(run.running.value).toBe(false);
        });

        it("should fill every cell at once with motion not allowed", () => {
            const sudoku = createKnownSudoku();
            noteCells(sudoku, [[0, 2, 4], [0, 3, 6], [1, 1, 7]]);
            const { run } = setup(sudoku, { motion: false });

            run.start();

            expect(sudoku.puzzle[1][1].entry).toBe(7);
            expect(run.running.value).toBe(false);
            expect(vi.getTimerCount()).toBe(0);
        });

        it("should ignore a second start during a run", () => {
            const sudoku = createKnownSudoku();
            noteCells(sudoku, [[0, 2, 4], [0, 3, 6]]);
            const { run, stepRecorder } = setup(sudoku);

            run.start();
            run.start();
            vi.advanceTimersByTime(60);

            expect(stepRecorder.steps).toHaveLength(2);
        });

        it("should finish at once when asked, with no timer left", () => {
            const sudoku = createKnownSudoku();
            noteCells(sudoku, [[0, 2, 4], [0, 3, 6], [1, 1, 7]]);
            const { run, checkAndComplete, stepRecorder } = setup(sudoku);
            run.start();

            run.finish();

            expect(sudoku.puzzle[1][1].entry).toBe(7);
            expect(stepRecorder.steps).toHaveLength(3);
            expect(checkAndComplete).toHaveBeenCalledOnce();
            expect(run.running.value).toBe(false);
            expect(vi.getTimerCount()).toBe(0);
        });

        it("should do nothing when asked to finish with no run going", () => {
            const { run, checkAndComplete } = setup(createKnownSudoku());

            run.finish();

            expect(checkAndComplete).not.toHaveBeenCalled();
        });

        it("should leave no timer behind when the screen goes away", () => {
            const sudoku = createKnownSudoku();
            noteCells(sudoku, [[0, 2, 4], [0, 3, 6]]);
            const { run } = setup(sudoku);
            run.start();

            scope.stop();

            expect(vi.getTimerCount()).toBe(0);
        });
    });

    describe("the merged group effect", () => {
        // Fills a row but for the cells a run is to fill, with their answers as notes
        const rowLeftForRun = (sudoku: Sudoku, row: number, runColumns: number[], digitOf = (column: number) => knownAnswer[row][column]) => {
            for (const column of emptyCellsOfRow(row)) {
                if (runColumns.includes(column)) sudoku.toggleNote(row, column, digitOf(column));
                else sudoku.fill(row, column, knownAnswer[row][column]);
            }
        };

        const fillBox = (sudoku: Sudoku, boxRow: number, boxColumn: number, except: readonly [number, number]) => {
            for (let row = boxRow; row < boxRow + 3; row++) {
                for (let column = boxColumn; column < boxColumn + 3; column++) {
                    if (knownPuzzle[row][column] !== 0 || (row === except[0] && column === except[1])) continue;
                    sudoku.fill(row, column, knownAnswer[row][column]);
                }
            }
        };

        it("should hold a row once when two cells of the run finish it", () => {
            const sudoku = createKnownSudoku();
            rowLeftForRun(sudoku, 0, [2, 3]);
            const { run, onGroupCompleted } = setup(sudoku, { motion: false });

            run.start();

            expect(onGroupCompleted).toHaveBeenCalledOnce();
            const [completed, origin] = onGroupCompleted.mock.calls[0];
            expect(completed.groups).toEqual([{ kind: "row", index: 0 }]);
            expect(completed.cells).toHaveLength(9);
            expect(origin).toEqual({ row: 0, column: 3 });
        });

        it("should hold a row, a column and a box when one cell finishes all three", () => {
            const sudoku = createKnownSudoku();
            const finishes = (row: number, column: number) => row === 0 || column === 3 || (row < 3 && column >= 3 && column < 6);
            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    const isTheRunsCell = row === 0 && column === 3;
                    if (knownPuzzle[row][column] === 0 && finishes(row, column) && !isTheRunsCell) sudoku.fill(row, column, knownAnswer[row][column]);
                }
            }
            sudoku.toggleNote(0, 3, knownAnswer[0][3]);
            const { run, onGroupCompleted } = setup(sudoku, { motion: false });

            run.start();

            expect(onGroupCompleted).toHaveBeenCalledOnce();
            const [completed, origin] = onGroupCompleted.mock.calls[0];
            expect(completed.groups).toEqual(expect.arrayContaining([{ kind: "row", index: 0 }, { kind: "column", index: 3 }, { kind: "box", index: 1 }]));
            expect(completed.groups).toHaveLength(3);
            expect(origin).toEqual({ row: 0, column: 3 });
        });

        it("should hold a row and, elsewhere, a box in one effect", () => {
            const sudoku = createKnownSudoku();
            rowLeftForRun(sudoku, 0, [2]);
            // Box 4 (the centre): every cell but (4, 4)
            fillBox(sudoku, 3, 3, [4, 4]);
            sudoku.toggleNote(4, 4, knownAnswer[4][4]);
            const { run, onGroupCompleted } = setup(sudoku, { motion: false });

            run.start();

            expect(onGroupCompleted).toHaveBeenCalledOnce();
            const [completed] = onGroupCompleted.mock.calls[0];
            expect(completed.groups).toEqual(expect.arrayContaining([{ kind: "row", index: 0 }, { kind: "box", index: 4 }]));
            expect(completed.groups).toHaveLength(2);
        });

        it("should wait for the end of the run before playing it", () => {
            const sudoku = createKnownSudoku();
            rowLeftForRun(sudoku, 0, [2, 3]);
            const { run, onGroupCompleted } = setup(sudoku);

            run.start();
            expect(onGroupCompleted).not.toHaveBeenCalled();

            vi.advanceTimersByTime(60);
            expect(onGroupCompleted).toHaveBeenCalledOnce();
        });

        it("should hold nothing for a row filled with a wrong digit", () => {
            const sudoku = createKnownSudoku();
            rowLeftForRun(sudoku, 0, [2], () => WRONG_FOR_0_2);
            const { run, onGroupCompleted } = setup(sudoku, { motion: false });

            run.start();

            expect(onGroupCompleted).not.toHaveBeenCalled();
        });

        it("should not play it when the run solves the board, and check completion once", () => {
            const sudoku = createKnownSudoku();
            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    if (knownPuzzle[row][column] !== 0) continue;
                    if (row === 8 && column >= 2 && column <= 3) sudoku.toggleNote(row, column, knownAnswer[row][column]);
                    else sudoku.fill(row, column, knownAnswer[row][column]);
                }
            }
            const { run, onGroupCompleted, checkAndComplete } = setup(sudoku, { motion: false });

            run.start();

            expect(sudoku.isCompleted()).toBe(true);
            expect(onGroupCompleted).not.toHaveBeenCalled();
            expect(checkAndComplete).toHaveBeenCalledOnce();
        });
    });
});
