import { describe, expect, it } from "vitest";
import PuzzleCell from "@/domain/PuzzleCell";

describe("PuzzleCell", () => {
    describe("Constructor and basic properties", () => {
        it("should correctly initialize clue cells (non-empty)", () => {
            const cell = new PuzzleCell(5);

            expect(cell.value).toBe(5);
            expect(cell.input).toBe(0);
            expect(cell.isClue).toBe(true);
            expect(cell.isSlot).toBe(false);
            expect(cell.isEntered).toBe(false);
        });

        it("should correctly initialize empty cells", () => {
            const cell = new PuzzleCell(0);

            expect(cell.value).toBe(0);
            expect(cell.input).toBe(0);
            expect(cell.isClue).toBe(false);
            expect(cell.isSlot).toBe(true);
            expect(cell.isEntered).toBe(false);
        });

    });

    describe("Number input functionality", () => {
        it("should allow inputting numbers in empty cells", () => {
            const cell = new PuzzleCell(0);
            cell.input = 3;

            expect(cell.input).toBe(3);
            expect(cell.isEntered).toBe(true);
            expect(cell.isSlot).toBe(true);
        });

        it("should clear notes after inputting a number", () => {
            const cell = new PuzzleCell(0);
            cell.toggleNote(1);
            cell.toggleNote(2);
            expect(cell.hasNotes).toBe(true);

            cell.input = 5;

            expect(cell.hasNotes).toBe(false);
            expect(cell.notes).toEqual([]);
        });

        it("should allow clearing inputted numbers", () => {
            const cell = new PuzzleCell(0);
            cell.input = 7;
            expect(cell.isEntered).toBe(true);

            cell.input = 0;

            expect(cell.input).toBe(0);
            expect(cell.isEntered).toBe(false);
        });

        it("should not allow inputting numbers in clue cells", () => {
            const cell = new PuzzleCell(4);

            cell.input = 9;

            expect(cell.input).toBe(0);
        });
    });

    describe("Notes management", () => {
        it("should allow adding candidate numbers", () => {
            const cell = new PuzzleCell(0);
            cell.toggleNote(3);

            expect(cell.hasNotes).toBe(true);
            expect(cell.notes).toContain(3);
        });

        it("should allow removing existing candidate numbers", () => {
            const cell = new PuzzleCell(0);
            cell.toggleNote(5);
            expect(cell.notes).toContain(5);

            cell.toggleNote(5);

            expect(cell.notes).not.toContain(5);
        });

        it("should not allow setting notes in clue cells", () => {
            const cell = new PuzzleCell(6);

            cell.toggleNote(2);

            expect(cell.hasNotes).toBe(false);
            expect(cell.notes).toEqual([]);
        });

        it("should not allow setting notes in cells with inputted numbers", () => {
            const cell = new PuzzleCell(0);
            cell.input = 8;

            cell.toggleNote(3);

            expect(cell.hasNotes).toBe(false);
            expect(cell.notes).toEqual([]);
        });

        it("should clear all notes", () => {
            const cell = new PuzzleCell(0);
            cell.toggleNote(1);
            cell.toggleNote(3);

            cell.clearNotes();

            expect(cell.notes).toEqual([]);
            expect(cell.hasNotes).toBe(false);
        });

        it("should remove a specific note without toggling", () => {
            const cell = new PuzzleCell(0);
            cell.toggleNote(1);
            cell.toggleNote(3);
            cell.toggleNote(5);

            cell.removeNote(3);

            expect(cell.notes).toEqual([1, 5]);
        });

        it("should do nothing when removing a note that does not exist", () => {
            const cell = new PuzzleCell(0);
            cell.toggleNote(1);

            cell.removeNote(7);

            expect(cell.notes).toEqual([1]);
        });
    });
});
