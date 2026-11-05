import { describe, expect, it } from "vitest";
import { noteGlyphStyle } from "@/presentation/components/digit-pad/noteGlyphPlace";

describe("noteGlyphStyle", () => {
    it.each([
        [1, -27, -27],
        [2, 0, -27],
        [3, 27, -27],
        [4, -27, 0],
        [5, 0, 0],
        [6, 27, 0],
        [7, -27, 27],
        [8, 0, 27],
        [9, 27, 27],
    ])("should move %i to its place in the note grid", (digit, across, down) => {
        expect(noteGlyphStyle(digit, true)).toEqual({ transform: `translate(${across}cqw, ${down}cqw)` });
    });

    it("should leave the digit centred outside note mode", () => {
        expect(noteGlyphStyle(1, false)).toBeUndefined();
    });
});
