import { beforeEach, describe, expect, it } from "vitest";
import PuzzleCell from "@/domain/PuzzleCell";

describe("PuzzleCell", () => {
    describe("Constructor and basic properties", () => {
        it("should correctly initialize tip cells (non-empty)", () => {
            const cell = new PuzzleCell(5);

            expect(cell.value).toBe(5);
            expect(cell.input).toBe(0);
            expect(cell.isTip).toBe(true);
            expect(cell.isSlot).toBe(false);
            expect(cell.isEntered).toBe(false);
        });

        it("should correctly initialize empty cells", () => {
            const cell = new PuzzleCell(0);

            expect(cell.value).toBe(0);
            expect(cell.input).toBe(0);
            expect(cell.isTip).toBe(false);
            expect(cell.isSlot).toBe(true);
            expect(cell.isEntered).toBe(false);
        });

    });

    describe("Number input functionality", () => {
        let emptyCell: PuzzleCell;

        beforeEach(() => {
            emptyCell = new PuzzleCell(0);
        });

        it("should allow inputting numbers in empty cells", () => {
            emptyCell.input = 3;

            expect(emptyCell.input).toBe(3);
            expect(emptyCell.isEntered).toBe(true);
            expect(emptyCell.isSlot).toBe(true);
        });

        it("should clear notes after inputting a number", () => {
            emptyCell.toggleNote(1);
            emptyCell.toggleNote(2);
            expect(emptyCell.hasNotes).toBe(true);

            emptyCell.input = 5;

            expect(emptyCell.hasNotes).toBe(false);
            expect(emptyCell.notes).toEqual([]);
        });

        it("should allow clearing inputted numbers", () => {
            emptyCell.input = 7;
            expect(emptyCell.isEntered).toBe(true);

            emptyCell.input = 0;

            expect(emptyCell.input).toBe(0);
            expect(emptyCell.isEntered).toBe(false);
        });

        it("should not allow inputting numbers in tip cells", () => {
            const tipCell = new PuzzleCell(4);

            tipCell.input = 9;

            expect(tipCell.input).toBe(0);
        });
    });

    describe("Notes management", () => {
        let emptyCell: PuzzleCell;

        beforeEach(() => {
            emptyCell = new PuzzleCell(0);
        });

        it("should allow adding candidate numbers", () => {
            emptyCell.toggleNote(3);

            expect(emptyCell.hasNotes).toBe(true);
            expect(emptyCell.notes).toContain(3);
        });

        it("should allow removing existing candidate numbers", () => {
            emptyCell.toggleNote(5);
            expect(emptyCell.notes).toContain(5);

            emptyCell.toggleNote(5);

            expect(emptyCell.notes).not.toContain(5);
        });

        it("should not allow setting notes in tip cells", () => {
            const tipCell = new PuzzleCell(6);

            tipCell.toggleNote(2);

            expect(tipCell.hasNotes).toBe(false);
            expect(tipCell.notes).toEqual([]);
        });

        it("should not allow setting notes in cells with inputted numbers", () => {
            emptyCell.input = 8;

            emptyCell.toggleNote(3);

            expect(emptyCell.hasNotes).toBe(false);
            expect(emptyCell.notes).toEqual([]);
        });
    });
});
