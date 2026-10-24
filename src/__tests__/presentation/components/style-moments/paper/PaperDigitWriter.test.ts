import { describe, expect, it } from "vitest";
import { mount, type DOMWrapper } from "@vue/test-utils";
import PaperDigitWriter from "@/presentation/components/style-moments/paper/PaperDigitWriter.vue";
import { PAPER_DIGIT_STROKES } from "@/presentation/components/style-moments/paper/paperDigitStrokes";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
// The board's settle: a 60ms fade of the whole mask that fills the specks the strokes leave
const SETTLE_MS = 60;

const strokesOf = (digit: number) => PAPER_DIGIT_STROKES[digit]?.strokes ?? [];

const mountWriter = (digit: number) => mount(PaperDigitWriter, { props: { digit, maskId: "writer-mask" } });

const millisecondsOf = (style: string | undefined, property: string): number =>
    Number.parseFloat(new RegExp(`${property}:\\s*([\\d.]+)ms`).exec(style ?? "")?.[1] ?? "NaN");

interface StrokeTiming { startMs: number; endMs: number }

const timingOf = (stroke: DOMWrapper<Element>): StrokeTiming => {
    const style = stroke.attributes("style");
    const startMs = millisecondsOf(style, "animation-delay");
    return { startMs, endMs: startMs + millisecondsOf(style, "animation-duration") };
};

// Where a point of the board's drawing lands in the digit's box, through the mask's transform
const placeInBox = (transform: string | undefined, x: number, y: number): [number, number] => {
    const [a, b, c, d, e, f] = (/matrix\(([^)]*)\)/.exec(transform ?? "")?.[1] ?? "").split(/[\s,]+/).map(Number);
    return [a * x + c * y + e, b * x + d * y + f];
};

describe("PaperDigitWriter", () => {
    it.each(DIGITS)("should write %i through a mask of its strokes, in writing order", (digit) => {
        const writer = mountWriter(digit);

        const mask = writer.get("mask#writer-mask");
        const strokes = mask.findAll(".paper-digit-stroke");
        expect(strokes.map(stroke => stroke.attributes("d"))).toEqual(strokesOf(digit).map(stroke => stroke.path));
        const starts = strokes.map(stroke => timingOf(stroke).startMs);
        expect(starts).toEqual([...starts].sort((first, second) => first - second));
        // Each stroke starts hidden along its whole length and draws itself on
        for (const [index, stroke] of strokes.entries()) {
            const length = strokesOf(digit)[index].length;
            expect(stroke.attributes("style")).toContain(`stroke-dasharray: ${length}`);
            expect(stroke.attributes("style")).toContain(`stroke-dashoffset: ${length}`);
        }
    });

    // From the board: each digit takes 420–460ms, the 8 about 560ms, well inside the arrival's own settle
    it.each(DIGITS)("should finish writing %i with the board's timing, the settle ending with the last stroke", (digit) => {
        const writer = mountWriter(digit);

        const lastStrokeEndMs = Math.max(...writer.findAll(".paper-digit-stroke").map(stroke => timingOf(stroke).endMs));
        const settle = writer.get(".paper-digit-settle");
        const settleEndMs = millisecondsOf(settle.attributes("style"), "animation-delay") + SETTLE_MS;
        expect(settleEndMs).toBe(lastStrokeEndMs);
        if (digit === 8) expect(lastStrokeEndMs).toBe(560);
        else {
            expect(lastStrokeEndMs).toBeGreaterThanOrEqual(420);
            expect(lastStrokeEndMs).toBeLessThanOrEqual(460);
        }
        expect(lastStrokeEndMs).toBeLessThan(ARRIVAL_SETTLE_MS);
    });

    it.each([1, 4, 7])("should lift the pen for 50ms between the strokes of %i", (digit) => {
        const [first, second] = mountWriter(digit).findAll(".paper-digit-stroke").map(timingOf);

        expect(second.startMs - first.endMs).toBe(50);
    });

    it.each([6, 8, 9])("should run the pieces of %i's one stroke on without a lift", (digit) => {
        const timings = mountWriter(digit).findAll(".paper-digit-stroke").map(timingOf);

        for (let index = 1; index < timings.length; index += 1) expect(timings[index].startMs).toBe(timings[index - 1].endMs);
    });

    // Where a later stroke crosses an earlier one, the earlier one is cut there, so the crossing is
    // revealed when the pen gets to it the second time
    it("should leave a crossing to the later stroke", () => {
        const writer = mountWriter(4);

        const [first, second] = writer.findAll(".paper-digit-stroke");
        const clipId = /^url\(#(.+)\)$/.exec(first.attributes("clip-path") ?? "")?.[1] ?? "";
        const cut = writer.get(`[id="${clipId}"] path`);
        expect(cut.attributes("clip-rule")).toBe("evenodd");
        expect(cut.attributes("d")).toContain(strokesOf(4)[0].crossings);
        expect(second.attributes("clip-path")).toBeUndefined();
    });

    it("should give each writer's crossings their own ids", () => {
        const first = mount(PaperDigitWriter, { props: { digit: 4, maskId: "first" } });
        const second = mount(PaperDigitWriter, { props: { digit: 4, maskId: "second" } });

        expect(first.get(".paper-digit-stroke").attributes("clip-path")).not.toBe(second.get(".paper-digit-stroke").attributes("clip-path"));
    });

    // The board draws Caveat at 74 units, its advance centred on x 50 and its baseline on y 74; the digit's
    // box is its advance wide and 1em tall, with Caveat's baseline 0.83em down
    it("should lay the strokes on the digit's own box, the glyph's centre and baseline matching", () => {
        const mask = mountWriter(4).get("mask");
        const transform = mask.get("g").attributes("transform");

        expect(mask.attributes("maskContentUnits")).toBe("objectBoundingBox");
        const [centreX, baselineY] = placeInBox(transform, 50, 74);
        expect(centreX).toBeCloseTo(0.5, 4);
        expect(baselineY).toBeCloseTo(0.83, 4);
        // One em (74 units) down is one box height
        expect(placeInBox(transform, 50, 148)[1] - baselineY).toBeCloseTo(1, 4);
    });

    it("should say it has written the digit once the settle ends", async () => {
        const writer = mountWriter(4);

        await writer.get(".paper-digit-stroke").trigger("animationend");
        expect(writer.emitted("written")).toBeUndefined();

        await writer.get(".paper-digit-settle").trigger("animationend");
        expect(writer.emitted("written")).toHaveLength(1);
    });

    it.each([0, 10])("should draw no strokes for %i, only showing it whole", (digit) => {
        const writer = mountWriter(digit);

        expect(writer.findAll(".paper-digit-stroke")).toHaveLength(0);
        expect(millisecondsOf(writer.get(".paper-digit-settle").attributes("style"), "animation-delay")).toBe(0);
    });

    it("should stay out of the way: hidden from assistive tech, taking no room", () => {
        const svg = mountWriter(4).get("svg");

        expect(svg.attributes("aria-hidden")).toBe("true");
        expect(svg.classes()).toEqual(expect.arrayContaining(["absolute", "size-0"]));
    });
});
