import { contrastRatio, mixColors } from "@/theme/contrast";

describe("contrast", () => {
    it("should give 21 for black on white", () => {
        expect(contrastRatio("#000000", "#FFFFFF")).toBe(21);
    });

    it("should match the WCAG ratio for mid grey on white", () => {
        expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
    });

    it("should be symmetric", () => {
        expect(contrastRatio("#3D8A5A", "#F5F4F1")).toBe(contrastRatio("#F5F4F1", "#3D8A5A"));
    });

    it("should blend a colour over a base in sRGB", () => {
        expect(mixColors("#000000", 0.5, "#FFFFFF")).toBe("#808080");
    });
});
