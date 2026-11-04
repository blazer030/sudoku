import { INK_STROKE_LENGTH, INK_STROKE_START, INK_STROKE_WIDEST, INK_STROKE_WIDTH } from "@/presentation/components/style-moments/ink/canvas/inkShaders";

// The board's frame reaches 6 units past the cells, of the 351 the cells take (brush-grid.svg)
const FRAME_REACH = 6 / 351;

describe("ink shaders", () => {
    describe("a line's stroke", () => {
        // A brush narrows to 0.6 of its width by the far end, its round cap as wide as the brush there
        it("should stop within the frame at its far end, however wide the brush wavers", () => {
            const farEnd = INK_STROKE_START + INK_STROKE_LENGTH;

            expect(farEnd + 0.6 * INK_STROKE_WIDTH * INK_STROKE_WIDEST).toBeLessThanOrEqual(1 + FRAME_REACH);
        });

        it("should land within the frame where it starts, however wide the brush wavers", () => {
            expect(INK_STROKE_START - INK_STROKE_WIDTH * INK_STROKE_WIDEST).toBeGreaterThanOrEqual(-FRAME_REACH);
        });
    });
});
