import { afterEach, describe, expect, it, vi } from "vitest";
import { Sudoku } from "@/domain/game/Sudoku";
import { createKnownSudoku, knownAnswer, knownPuzzle, spyGeneratePuzzle } from "@/__tests__/fixtures/knownPuzzle";

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

    it("should return empty array when there are no conflicts", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        // (0, 2) 是空格，填入 4（正確答案），同行/列/宮沒有 4
        const conflicts = sudoku.findConflicts(0, 2, 4);

        expect(conflicts).toEqual([]);
    });

    it("should return row conflicts when same number exists in the row", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        // (0, 2) 是空格，填入 5 → 與 (0, 0) 的 clue=5 衝突
        const conflicts = sudoku.findConflicts(0, 2, 5);

        expect(conflicts).toContainEqual({ row: 0, column: 0 });
    });

    it("should return column conflicts when same number exists in the column", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        // (1, 1) 是空格，填入 9 → 與 (2, 1) 的 clue=9 衝突
        const conflicts = sudoku.findConflicts(1, 1, 9);

        expect(conflicts).toContainEqual({ row: 2, column: 1 });
    });

    it("should return box conflicts when same number exists in the box", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        // (0, 2) 是空格，填入 6 → 與同宮 (1, 0) 的 clue=6 衝突
        const conflicts = sudoku.findConflicts(0, 2, 6);

        expect(conflicts).toContainEqual({ row: 1, column: 0 });
    });

    it("should return all conflicts across row, column, and box", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        // (1, 1) 是空格，填入 9
        // 行衝突：(1, 4) clue=9
        // 列衝突：(2, 1) clue=9
        const conflicts = sudoku.findConflicts(1, 1, 9);

        expect(conflicts).toContainEqual({ row: 1, column: 4 });
        expect(conflicts).toContainEqual({ row: 2, column: 1 });
        expect(conflicts).toHaveLength(2);
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

        it('should return conflict coordinates for row duplicates', () => {
            const sudoku = createKnownSudoku();

            // (0,0) clue=5，在 (0,2) 填入 5 → 行衝突
            sudoku.fill(0, 2, 5);

            const conflicts = sudoku.checkAllConflicts();

            expect(conflicts).toContainEqual({ row: 0, column: 0 });
            expect(conflicts).toContainEqual({ row: 0, column: 2 });
        });

        it('should return conflicts for column and box duplicates', () => {
            const sudoku = createKnownSudoku();

            // (2,1) clue=9，在 (1,1) 填入 9 → 列衝突 + (1,4) clue=9 行衝突
            sudoku.fill(1, 1, 9);

            const conflicts = sudoku.checkAllConflicts();

            expect(conflicts).toContainEqual({ row: 1, column: 1 });
            expect(conflicts).toContainEqual({ row: 2, column: 1 });
            expect(conflicts).toContainEqual({ row: 1, column: 4 });
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
