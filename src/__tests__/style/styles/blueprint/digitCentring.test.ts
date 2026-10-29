import { readFileSync } from "fs";
import { BLUEPRINT_DIGIT_FACE } from "@/presentation/components/style-moments/blueprint/blueprintDigitOutlines";
import { advanceInEm, baselineInOneEmLine, woff2Tables } from "@/__tests__/style/woff2Tables";

// The writer lays each digit's outline over the digit itself: its advance centred on the cell and its baseline
// where Architects Daughter puts it in a one-em line. Both come from the bundled face, so the outlines stay on
// the glyph if the face is ever regenerated.

const FONT = readFileSync("src/assets/fonts/architects-daughter.woff2");
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

describe("blueprint digit centring", () => {
    it("should draw the outlines in the bundled Architects Daughter's units", () => {
        expect(BLUEPRINT_DIGIT_FACE.unitsPerEm).toBe(woff2Tables(FONT).get("head")?.readUInt16BE(18));
    });

    it.each(DIGITS)("should know the bundled Architects Daughter's advance for %i", (digit) => {
        expect(BLUEPRINT_DIGIT_FACE.advances[digit]).toBeCloseTo(advanceInEm(FONT, String(digit)), 3);
    });

    it("should put the baseline where the bundled Architects Daughter puts it in a one-em line", () => {
        expect(BLUEPRINT_DIGIT_FACE.baselineEm).toBeCloseTo(baselineInOneEmLine(FONT), 3);
    });

    // The arriving digit is masked, and a mask clips to the digit's box: its advance wide and one em tall. Every
    // outline's ink lies inside it, so nothing of the digit is cut off while it is inked in.
    it.each(DIGITS)("should keep the outline of %i inside the digit's box", (digit) => {
        const numbers = (BLUEPRINT_DIGIT_FACE.outlines[digit].match(/-?[\d.]+/g) ?? []).map(Number);
        const xs = numbers.filter((_, index) => index % 2 === 0);
        const ys = numbers.filter((_, index) => index % 2 === 1);
        const { unitsPerEm, baselineEm } = BLUEPRINT_DIGIT_FACE;

        expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...xs) / unitsPerEm).toBeLessThanOrEqual(BLUEPRINT_DIGIT_FACE.advances[digit]);
        // In font units y grows upward from the baseline
        expect(Math.max(...ys) / unitsPerEm).toBeLessThanOrEqual(baselineEm);
        expect(-Math.min(...ys) / unitsPerEm).toBeLessThanOrEqual(1 - baselineEm);
    });
});
