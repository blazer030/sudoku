import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import BlueprintDigitWriter from "@/presentation/components/style-moments/blueprint/BlueprintDigitWriter.vue";
import { BLUEPRINT_DIGIT_FACE, type BlueprintDigit } from "@/presentation/components/style-moments/blueprint/blueprintDigitOutlines";
import BoardCell from "@/presentation/components/board-cell/BoardCell.vue";
import { useSettingsStore } from "@/stores/settingsStore";

// Whether the browser can mask an HTML element by an SVG <mask>; jsdom's own answer is no
vi.mock("@/presentation/components/style-moments/maskReferenceSupport", () => ({
    canMaskByReference: () => true,
}));

const DIGITS: BlueprintDigit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const mountWriter = (digit: number, maskId = "writer-mask") => mount(BlueprintDigitWriter, { props: { digit, maskId } });

describe("BlueprintDigitWriter", () => {
    it.each(DIGITS)("should plot the outline of %i as one path traced along its whole length", (digit) => {
        const outlines = mountWriter(digit).findAll(".blueprint-digit-outline");

        expect(outlines).toHaveLength(1);
        expect(outlines[0].element.tagName).toBe("path");
        expect(outlines[0].attributes("d")).toBe(BLUEPRINT_DIGIT_FACE.outlines[digit]);
        expect(outlines[0].attributes("d")).not.toBe("");
        expect(outlines[0].attributes("pathLength")).toBe("1");
    });

    it("should hide its drawing from assistive technology and let taps through to the cell", () => {
        const writer = mountWriter(4);

        const layers = writer.findAll("svg");
        expect(layers.length).toBeGreaterThan(0);
        for (const layer of layers) {
            expect(layer.attributes("aria-hidden")).toBe("true");
            expect(layer.classes()).toContain("pointer-events-none");
        }
    });

    // In the font's units y grows upward from the baseline; the layer is the digit's em square, one em on the
    // cell's centre as the digit's line box is, the glyph's advance centred on it
    it.each(DIGITS)("should lay the outline of %i on the digit, its advance centred and its baseline matching", (digit) => {
        const writer = mountWriter(digit);
        const { unitsPerEm, baselineEm, advances } = BLUEPRINT_DIGIT_FACE;
        const layer = writer.get(".blueprint-digit-outline-layer");
        const transform = writer.get(".blueprint-digit-outline").attributes("transform") ?? "";
        const [a, b, c, d, e, f] = (/matrix\(([^)]*)\)/.exec(transform)?.[1] ?? "").split(/[\s,]+/).map(Number);
        const placeInEm = (x: number, y: number): [number, number] => [(a * x + c * y + e) / unitsPerEm, (b * x + d * y + f) / unitsPerEm];

        expect(layer.attributes("viewBox")).toBe(`0 0 ${unitsPerEm} ${unitsPerEm}`);
        // For the skin to set the outline's 0.8px in these units
        expect(layer.attributes("style")).toContain(`--blueprint-digit-units-per-em: ${unitsPerEm}`);
        expect(layer.classes()).toEqual(expect.arrayContaining(["absolute", "left-1/2", "top-1/2", "size-[1em]", "overflow-visible", "text-[length:calc(22px*var(--entry-scale,1))]"]));
        expect(placeInEm(0, 0)[0]).toBeCloseTo((1 - advances[digit]) / 2, 6);
        expect(placeInEm(0, 0)[1]).toBeCloseTo(baselineEm, 6);
        expect(placeInEm(unitsPerEm * advances[digit], 0)[0]).toBeCloseTo((1 + advances[digit]) / 2, 6);
        expect(placeInEm(0, unitsPerEm)[1]).toBeCloseTo(baselineEm - 1, 6);
    });

    it("should sweep a horizontal and a vertical crosshair across the cell, crossing at its centre", () => {
        const writer = mountWriter(4);

        const crosshairs = writer.findAll(".blueprint-digit-crosshair");
        expect(crosshairs.map(crosshair => crosshair.attributes("data-axis"))).toEqual(["horizontal", "vertical"]);
        const [horizontal, vertical] = crosshairs;
        expect([horizontal.attributes("x1"), horizontal.attributes("y1"), horizontal.attributes("x2"), horizontal.attributes("y2")]).toEqual(["0", "50%", "100%", "50%"]);
        expect([vertical.attributes("x1"), vertical.attributes("y1"), vertical.attributes("x2"), vertical.attributes("y2")]).toEqual(["50%", "0", "50%", "100%"]);
        expect(writer.get(".blueprint-digit-crosshairs").classes()).toEqual(expect.arrayContaining(["absolute", "inset-0", "size-full", "overflow-visible"]));
    });

    // The mask hides the digit until it is inked in: one layer over the digit's box and well past it
    it("should render the mask the digit is shown through, inked in by one layer", () => {
        const mask = mountWriter(4).get("mask#writer-mask");

        expect(mask.attributes("style")).toContain("mask-type: alpha");
        expect(mask.attributes("maskContentUnits")).toBe("objectBoundingBox");
        const ink = mask.findAll(".blueprint-digit-ink");
        expect(ink).toHaveLength(1);
        expect([ink[0].attributes("x"), ink[0].attributes("y"), ink[0].attributes("width"), ink[0].attributes("height")]).toEqual(["-1", "-1", "3", "3"]);
        expect(ink[0].attributes("fill")).toBe("currentColor");
    });

    it("should give each writer its own mask", () => {
        const first = mountWriter(4, "first");
        const second = mountWriter(4, "second");

        expect(first.find("mask#first").exists()).toBe(true);
        expect(first.find("mask#second").exists()).toBe(false);
        expect(second.find("mask#second").exists()).toBe(true);
    });

    it("should say it has written the digit only once it is inked in, not when the outline or crosshairs end", async () => {
        const writer = mountWriter(4);

        await writer.get(".blueprint-digit-outline").trigger("animationend");
        await writer.get(".blueprint-digit-crosshairs").trigger("animationend");
        for (const crosshair of writer.findAll(".blueprint-digit-crosshair")) await crosshair.trigger("animationend");
        expect(writer.emitted("written")).toBeUndefined();

        await writer.get(".blueprint-digit-ink").trigger("animationend");
        expect(writer.emitted("written")).toHaveLength(1);
    });

    it.each([0, 10])("should plot no outline for %i, only inking it in", (digit) => {
        const writer = mountWriter(digit);

        expect(writer.findAll(".blueprint-digit-outline")).toHaveLength(0);
        expect(writer.findAll(".blueprint-digit-ink")).toHaveLength(1);
    });

    // Typing quickly: a digit typed over one still being plotted replaces it with a fresh writer
    describe("on the board", () => {
        beforeEach(() => {
            vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query }));
            useSettingsStore().setStyle("blueprint");
        });

        afterEach(() => {
            vi.useRealTimers();
            vi.unstubAllGlobals();
            localStorage.clear();
        });

        it("should plot a new digit typed over one still being plotted with a new writer", async () => {
            vi.useFakeTimers();
            const cell = mount(BoardCell, { props: { row: 0, column: 0, value: 0, valueKind: "entered" } });

            await cell.setProps({ value: 4 });
            const firstWriter = cell.findComponent(BlueprintDigitWriter);
            expect(firstWriter.props("digit")).toBe(4);

            await cell.setProps({ value: 7 });
            expect(cell.findComponent(BlueprintDigitWriter).exists()).toBe(false);
            vi.advanceTimersByTime(100);
            await nextTick();

            const secondWriter = cell.findComponent(BlueprintDigitWriter);
            expect(secondWriter.props("digit")).toBe(7);
            expect(secondWriter.element === firstWriter.element).toBe(false);
            expect(cell.get(".blueprint-digit-outline").attributes("d")).toBe(BLUEPRINT_DIGIT_FACE.outlines[7]);
            expect(cell.get("[data-testid='cell-value']").attributes("style")).toContain(`url(#${String(secondWriter.props("maskId"))})`);

            await cell.get(".blueprint-digit-ink").trigger("animationend");
            expect(cell.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");
            expect(cell.findComponent(BlueprintDigitWriter).exists()).toBe(false);
        });

        // The outline's and crosshairs' animations end inside the cell; only the ink settles the digit
        it("should keep the digit arriving while the outline and crosshairs end", async () => {
            vi.useFakeTimers();
            const cell = mount(BoardCell, { props: { row: 0, column: 0, value: 0, valueKind: "entered" } });

            await cell.setProps({ value: 4 });
            vi.advanceTimersByTime(100);
            await nextTick();
            await cell.get(".blueprint-digit-outline").trigger("animationend");
            await cell.get(".blueprint-digit-crosshairs").trigger("animationend");

            expect(cell.get("[data-testid='cell-value']").classes()).toContain("value-arrive");
            expect(cell.findComponent(BlueprintDigitWriter).exists()).toBe(true);
        });
    });
});
