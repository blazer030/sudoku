import { beforeEach, describe, expect, it } from "vitest";
import PuzzleCell from "@/domain/PuzzleCell";

describe("PuzzleCell", () => {
    describe("建構子和基本屬性", () => {
        it("應該正確初始化提示格（非空格）", () => {
            const cell = new PuzzleCell(5);

            expect(cell.value).toBe(5);
            expect(cell.input).toBe(0);
            expect(cell.isTip).toBe(true);
            expect(cell.isSlot).toBe(false);
            expect(cell.isEntered).toBe(false);
        });

        it("應該正確初始化空格", () => {
            const cell = new PuzzleCell(0);

            expect(cell.value).toBe(0);
            expect(cell.input).toBe(0);
            expect(cell.isTip).toBe(false);
            expect(cell.isSlot).toBe(true);
            expect(cell.isEntered).toBe(false);
        });

        it("空格初始化時不應該有候選數字", () => {
            const cell = new PuzzleCell(0);

            expect(cell.hasNotes).toBe(false);
            expect(cell.notes).toEqual([]);
        });

        it("提示格初始化時不應該有候選數字", () => {
            const cell = new PuzzleCell(7);

            expect(cell.hasNotes).toBe(false);
            expect(cell.notes).toEqual([]);
        });
    });

    describe("數字輸入功能", () => {
        let emptyCell: PuzzleCell;

        beforeEach(() => {
            emptyCell = new PuzzleCell(0);
        });

        it("應該允許在空格中輸入數字", () => {
            emptyCell.input = 3;

            expect(emptyCell.input).toBe(3);
            expect(emptyCell.isEntered).toBe(true);
            expect(emptyCell.isSlot).toBe(true);
        });

        it("輸入數字後應該清除候選數字", () => {
            emptyCell.notes = 1;
            emptyCell.notes = 2;
            expect(emptyCell.hasNotes).toBe(true);

            emptyCell.input = 5;

            expect(emptyCell.hasNotes).toBe(false);
            expect(emptyCell.notes).toEqual([]);
        });

        it("應該允許清除已輸入的數字", () => {
            emptyCell.input = 7;
            expect(emptyCell.isEntered).toBe(true);

            emptyCell.input = 0;

            expect(emptyCell.input).toBe(0);
            expect(emptyCell.isEntered).toBe(false);
        });

        it("不應該允許在提示格中輸入數字", () => {
            const tipCell = new PuzzleCell(4);

            tipCell.input = 9;

            expect(tipCell.input).toBe(0);
        });
    });

    describe("候選數字管理", () => {
        let emptyCell: PuzzleCell;

        beforeEach(() => {
            emptyCell = new PuzzleCell(0);
        });

        it("應該允許新增候選數字", () => {
            emptyCell.notes = 3;

            expect(emptyCell.hasNotes).toBe(true);
            expect(emptyCell.notes).toContain(3);
        });

        it("應該允許移除已存在的候選數字", () => {
            emptyCell.notes = 5;
            expect(emptyCell.notes).toContain(5);

            emptyCell.notes = 5;

            expect(emptyCell.notes).not.toContain(5);
        });

        it("不應該允許在提示格中設定候選數字", () => {
            const tipCell = new PuzzleCell(6);

            tipCell.notes = 2;

            expect(tipCell.hasNotes).toBe(false);
            expect(tipCell.notes).toEqual([]);
        });

        it("不應該允許在已輸入數字的格中設定候選數字", () => {
            emptyCell.input = 8;

            emptyCell.notes = 3;

            expect(emptyCell.hasNotes).toBe(false);
            expect(emptyCell.notes).toEqual([]);
        });
    });
});
