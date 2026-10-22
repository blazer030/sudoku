import { titleGlyphs } from "@/presentation/pages/home/titleGlyphs";

describe("titleGlyphs", () => {
    it("should split a title of Han characters into one glyph each", () => {
        expect(titleGlyphs("數獨")).toEqual(["數", "獨"]);
    });

    it("should keep any other title whole", () => {
        expect(titleGlyphs("Sudoku")).toEqual(["Sudoku"]);
        expect(titleGlyphs("數獨 Sudoku")).toEqual(["數獨 Sudoku"]);
    });

    it("should give nothing for an empty title", () => {
        expect(titleGlyphs("")).toEqual([]);
    });
});
