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
