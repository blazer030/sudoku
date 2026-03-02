import { afterEach, describe, expect, it, vi } from "vitest";
import Sudoku from "@/domain/Sudoku";
import { SudokuGenerator } from "@/domain/SudokuGenerator";

const knownAnswer = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const knownPuzzle = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

function spyGeneratePuzzle() {
    vi.spyOn(SudokuGenerator.prototype, "generatePuzzle").mockReturnValue({
        puzzle: knownPuzzle.map(row => [...row]),
        answer: knownAnswer.map(row => [...row]),
    });
}

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

        // (0, 2) 是空格，填入 5 → 與 (0, 0) 的 tip=5 衝突
        const conflicts = sudoku.findConflicts(0, 2, 5);

        expect(conflicts).toContainEqual({ row: 0, column: 0 });
    });

    it("should return column conflicts when same number exists in the column", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        // (1, 1) 是空格，填入 9 → 與 (2, 1) 的 tip=9 衝突
        const conflicts = sudoku.findConflicts(1, 1, 9);

        expect(conflicts).toContainEqual({ row: 2, column: 1 });
    });

    it("should return box conflicts when same number exists in the box", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        // (0, 2) 是空格，填入 6 → 與同宮 (1, 0) 的 tip=6 衝突
        const conflicts = sudoku.findConflicts(0, 2, 6);

        expect(conflicts).toContainEqual({ row: 1, column: 0 });
    });

    it("should return all conflicts across row, column, and box", () => {
        spyGeneratePuzzle();
        const sudoku = new Sudoku();
        sudoku.generate("easy");

        // (1, 1) 是空格，填入 9
        // 行衝突：(1, 4) tip=9
        // 列衝突：(2, 1) tip=9
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
