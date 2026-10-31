import { readFileSync } from "fs";
import { CHALKBOARD_STROKE_FACE } from "@/presentation/components/style-moments/chalkboard/chalkboardDigitStrokes";
import { advanceInEm, baselineInOneEmLine } from "@/__tests__/style/woff2Tables";
import { declarationsOf } from "@/__tests__/style/styleSheetRules";

// The writer lays chalk's strokes on the digit's own box: its advance wide (plus the room either side) and
// one em tall, the baseline where Caveat Brush puts it in a one-em line. Both come from the bundled face,
// so the strokes stay on the glyph if the face is ever regenerated.

const FONT = readFileSync("src/assets/fonts/caveat-brush.woff2");
const CHALKBOARD_CSS = readFileSync("src/style/styles/chalkboard/skin.css", "utf8");
const BOARD_DIGITS = '[data-style="chalkboard"] [data-skin~="board"] [data-variant] > :is(.font-clue, .font-entry)';

describe("chalkboard digit centring", () => {
    it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])("should know the bundled Caveat Brush's advance for %i", (digit) => {
        expect(CHALKBOARD_STROKE_FACE.advances[digit]).toBeCloseTo(advanceInEm(FONT, String(digit)), 3);
    });

    it("should put the baseline where the bundled Caveat Brush puts it in a one-em line", () => {
        expect(CHALKBOARD_STROKE_FACE.baselineEm).toBeCloseTo(baselineInOneEmLine(FONT), 3);
    });

    // Caveat Brush's ink overhangs its advance (the 4's bar by about 2px), and a mask clips to its element's
    // box: the board's digits take room either side, given back by a negative margin so nothing moves, and
    // the writer counts the room in the digit's box
    it("should give the board's digits room for their overhang without moving them, as the writer expects", () => {
        const digits = declarationsOf(CHALKBOARD_CSS, BOARD_DIGITS);
        const room = CHALKBOARD_STROKE_FACE.boxPaddingEm ?? 0;

        expect(room).toBeGreaterThan(0.066);
        expect(digits.get("padding-inline")).toBe(`${room}em`);
        expect(digits.get("margin-inline")).toBe(`-${room}em`);
    });
});
