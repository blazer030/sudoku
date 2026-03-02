import { afterEach, describe, expect, it, vi } from "vitest";
import Sudoku from "@/domain/Sudoku";
import { knownAnswer, knownPuzzle, spyGeneratePuzzle } from "@/__tests__/fixtures/knownPuzzle";

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
        const puzzle = sudoku.generate("easy");

        // (0, 2) 是空格，填入 4
        sudoku.input(0, 2, 4);

        expect(puzzle[0][2].input).toBe(4);
    });

    it("should return true when all cells are correctly filled", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (knownPuzzle[row][column] === 0) {
                    sudoku.input(row, column, knownAnswer[row][column]);
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
        const puzzle = sudoku.generate("easy");

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
        const puzzle = sudoku.generate("easy");

        sudoku.autoNotes();
        const notesBefore = [...puzzle[0][2].notes];

        sudoku.autoNotes();

        expect(puzzle[0][2].notes).toEqual(notesBefore);
    });

    it("should remove note from peers when inputting a number", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        const puzzle = sudoku.generate("easy");

        // 先 autoNotes 填入候選筆記
        sudoku.autoNotes();

        // (0, 2) 候選 [1, 2, 4]，(0, 3) 候選包含某些數字
        // 填入 4 到 (0, 2)，同行同宮的空白格中的 4 應被移除
        sudoku.input(0, 2, 4);

        // (0, 3) 在同一行，其 notes 不應再包含 4
        expect(puzzle[0][3].notes).not.toContain(4);
        // (0, 5) 在同一行，其 notes 不應再包含 4
        expect(puzzle[0][5].notes).not.toContain(4);
    });

    it("should not overwrite existing notes or inputs with autoNotes", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        const puzzle = sudoku.generate("easy");

        // 先填入一個數字
        sudoku.input(0, 2, 4);

        sudoku.autoNotes();

        // 已填入的格子不應被覆蓋
        expect(puzzle[0][2].input).toBe(4);
        expect(puzzle[0][2].hasNotes).toBe(false);
    });

    it("should return false when a cell has wrong input", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        // 填入所有正確答案，但最後一個故意填錯
        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (knownPuzzle[row][column] === 0) {
                    sudoku.input(row, column, knownAnswer[row][column]);
                }
            }
        }
        // 把 (0, 2) 填入錯誤值（正確是 4，填 1）
        sudoku.input(0, 2, 1);

        expect(sudoku.isCompleted()).toBe(false);
    });
});
