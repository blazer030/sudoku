import { readFileSync } from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { mount, type DOMWrapper } from "@vue/test-utils";
import ChalkboardDigitWriter from "@/presentation/components/style-moments/chalkboard/ChalkboardDigitWriter.vue";
import { CHALKBOARD_DIGIT_DUST, CHALKBOARD_STROKE_FACE, DUST_SPECKS } from "@/presentation/components/style-moments/chalkboard/chalkboardDigitStrokes";
import BoardCell from "@/presentation/components/board-cell/BoardCell.vue";
import { useSettingsStore } from "@/stores/settingsStore";
import { declarationsOf } from "@/__tests__/style/styleSheetRules";

// Whether the browser can mask an HTML element by an SVG <mask>; jsdom's own answer is no
vi.mock("@/presentation/components/style-moments/maskReferenceSupport", () => ({
    canMaskByReference: () => true,
}));

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const CHALKBOARD_CSS = readFileSync("src/style/styles/chalkboard/skin.css", "utf8");
const SETTLE_MS = Number.parseFloat(declarationsOf(CHALKBOARD_CSS, '[data-style="chalkboard"] .chalkboard-digit-settle').get("animation-duration") ?? "NaN");
const PEN_LIFT_MS = 50;

const mountWriter = (digit: number, maskId = "writer-mask") => mount(ChalkboardDigitWriter, { props: { digit, maskId } });

const millisecondsOf = (style: string | undefined, property: string): number =>
    Number.parseFloat(new RegExp(`${property}:\\s*([\\d.]+)ms`).exec(style ?? "")?.[1] ?? "NaN");

interface StrokeTiming { startMs: number; endMs: number; path: string }

const timingOf = (stroke: DOMWrapper<Element>): StrokeTiming => {
    const style = stroke.attributes("style");
    const startMs = millisecondsOf(style, "animation-delay");
    return { startMs, endMs: startMs + millisecondsOf(style, "animation-duration"), path: stroke.attributes("d") ?? "" };
};

// The pen's strokes: pieces drawn on one after another without a lift make one stroke
const penStrokesOf = (digit: number): StrokeTiming[][] => {
    const penStrokes: StrokeTiming[][] = [];
    let previousEndMs = Number.NaN;
    for (const piece of mountWriter(digit).findAll(".chalkboard-digit-stroke").map(timingOf)) {
        if (piece.startMs === previousEndMs) penStrokes[penStrokes.length - 1].push(piece);
        else penStrokes.push([piece]);
        previousEndMs = piece.endMs;
    }
    return penStrokes;
};

const numbersOf = (path: string): number[] => (path.match(/-?[\d.]+/g) ?? []).map(Number);
const startOf = (penStroke: StrokeTiming[]): [number, number] => {
    const [x, y] = numbersOf(penStroke[0].path);
    return [x, y];
};
const endOf = (penStroke: StrokeTiming[]): [number, number] => {
    const numbers = numbersOf(penStroke[penStroke.length - 1].path);
    return [numbers[numbers.length - 2], numbers[numbers.length - 1]];
};

describe("ChalkboardDigitWriter", () => {
    it("should write with a 14-unit pen over Caveat Brush drawn as the board draws it", () => {
        expect(CHALKBOARD_STROKE_FACE.penWidth).toBe(14);
        expect(CHALKBOARD_STROKE_FACE.glyph).toEqual({ size: 74, centreX: 50, baselineY: 74 });
        expect(mountWriter(4).get("mask#writer-mask g").attributes("stroke-width")).toBe("14");
    });

    it.each(DIGITS)("should write %i in one or two pen strokes, each drawn on along its length", (digit) => {
        const writer = mountWriter(digit);
        const pieces = CHALKBOARD_STROKE_FACE.strokes[digit]?.strokes ?? [];

        const strokes = writer.get("mask#writer-mask").findAll(".chalkboard-digit-stroke");
        expect(strokes.map(stroke => stroke.attributes("d"))).toEqual(pieces.map(piece => piece.path));
        for (const [index, stroke] of strokes.entries()) {
            expect(stroke.attributes("style")).toContain(`stroke-dasharray: ${pieces[index].length}`);
            expect(stroke.attributes("style")).toContain(`stroke-dashoffset: ${pieces[index].length}`);
        }
        expect(penStrokesOf(digit).length).toBeGreaterThanOrEqual(1);
        expect(penStrokesOf(digit).length).toBeLessThanOrEqual(2);
    });

    it.each(DIGITS)("should lift the pen for 50ms between the strokes of %i", (digit) => {
        const penStrokes = penStrokesOf(digit);

        for (let index = 1; index < penStrokes.length; index += 1) {
            const previous = penStrokes[index - 1];
            expect(penStrokes[index][0].startMs - previous[previous.length - 1].endMs).toBe(PEN_LIFT_MS);
        }
    });

    it.each(DIGITS)("should finish writing %i in 420–560ms, the settle ending with the last stroke", (digit) => {
        const writer = mountWriter(digit);

        const lastStrokeEndMs = Math.max(...writer.findAll(".chalkboard-digit-stroke").map(stroke => timingOf(stroke).endMs));
        const settleEndMs = millisecondsOf(writer.get(".chalkboard-digit-settle").attributes("style"), "animation-delay") + SETTLE_MS;
        expect(SETTLE_MS).toBe(60);
        expect(settleEndMs).toBe(lastStrokeEndMs);
        expect(lastStrokeEndMs).toBeGreaterThanOrEqual(420);
        expect(lastStrokeEndMs).toBeLessThanOrEqual(560);
    });

    // In the board's units, y grows downward
    describe("writing order", () => {
        it("should flick the 1's flag up, then pull its stem down", () => {
            const [flag, stem] = penStrokesOf(1);

            expect(endOf(flag)[1]).toBeLessThan(startOf(flag)[1]);
            expect(endOf(stem)[1] - startOf(stem)[1]).toBeGreaterThan(30);
        });

        it("should draw the 4's diagonal running into its bar, then its stem", () => {
            const [diagonalWithBar, stem] = penStrokesOf(4);

            expect(endOf(diagonalWithBar)[0]).toBeGreaterThan(startOf(diagonalWithBar)[0] + 10);
            expect(endOf(diagonalWithBar)[1]).toBeGreaterThan(startOf(diagonalWithBar)[1] + 20);
            expect(endOf(stem)[1] - startOf(stem)[1]).toBeGreaterThan(30);
        });

        it("should draw the 5's stem and belly, then its bar on top", () => {
            const [stemWithBelly, bar] = penStrokesOf(5);

            expect(endOf(stemWithBelly)[1]).toBeGreaterThan(startOf(stemWithBelly)[1] + 30);
            expect(Math.abs(endOf(bar)[1] - startOf(bar)[1])).toBeLessThan(5);
            expect(endOf(bar)[0] - startOf(bar)[0]).toBeGreaterThan(15);
            expect(startOf(bar)[1]).toBeLessThan(35);
        });

        it("should draw the 7's bar and run on down its diagonal in one stroke", () => {
            const [stroke, ...rest] = penStrokesOf(7);
            const pieceNumbers = numbersOf(stroke[0].path);
            const [barEndX, barEndY] = [pieceNumbers[6], pieceNumbers[7]];

            expect(rest).toEqual([]);
            expect(barEndX - startOf(stroke)[0]).toBeGreaterThan(20);
            expect(Math.abs(barEndY - startOf(stroke)[1])).toBeLessThan(5);
            expect(endOf(stroke)[1]).toBeGreaterThan(70);
        });

        it("should draw the 8 in one S stroke", () => {
            const [stroke, ...rest] = penStrokesOf(8);

            expect(rest).toEqual([]);
            // The pen comes back to where it began, closing the top loop
            expect(Math.hypot(endOf(stroke)[0] - startOf(stroke)[0], endOf(stroke)[1] - startOf(stroke)[1])).toBeLessThan(2);
        });
    });

    // The board draws Caveat Brush at 74 units, its advance centred on x 50 and its baseline on y 74. The digit's
    // box is one em tall and its advance wide, plus the room the skin gives it either side for the overhang.
    it("should lay the strokes on the digit's own box, room included, the glyph's centre and baseline matching", () => {
        const transform = mountWriter(4).get("mask g").attributes("transform") ?? "";
        const [a, b, c, d, e, f] = (/matrix\(([^)]*)\)/.exec(transform)?.[1] ?? "").split(/[\s,]+/).map(Number);
        const placeInBox = (x: number, y: number): [number, number] => [a * x + c * y + e, b * x + d * y + f];
        const advance = CHALKBOARD_STROKE_FACE.advances[4] ?? 0;
        const room = CHALKBOARD_STROKE_FACE.boxPaddingEm ?? 0;

        expect(placeInBox(50, 74)[0]).toBeCloseTo(0.5, 4);
        expect(placeInBox(50, 74)[1]).toBeCloseTo(0.83, 4);
        // The advance's right edge lands short of the box's by the room
        expect(placeInBox(50 + 74 * advance / 2, 74)[0]).toBeCloseTo((room + advance) / (advance + 2 * room), 4);
        expect(placeInBox(50, 148)[1] - placeInBox(50, 74)[1]).toBeCloseTo(1, 4);
    });

    // Where a later stroke crosses an earlier one, the earlier one is cut there
    it("should leave the 4's crossings to its stem", () => {
        const writer = mountWriter(4);

        const [first, second] = writer.findAll(".chalkboard-digit-stroke");
        const clipId = /^url\(#(.+)\)$/.exec(first.attributes("clip-path") ?? "")?.[1] ?? "";
        expect(writer.get(`[id="${clipId}"] path`).attributes("d")).toContain(CHALKBOARD_STROKE_FACE.strokes[4]?.strokes[0].crossings);
        expect(second.attributes("clip-path")).toBeUndefined();
    });

    describe("chalk dust", () => {
        it.each(DIGITS)("should drop three specks of dust 20ms before each stroke of %i ends", (digit) => {
            const specks = mountWriter(digit).findAll(".chalkboard-digit-dust");
            const strokeEnds = penStrokesOf(digit).map(penStroke => penStroke[penStroke.length - 1].endMs);

            expect(specks).toHaveLength(3 * strokeEnds.length);
            const delays = specks.map(speck => millisecondsOf(speck.attributes("style"), "animation-delay"));
            expect(delays).toEqual(strokeEnds.flatMap(endMs => [endMs - 20, endMs - 20, endMs - 20]));
            expect(CHALKBOARD_DIGIT_DUST[digit]).toHaveLength(strokeEnds.length);
        });

        it("should place the dust where the board drops it, below each stroke's end", () => {
            const specks = mountWriter(1).findAll(".chalkboard-digit-dust").map(speck => [speck.attributes("cx"), speck.attributes("cy"), speck.attributes("r")].map(Number));

            // The 1's two strokes end at (52, 33) and (50, 76): each drops the three specks round its end
            const expected = [{ x: 52, y: 33 }, { x: 50, y: 76 }].flatMap(fall => DUST_SPECKS.map(speck => [fall.x + speck.dx, fall.y + speck.dy, speck.radius]));

            expect(specks).toEqual(expected);
        });

        // The dust lies on the digit's em square, centred on the cell as the digit is
        it("should lay the dust over the digit in the board's units, the digit's em square centred on the cell", () => {
            const dust = mountWriter(4).get("svg.chalkboard-digit-dust-layer");
            const { size, centreX, baselineY } = CHALKBOARD_STROKE_FACE.glyph;

            expect(dust.attributes("viewBox")).toBe(`${centreX - size / 2} ${baselineY - CHALKBOARD_STROKE_FACE.baselineEm * size} ${size} ${size}`);
            expect(dust.attributes("aria-hidden")).toBe("true");
            expect(dust.classes()).toEqual(expect.arrayContaining(["absolute", "pointer-events-none", "overflow-visible"]));
        });

        // jsdom runs no style sheet, so the dust has no animation: the settle alone says the digit is written
        it("should say it has written the digit once the settle ends, when no dust is falling", async () => {
            const writer = mountWriter(4);

            await writer.get(".chalkboard-digit-stroke").trigger("animationend");
            expect(writer.emitted("written")).toBeUndefined();

            await writer.get(".chalkboard-digit-settle").trigger("animationend");
            expect(writer.emitted("written")).toHaveLength(1);
        });

        // 黑板's dust falls past the last stroke; the writer stays until it has fallen, or it would vanish mid-air
        it("should wait for the last dust to fall before saying it has written the digit, where dust falls", async () => {
            const writer = mountWriter(4);
            const specks = writer.findAll(".chalkboard-digit-dust");
            const lastSpeck = specks[specks.length - 1];
            vi.spyOn(window, "getComputedStyle").mockImplementation(() => ({ animationName: "chalkboard-digit-dust" }) as CSSStyleDeclaration);

            await writer.get(".chalkboard-digit-settle").trigger("animationend");
            expect(writer.emitted("written")).toBeUndefined();

            await specks[0].trigger("animationend");
            expect(writer.emitted("written")).toBeUndefined();
            await lastSpeck.trigger("animationend");
            expect(writer.emitted("written")).toHaveLength(1);
            vi.restoreAllMocks();
        });
    });

    it("should give each writer its own mask, crossings and dust", () => {
        const first = mountWriter(4, "first");
        const second = mountWriter(4, "second");

        expect(first.find("mask#first").exists()).toBe(true);
        expect(second.find("mask#second").exists()).toBe(true);
        expect(first.get(".chalkboard-digit-stroke").attributes("clip-path")).not.toBe(second.get(".chalkboard-digit-stroke").attributes("clip-path"));
    });

    it.each([0, 10])("should draw no strokes and drop no dust for %i, only showing it whole", (digit) => {
        const writer = mountWriter(digit);

        expect(writer.findAll(".chalkboard-digit-stroke")).toHaveLength(0);
        expect(writer.findAll(".chalkboard-digit-dust")).toHaveLength(0);
        expect(millisecondsOf(writer.get(".chalkboard-digit-settle").attributes("style"), "animation-delay")).toBe(0);
    });

    // Typing quickly: a digit typed over one still being written replaces it with a fresh writer
    describe("on the board", () => {
        beforeEach(() => {
            vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query }));
            useSettingsStore().setStyle("chalkboard");
        });

        afterEach(() => {
            vi.useRealTimers();
            vi.unstubAllGlobals();
            localStorage.clear();
        });

        it("should write a new digit typed over one still being written with a new writer", async () => {
            vi.useFakeTimers();
            const cell = mount(BoardCell, { props: { row: 0, column: 0, value: 0, valueKind: "entered" } });

            await cell.setProps({ value: 4 });
            const firstWriter = cell.findComponent(ChalkboardDigitWriter);
            expect(firstWriter.props("digit")).toBe(4);

            await cell.setProps({ value: 7 });
            expect(cell.findComponent(ChalkboardDigitWriter).exists()).toBe(false);
            vi.advanceTimersByTime(100);
            await nextTick();

            const secondWriter = cell.findComponent(ChalkboardDigitWriter);
            expect(secondWriter.props("digit")).toBe(7);
            expect(secondWriter.element === firstWriter.element).toBe(false);
            expect(cell.get("[data-testid='cell-value']").attributes("style")).toContain(`url(#${String(secondWriter.props("maskId"))})`);

            await cell.get(".chalkboard-digit-settle").trigger("animationend");
            expect(cell.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");
            expect(cell.findComponent(ChalkboardDigitWriter).exists()).toBe(false);
        });
    });
});
