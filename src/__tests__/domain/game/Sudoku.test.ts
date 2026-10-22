import { afterEach, describe, expect, it, vi } from "vitest";
import { Sudoku } from "@/domain/game/Sudoku";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";
import { createKnownSudoku, knownAnswer, knownPuzzle, spyGeneratePuzzle } from "@/__tests__/fixtures/knownPuzzle";
import { createMultiStepSudoku } from "@/__tests__/fixtures/multiStepPuzzle";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("Sudoku", () => {
    it("should correctly check answers against the solution", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        expect(sudoku.check(0, 0, 5)).toBe(true);
        expect(sudoku.check(0, 0, 3)).toBe(false);
    });

    it("should allow inputting a number into a slot cell", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");
        const puzzle = sudoku.puzzle;

        // (0, 2) 是空格，填入 4
        sudoku.fill(0, 2, 4);

        expect(puzzle[0][2].entry).toBe(4);
    });

    it("should return true when all cells are correctly filled", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (knownPuzzle[row][column] === 0) {
                    sudoku.fill(row, column, knownAnswer[row][column]);
                }
            }
        }

        expect(sudoku.isCompleted()).toBe(true);
    });

    it("should return false when there are empty cells", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        // 不填任何數字
        expect(sudoku.isCompleted()).toBe(false);
    });

    it("should fill candidate notes for all empty cells with autoNotes", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");
        const puzzle = sudoku.puzzle;

        sudoku.autoNotes();

        // (0, 2) 是空格，答案是 4，候選數字不應包含同行/列/宮已有的數字
        // 行 0: [5, 3, _, _, 7, _, _, _, _] → 有 5, 3, 7
        // 列 2: [_, _, 8, _, _, _, _, _, _] → 有 8
        // 宮 (0,0): [5, 3, _, 6, _, _, _, 9, 8] → 有 5, 3, 6, 9, 8
        // 候選：1-9 排除 {3, 5, 6, 7, 8, 9} = {1, 2, 4}
        expect(puzzle[0][2].notes).toEqual(expect.arrayContaining([1, 2, 4]));
        expect(puzzle[0][2].notes).toHaveLength(3);
    });

    it("should not clear existing notes when calling autoNotes again", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");
        const puzzle = sudoku.puzzle;

        sudoku.autoNotes();
        const notesBefore = [...puzzle[0][2].notes];

        sudoku.autoNotes();

        expect(puzzle[0][2].notes).toEqual(notesBefore);
    });

    it("should remove note from peers when inputting a number", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");
        const puzzle = sudoku.puzzle;

        // 先 autoNotes 填入候選筆記
        sudoku.autoNotes();

        // (0, 2) 候選 [1, 2, 4]，(0, 3) 候選包含某些數字
        // 填入 4 到 (0, 2)，同行同宮的空白格中的 4 應被移除
        sudoku.fill(0, 2, 4);

        // (0, 3) 在同一行，其 notes 不應再包含 4
        expect(puzzle[0][3].notes).not.toContain(4);
        // (0, 5) 在同一行，其 notes 不應再包含 4
        expect(puzzle[0][5].notes).not.toContain(4);
    });

    it("should keep peer notes when autoRemoveNotes is false", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");
        const puzzle = sudoku.puzzle;

        sudoku.autoNotes();

        // (0, 5) 在同一行，autoNotes 後其 notes 應包含 4
        expect(puzzle[0][5].notes).toContain(4);

        sudoku.fill(0, 2, 4, { autoRemoveNotes: false });

        // autoRemoveNotes 為 false 時，peer 的 notes 不應被移除
        expect(puzzle[0][5].notes).toContain(4);
    });

    it("should not overwrite existing notes or inputs with autoNotes", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");
        const puzzle = sudoku.puzzle;

        // 先填入一個數字
        sudoku.fill(0, 2, 4);

        sudoku.autoNotes();

        // 已填入的格子不應被覆蓋
        expect(puzzle[0][2].entry).toBe(4);
        expect(puzzle[0][2].hasNotes).toBe(false);
    });

    it("should undo input and restore cell to empty", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");
        const puzzle = sudoku.puzzle;

        sudoku.fill(0, 2, 4);
        expect(puzzle[0][2].entry).toBe(4);

        sudoku.undo();

        expect(puzzle[0][2].entry).toBe(0);
    });

    it("should restore peer notes removed by input after undo", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");
        const puzzle = sudoku.puzzle;

        sudoku.autoNotes();
        const notesBefore03 = [...puzzle[0][3].notes];

        sudoku.fill(0, 2, 4);
        // peer (0, 3) 的 note 4 應被移除
        expect(puzzle[0][3].notes).not.toContain(4);

        sudoku.undo();

        expect(puzzle[0][3].notes).toEqual(notesBefore03);
    });

    it("should undo erase and restore input", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");
        const puzzle = sudoku.puzzle;

        sudoku.fill(0, 2, 4);
        expect(puzzle[0][2].entry).toBe(4);

        sudoku.erase(0, 2);
        expect(puzzle[0][2].entry).toBe(0);

        sudoku.undo();
        expect(puzzle[0][2].entry).toBe(4);
    });

    it("should undo toggleNote and restore notes", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");
        const puzzle = sudoku.puzzle;

        sudoku.toggleNote(0, 2, 4);
        expect(puzzle[0][2].notes).toContain(4);

        sudoku.undo();
        expect(puzzle[0][2].notes).not.toContain(4);
    });

    it("should undo autoNotes and restore all cells to previous state", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");
        const puzzle = sudoku.puzzle;

        // 確認 autoNotes 前所有 slot 都沒有 notes
        expect(puzzle[0][2].hasNotes).toBe(false);

        sudoku.autoNotes();
        expect(puzzle[0][2].hasNotes).toBe(true);

        sudoku.undo();
        expect(puzzle[0][2].hasNotes).toBe(false);
        expect(puzzle[0][2].notes).toEqual([]);
    });

    it("should not throw when undo with no history", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        expect(() => { sudoku.undo(); }).not.toThrow();
    });

    it("should return false when a cell has wrong input", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        // 填入所有正確答案，但最後一個故意填錯
        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (knownPuzzle[row][column] === 0) {
                    sudoku.fill(row, column, knownAnswer[row][column]);
                }
            }
        }
        // 把 (0, 2) 填入錯誤值（正確是 4，填 1）
        sudoku.fill(0, 2, 1);

        expect(sudoku.isCompleted()).toBe(false);
    });

    describe('checkAllConflicts', () => {
        it('should return empty array when no conflicts', () => {
            const sudoku = createKnownSudoku();

            // 填入正確答案，不會有衝突
            sudoku.fill(0, 2, 4);
            sudoku.fill(0, 3, 6);

            const conflicts = sudoku.checkAllConflicts();

            expect(conflicts).toEqual([]);
        });

        it("should return only the player cell for a clue duplicate", () => {
            const sudoku = createKnownSudoku();

            // (0,0) is the clue 5; 5 at (0,2) repeats it in row 0
            sudoku.fill(0, 2, 5);

            const conflicts = sudoku.checkAllConflicts();

            expect(conflicts).toEqual([{ row: 0, column: 2 }]);
        });

        it('should return conflicts for column and box duplicates', () => {
            const sudoku = createKnownSudoku();

            // 9 at (1,1) repeats the clue (2,1) in column 1 and box 0, and the clue (1,4) in row 1
            sudoku.fill(1, 1, 9);

            const conflicts = sudoku.checkAllConflicts();

            expect(conflicts).toEqual([{ row: 1, column: 1 }]);
        });

        it("should return both player cells when two entries repeat", () => {
            const sudoku = createKnownSudoku();

            sudoku.fill(0, 2, 4);
            sudoku.fill(0, 3, 4);

            const conflicts = sudoku.checkAllConflicts();

            expect(conflicts).toHaveLength(2);
            expect(conflicts).toContainEqual({ row: 0, column: 2 });
            expect(conflicts).toContainEqual({ row: 0, column: 3 });
        });
    });

    describe('checkErrors', () => {
        it('should return empty array when all entries are correct', () => {
            const sudoku = createKnownSudoku();

            sudoku.fill(0, 2, 4); // 正確答案
            sudoku.fill(0, 3, 6); // 正確答案

            const errors = sudoku.checkErrors();

            expect(errors).toEqual([]);
        });

        it('should return coordinates of incorrectly filled cells', () => {
            const sudoku = createKnownSudoku();

            sudoku.fill(0, 2, 5); // 錯誤，正確是 4
            sudoku.fill(0, 3, 6); // 正確

            const errors = sudoku.checkErrors();

            expect(errors).toEqual([{ row: 0, column: 2 }]);
        });
    });

    describe('revealRandomCell', () => {
        it('should reveal empty cell with correct answer', () => {
            const sudoku = createKnownSudoku();

            const result = sudoku.revealRandomCell();

            expect(result).not.toBeNull();
            if (!result) return;
            const { row, column } = result;
            expect(sudoku.puzzle[row][column].entry).toBe(knownAnswer[row][column]);
        });

        it('should correct wrongly filled cell when revealed', () => {
            const sudoku = createKnownSudoku();

            // 把所有空格都填錯
            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    if (knownPuzzle[row][column] === 0) {
                        const wrong = (knownAnswer[row][column] % 9) + 1;
                        sudoku.fill(row, column, wrong);
                    }
                }
            }

            const result = sudoku.revealRandomCell();

            expect(result).not.toBeNull();
            if (!result) return;
            const { row, column } = result;
            expect(sudoku.puzzle[row][column].entry).toBe(knownAnswer[row][column]);
        });

        it('should clear matching notes in peer cells when revealing', () => {
            const sudoku = createKnownSudoku();

            // (0,2) 是空格，答案是 4
            // 在同行的 (0,3) 和同列的 (1,2) 加上 note 4
            sudoku.toggleNote(0, 3, 4);
            sudoku.toggleNote(0, 3, 7);
            sudoku.toggleNote(1, 2, 4);
            sudoku.toggleNote(1, 2, 9);

            // 控制 Math.random 讓 reveal 選中 (0,2)（第一個候選格）
            vi.spyOn(Math, 'random').mockReturnValue(0);

            sudoku.revealRandomCell();

            // peer cells 的 note 4 應被移除，其他 notes 保留
            expect(sudoku.puzzle[0][3].notes).not.toContain(4);
            expect(sudoku.puzzle[0][3].notes).toContain(7);
            expect(sudoku.puzzle[1][2].notes).not.toContain(4);
            expect(sudoku.puzzle[1][2].notes).toContain(9);
        });

        it('should return null when all cells are correct or clues', () => {
            const sudoku = createKnownSudoku();

            // 填入所有正確答案
            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    if (knownPuzzle[row][column] === 0) {
                        sudoku.fill(row, column, knownAnswer[row][column]);
                    }
                }
            }

            const result = sudoku.revealRandomCell();

            expect(result).toBeNull();
        });
    });

    describe("planRevealHint", () => {
        const snapshotBoard = (sudoku: Sudoku) =>
            sudoku.puzzle.map(row => row.map(cell => ({ entry: cell.entry, notes: [...cell.notes] })));

        it("planRevealHint should point out the first wrong entry in reading order", () => {
            const sudoku = createKnownSudoku();
            sudoku.fill(4, 1, 9); // wrong, answer is 2
            sudoku.fill(1, 1, 1); // wrong, answer is 7
            sudoku.toggleNote(0, 2, 4);
            const before = snapshotBoard(sudoku);

            const plan = sudoku.planRevealHint();

            expect(plan).toEqual({ kind: "wrongEntry", cell: { row: 1, column: 1 } });
            expect(snapshotBoard(sudoku)).toEqual(before);
        });

        it("planRevealHint should return the steps to the next assignment when there are no errors", () => {
            const sudoku = createKnownSudoku();
            sudoku.fill(0, 2, 4);

            const plan = sudoku.planRevealHint();

            expect(plan.kind).toBe("steps");
            if (plan.kind !== "steps") return;
            const lastStep = plan.steps[plan.steps.length - 1].step;
            expect(lastStep.assignments[0]).toEqual({ cell: plan.target, digit: plan.digit });
            expect(plan.digit).toBe(knownAnswer[plan.target.row][plan.target.column]);
            expect(plan.steps[0].candidatesBefore[0][2]).toEqual([]);
            expect(plan.steps[0].candidatesBefore[0][0]).toEqual([]);
        });

        it("planRevealHint should record the candidates before each step", () => {
            const sudoku = createMultiStepSudoku();

            const plan = sudoku.planRevealHint();

            expect(plan.kind).toBe("steps");
            if (plan.kind !== "steps") return;
            expect(plan.steps.length).toBeGreaterThan(1);
            const [first, second] = plan.steps;
            for (const cell of first.step.focus) {
                expect(first.candidatesBefore[cell.row][cell.column].length).toBeGreaterThan(0);
            }
            const eliminated = first.step.eliminations[0];
            const { row, column } = eliminated.cell;
            expect(first.candidatesBefore[row][column]).toContain(eliminated.digit);
            expect(second.candidatesBefore[row][column]).not.toContain(eliminated.digit);
        });

        it("planRevealHint should ignore the player's notes", () => {
            const clean = createKnownSudoku();
            const noisy = createKnownSudoku();
            noisy.toggleNote(0, 2, 1);
            noisy.toggleNote(0, 2, 9);
            noisy.toggleNote(0, 3, 2);

            expect(noisy.planRevealHint()).toEqual(clean.planRevealHint());
        });

        it("planRevealHint should return noTechnique when the solver is stuck", () => {
            const sudoku = createKnownSudoku();
            vi.spyOn(TechniqueSolver.prototype, "stepsToNextAssignment").mockReturnValue([]);

            expect(sudoku.planRevealHint()).toEqual({ kind: "noTechnique" });
        });

        it("planRevealHint should return solved when no cell is left to fill", () => {
            const sudoku = createKnownSudoku();
            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    if (knownPuzzle[row][column] === 0) sudoku.fill(row, column, knownAnswer[row][column]);
                }
            }

            expect(sudoku.planRevealHint()).toEqual({ kind: "solved" });
        });
    });

    describe("applyRevealHint", () => {
        it("applyRevealHint should fill the target and only delete eliminated candidates from notes", () => {
            const sudoku = createKnownSudoku();
            sudoku.toggleNote(0, 3, 2);
            sudoku.toggleNote(0, 3, 7);
            sudoku.toggleNote(2, 0, 4);
            sudoku.toggleNote(2, 0, 2);

            sudoku.applyRevealHint(
                { row: 0, column: 2 },
                4,
                [
                    { cell: { row: 0, column: 3 }, digit: 2 },
                    { cell: { row: 2, column: 0 }, digit: 7 }, // not in the notes
                    { cell: { row: 1, column: 1 }, digit: 3 }, // no notes at all
                ],
                { autoRemoveNotes: false },
            );

            expect(sudoku.puzzle[0][2].entry).toBe(4);
            expect(sudoku.puzzle[0][3].notes).toEqual([7]);
            expect(sudoku.puzzle[2][0].notes).toEqual([4, 2]);
            expect(sudoku.puzzle[1][1].notes).toEqual([]);
        });

        it("applyRevealHint should honour autoRemoveNotes", () => {
            const build = () => {
                const sudoku = createKnownSudoku();
                sudoku.toggleNote(0, 3, 4); // same row
                sudoku.toggleNote(1, 2, 4); // same column
                sudoku.toggleNote(2, 0, 4); // same box
                return sudoku;
            };

            const enabled = build();
            enabled.applyRevealHint({ row: 0, column: 2 }, 4, [], { autoRemoveNotes: true });
            expect(enabled.puzzle[0][3].notes).toEqual([]);
            expect(enabled.puzzle[1][2].notes).toEqual([]);
            expect(enabled.puzzle[2][0].notes).toEqual([]);

            const disabled = build();
            disabled.applyRevealHint({ row: 0, column: 2 }, 4, [], { autoRemoveNotes: false });
            expect(disabled.puzzle[0][3].notes).toEqual([4]);
            expect(disabled.puzzle[1][2].notes).toEqual([4]);
            expect(disabled.puzzle[2][0].notes).toEqual([4]);
        });

        it("undo after applyRevealHint should restore the board and notes", () => {
            const sudoku = createKnownSudoku();
            sudoku.toggleNote(0, 3, 2);
            sudoku.toggleNote(0, 3, 4);

            sudoku.applyRevealHint({ row: 0, column: 2 }, 4, [{ cell: { row: 0, column: 3 }, digit: 2 }]);
            sudoku.undo();

            expect(sudoku.puzzle[0][2].entry).toBe(0);
            expect(sudoku.puzzle[0][3].notes).toEqual([2, 4]);
        });
    });

    describe("findCompletedGroups", () => {
        it("should return empty cells when row is not complete", () => {
            const sudoku = createKnownSudoku();
            sudoku.fill(0, 2, 4);
            const result = sudoku.findCompletedGroups(0, 2);
            expect(result.cells).toEqual([]);
        });

        it("should return row cells when row is fully correct", () => {
            const sudoku = createKnownSudoku();
            // Row 0 empty: 2→4, 3→6, 5→8, 6→9, 7→1, 8→2
            sudoku.fill(0, 2, 4);
            sudoku.fill(0, 3, 6);
            sudoku.fill(0, 5, 8);
            sudoku.fill(0, 6, 9);
            sudoku.fill(0, 7, 1);
            sudoku.fill(0, 8, 2);

            const result = sudoku.findCompletedGroups(0, 8);

            expect(result.cells).toEqual(expect.arrayContaining([
                { row: 0, column: 0 }, { row: 0, column: 1 }, { row: 0, column: 2 },
                { row: 0, column: 3 }, { row: 0, column: 4 }, { row: 0, column: 5 },
                { row: 0, column: 6 }, { row: 0, column: 7 }, { row: 0, column: 8 },
            ]));
            expect(result.cells.filter(c => c.row === 0)).toHaveLength(9);
        });

        it("should return column cells when column is fully correct", () => {
            const sudoku = createKnownSudoku();
            // Column 4 empty: row2→4, row4→5, row6→3
            sudoku.fill(2, 4, 4);
            sudoku.fill(4, 4, 5);
            sudoku.fill(6, 4, 3);

            const result = sudoku.findCompletedGroups(6, 4);

            expect(result.cells).toEqual(expect.arrayContaining([
                { row: 0, column: 4 }, { row: 1, column: 4 }, { row: 2, column: 4 },
                { row: 3, column: 4 }, { row: 4, column: 4 }, { row: 5, column: 4 },
                { row: 6, column: 4 }, { row: 7, column: 4 }, { row: 8, column: 4 },
            ]));
            expect(result.cells.filter(c => c.column === 4)).toHaveLength(9);
        });

        it("should return box cells when box is fully correct", () => {
            const sudoku = createKnownSudoku();
            // Box (0,0): (0,2)→4, (1,1)→7, (1,2)→2, (2,0)→1
            sudoku.fill(0, 2, 4);
            sudoku.fill(1, 1, 7);
            sudoku.fill(1, 2, 2);
            sudoku.fill(2, 0, 1);

            const result = sudoku.findCompletedGroups(2, 0);

            expect(result.cells).toEqual(expect.arrayContaining([
                { row: 0, column: 0 }, { row: 0, column: 1 }, { row: 0, column: 2 },
                { row: 1, column: 0 }, { row: 1, column: 1 }, { row: 1, column: 2 },
                { row: 2, column: 0 }, { row: 2, column: 1 }, { row: 2, column: 2 },
            ]));
        });

        it("should deduplicate cells when row and column complete simultaneously", () => {
            const sudoku = createKnownSudoku();
            // Fill row 0 (except (0,8)) and column 8 (except (0,8))
            sudoku.fill(0, 2, 4);
            sudoku.fill(0, 3, 6);
            sudoku.fill(0, 5, 8);
            sudoku.fill(0, 6, 9);
            sudoku.fill(0, 7, 1);
            sudoku.fill(1, 8, 8);
            sudoku.fill(2, 8, 7);
            sudoku.fill(6, 8, 4);
            // (0,8)→2 completes both row 0 and column 8
            sudoku.fill(0, 8, 2);

            const result = sudoku.findCompletedGroups(0, 8);

            const uniqueKeys = new Set(result.cells.map(c => `${c.row},${c.column}`));
            expect(uniqueKeys.size).toBe(17); // 9 + 9 - 1 shared
        });

        it("should return empty when cell has wrong value even if all filled", () => {
            const sudoku = createKnownSudoku();
            // Fill row 0 but with wrong value at (0,8)
            sudoku.fill(0, 2, 4);
            sudoku.fill(0, 3, 6);
            sudoku.fill(0, 5, 8);
            sudoku.fill(0, 6, 9);
            sudoku.fill(0, 7, 1);
            sudoku.fill(0, 8, 3); // Wrong! Should be 2

            const result = sudoku.findCompletedGroups(0, 8);

            expect(result.cells).toEqual([]);
        });
    });

    it('should include hintTracker in Sudoku instance', () => {
        const sudoku = createKnownSudoku();

        expect(sudoku.hintTracker).toBeDefined();
        expect(sudoku.hintTracker.totalUsed).toBe(0);
        expect(sudoku.hintTracker.canUseHint).toBe(true);
    });
});
