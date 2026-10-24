import { readFileSync } from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { useSettingsStore } from "@/stores/settingsStore";
import { ARRIVAL_SETTLE_MS } from "@/presentation/components/board-cell/useArrivalMotion";
import BoardCell from "@/presentation/components/board-cell/BoardCell.vue";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import PaperDigitWriter from "@/presentation/components/style-moments/paper/PaperDigitWriter.vue";
import { declarationsOf } from "@/__tests__/style/styleSheetRules";

// Whether the browser can mask an HTML element by an SVG <mask>; jsdom's own answer is no
const maskSupport = vi.hoisted(() => ({ supported: true }));
vi.mock("@/presentation/components/style-moments/maskReferenceSupport", () => ({
    canMaskByReference: () => maskSupport.supported,
}));

describe("BoardCell", () => {
    afterEach(() => {
        localStorage.clear();
    });

    const mountCell = (props: Record<string, unknown>) =>
        mount(BoardCell, { props: { row: 0, column: 0, value: 0, ...props } });

    it("should display the value when value is non-zero", () => {
        const wrapper = mountCell({ value: 5 });

        expect(wrapper.find("[data-testid='cell-value']").text()).toBe("5");
    });

    it("should keep the digit's line box no taller than the digit, so a row under a box border keeps its height", () => {
        // A 22px digit on the default 1.5 line height plus a 3px box border outgrows a square cell,
        // which made the board taller once rows 3 or 6 held a digit.
        const wrapper = mountCell({ value: 5, row: 2 });

        expect(wrapper.find("[data-testid='cell-value']").classes()).toContain("leading-none");
    });

    it("should not grow to fit a digit whose line box is taller than a narrow cell", () => {
        // A square box grows to fit its content unless its minimum size is zero: in a 304px window a
        // cell is about 27px, under paper's 28.6px entries, and the board grew taller in paper alone
        const wrapper = mountCell({ value: 5, valueKind: "entered" });

        expect(wrapper.classes()).toEqual(expect.arrayContaining(["aspect-square", "min-w-0", "min-h-0"]));
    });

    it("should expose its variant for style sheets", () => {
        expect(mountCell({ variant: "selected" }).attributes("data-variant")).toBe("selected");
        expect(mountCell({}).attributes("data-variant")).toBe("default");
    });

    it("should mark the selected cell for style sheets, whatever its variant", () => {
        expect(mountCell({ variant: "error", selected: true }).attributes("data-selected")).toBe("");
        expect(mountCell({ variant: "selected" }).attributes("data-selected")).toBeUndefined();
    });

    it("should mark an entered digit and write it in the entry face", () => {
        const wrapper = mountCell({ value: 5, valueKind: "entered" });

        expect(wrapper.attributes("data-value-kind")).toBe("entered");
        expect(wrapper.find("[data-testid='cell-value']").classes()).toContain("font-entry");
    });

    it("should write a given digit in the clue face by default", () => {
        const wrapper = mountCell({ value: 5 });

        expect(wrapper.attributes("data-value-kind")).toBe("given");
        expect(wrapper.find("[data-testid='cell-value']").classes()).toContain("font-clue");
    });

    it("should not mark an empty cell's value kind", () => {
        expect(mountCell({ value: 0, valueKind: "entered" }).attributes("data-value-kind")).toBeUndefined();
    });

    it("should write notes in the note face", () => {
        const wrapper = mountCell({ value: 0, notes: [4] });

        expect(wrapper.findAll("span").find(span => span.text() === "4")?.classes()).toContain("font-note");
    });

    it("should keep the value's line box at its glyph size", () => {
        // A larger style face (paper's 1.3× entries) must not raise the row: the line box stays the glyph's
        for (const valueKind of ["given", "entered"]) {
            expect(mountCell({ value: 5, valueKind }).find("[data-testid='cell-value']").classes(), valueKind).toContain("leading-none");
        }
    });

    describe("arrival", () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        const stubReducedMotion = (reduce: boolean) => {
            vi.stubGlobal("matchMedia", (query: string) => ({
                matches: reduce && query === "(prefers-reduced-motion: reduce)",
                media: query,
            }));
        };

        it("should mark a newly placed digit as arriving", async () => {
            stubReducedMotion(false);
            const wrapper = mountCell({ value: 0 });

            await wrapper.setProps({ value: 5 });
            const value = wrapper.get("[data-testid='cell-value']");
            expect(value.classes()).toContain("value-arrive");

            await value.trigger("animationend");
            expect(wrapper.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");
        });

        it("should drop the arriving mark when the active style has no arrival animation", async () => {
            // Minimal and paper never animate value-arrive, so no animationend ever comes
            vi.useFakeTimers();
            try {
                stubReducedMotion(false);
                const wrapper = mountCell({ value: 0 });
                await wrapper.setProps({ value: 5 });
                expect(wrapper.get("[data-testid='cell-value']").classes()).toContain("value-arrive");

                vi.advanceTimersByTime(ARRIVAL_SETTLE_MS);
                await nextTick();

                expect(wrapper.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");
            } finally {
                vi.useRealTimers();
            }
        });

        it("should mark a digit typed over another as arriving, again on each change", async () => {
            vi.useFakeTimers();
            try {
                stubReducedMotion(false);
                const wrapper = mountCell({ value: 5 });

                await wrapper.setProps({ value: 3 });
                expect(wrapper.get("[data-testid='cell-value']").classes()).toContain("value-arrive");

                // Changing again while the class is still on drops it for a moment, so the animation replays
                await wrapper.setProps({ value: 7 });
                expect(wrapper.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");
                vi.advanceTimersByTime(100);
                await nextTick();
                expect(wrapper.get("[data-testid='cell-value']").classes()).toContain("value-arrive");
            } finally {
                vi.useRealTimers();
            }
        });

        it("should not animate digits present on mount", () => {
            stubReducedMotion(false);
            const wrapper = mountCell({ value: 5 });

            expect(wrapper.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");
        });

        it("should not animate under reduced motion", async () => {
            stubReducedMotion(true);
            const wrapper = mountCell({ value: 0 });

            await wrapper.setProps({ value: 5 });

            expect(wrapper.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");
        });

        it("should not animate a fill or an erase while motion effects are off", async () => {
            stubReducedMotion(false);
            useSettingsStore().setMotionEffects(false);
            const wrapper = mountCell({ value: 0 });

            await wrapper.setProps({ value: 5 });
            expect(wrapper.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");

            await wrapper.setProps({ value: 0 });
            expect(wrapper.classes()).not.toContain("value-leave");
        });

        it("should leave a hint reveal to its own pop", async () => {
            stubReducedMotion(false);
            const wrapper = mountCell({ value: 0, popping: true });

            await wrapper.setProps({ value: 5 });

            expect(wrapper.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");
        });
    });

    describe("leaving", () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        const stubReducedMotion = (reduce: boolean) => {
            vi.stubGlobal("matchMedia", (query: string) => ({
                matches: reduce && query === "(prefers-reduced-motion: reduce)",
                media: query,
            }));
        };

        it("should mark the cell while its digit leaves, until an animation on the cell's pseudo-element ends", async () => {
            stubReducedMotion(false);
            const wrapper = mountCell({ value: 5 });

            await wrapper.setProps({ value: 0 });
            expect(wrapper.classes()).toContain("value-leave");

            await wrapper.trigger("animationend", { pseudoElement: "::after" });
            expect(wrapper.classes()).not.toContain("value-leave");
        });

        it("should keep the leaving mark when the cell's own colour animation ends, as a completion flash does", async () => {
            // A flash already running when the digit is erased would otherwise cut the burst short
            stubReducedMotion(false);
            const wrapper = mountCell({ value: 5, groupKinds: ["row"], groupEffectId: 1 });

            await wrapper.setProps({ value: 0 });
            await wrapper.trigger("animationend", { pseudoElement: "" });

            expect(wrapper.classes()).toContain("value-leave");
        });

        it("should drop the leaving mark on its own when the active style has no leaving animation", async () => {
            // Undo, game review and the walkthrough clear digits too; the mark must never stick
            vi.useFakeTimers();
            try {
                stubReducedMotion(false);
                const wrapper = mountCell({ value: 5 });
                await wrapper.setProps({ value: 0 });
                expect(wrapper.classes()).toContain("value-leave");

                vi.advanceTimersByTime(ARRIVAL_SETTLE_MS);
                await nextTick();

                expect(wrapper.classes()).not.toContain("value-leave");
            } finally {
                vi.useRealTimers();
            }
        });

        it("should keep the leaving mark when an animation inside the cell ends", async () => {
            stubReducedMotion(false);
            const wrapper = mountCell({ value: 5 });
            await wrapper.setProps({ value: 0, notes: [3] });

            await wrapper.get("span").trigger("animationend");

            expect(wrapper.classes()).toContain("value-leave");
        });

        it("should not mark a leaving digit under reduced motion", async () => {
            stubReducedMotion(true);
            const wrapper = mountCell({ value: 5 });

            await wrapper.setProps({ value: 0 });

            expect(wrapper.classes()).not.toContain("value-leave");
        });

        it("should settle an arrival when the cell's own animation ends", async () => {
            // A style may draw the arrival on the cell (8-bit's burst) as well as on the digit
            stubReducedMotion(false);
            const wrapper = mountCell({ value: 0 });
            await wrapper.setProps({ value: 5 });

            await wrapper.trigger("animationend", { pseudoElement: "::after" });

            expect(wrapper.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");
        });
    });

    describe("digit writer", () => {
        // A style's writer draws the mask its arriving digit is shown through; this one only says what it was given
        const TestWriter = defineComponent({
            props: { digit: { type: Number, required: true }, maskId: { type: String, required: true } },
            emits: ["written"],
            setup: (props) => () => h("svg", { "data-testid": "test-writer", "data-digit": props.digit, "data-mask-id": props.maskId }),
        });
        const originalWriter = STYLE_MOMENTS.minimal.digitWriter;

        beforeEach(() => {
            vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query }));
            useSettingsStore().setStyle("minimal");
        });

        afterEach(() => {
            STYLE_MOMENTS.minimal.digitWriter = originalWriter;
            maskSupport.supported = true;
            vi.unstubAllGlobals();
        });

        const enterDigit = async (digit: number) => {
            const wrapper = mountCell({ value: 0 });
            await wrapper.setProps({ value: digit });
            return wrapper;
        };

        it("should let the style's writer draw a digit while it arrives, masking the digit by its drawing", async () => {
            STYLE_MOMENTS.minimal.digitWriter = TestWriter;
            const wrapper = await enterDigit(4);

            const writer = wrapper.get("[data-testid='test-writer']");
            expect(writer.attributes("data-digit")).toBe("4");
            const maskId = writer.attributes("data-mask-id") ?? "";
            expect(maskId).not.toBe("");
            expect(wrapper.get("[data-testid='cell-value']").attributes("style")).toContain(`--digit-writer-mask: url(#${maskId})`);
        });

        it("should give each cell's writer its own mask", async () => {
            STYLE_MOMENTS.minimal.digitWriter = TestWriter;
            const board = mount(defineComponent({
                props: { digit: { type: Number, required: true } },
                setup: (props) => () => [0, 1].map(column => h(BoardCell, { row: 0, column, value: props.digit })),
            }), { props: { digit: 0 } });
            await board.setProps({ digit: 4 });

            const maskIds = board.findAll("[data-testid='test-writer']").map(writer => writer.attributes("data-mask-id"));
            expect(maskIds).toHaveLength(2);
            expect(maskIds[0]).not.toBe(maskIds[1]);
        });

        it("should settle the arrival once the writer has written the digit", async () => {
            STYLE_MOMENTS.minimal.digitWriter = TestWriter;
            const wrapper = await enterDigit(4);

            wrapper.findComponent(TestWriter).vm.$emit("written");
            await nextTick();

            expect(wrapper.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");
            expect(wrapper.find("[data-testid='test-writer']").exists()).toBe(false);
            expect(wrapper.get("[data-testid='cell-value']").attributes("style") ?? "").not.toContain("--digit-writer-mask");
        });

        it("should draw nothing for a digit already there or for a style without a writer", async () => {
            STYLE_MOMENTS.minimal.digitWriter = TestWriter;
            expect(mountCell({ value: 4 }).find("[data-testid='test-writer']").exists()).toBe(false);

            STYLE_MOMENTS.minimal.digitWriter = originalWriter;
            const wrapper = await enterDigit(4);
            expect(wrapper.find("[data-testid='test-writer']").exists()).toBe(false);
            expect(wrapper.get("[data-testid='cell-value']").attributes("style") ?? "").not.toContain("--digit-writer-mask");
        });

        it("should write a digit in with paper's pen and settle when it is written", async () => {
            useSettingsStore().setStyle("paper");
            const wrapper = await enterDigit(7);

            const writer = wrapper.findComponent(PaperDigitWriter);
            const maskId = String(writer.props("maskId"));
            expect(writer.props("digit")).toBe(7);
            expect(wrapper.get("[data-testid='cell-value']").attributes("style")).toContain(`url(#${maskId})`);

            await wrapper.get(".paper-digit-settle").trigger("animationend");

            expect(wrapper.get("[data-testid='cell-value']").classes()).not.toContain("value-arrive");
            expect(wrapper.findComponent(PaperDigitWriter).exists()).toBe(false);
        });

        // A browser that cannot mask an HTML element by an SVG <mask> (WebKit) would hide the digit, so it
        // shows the digit plainly instead
        it("should show the digit plainly where the browser cannot mask by an SVG mask", async () => {
            STYLE_MOMENTS.minimal.digitWriter = TestWriter;
            maskSupport.supported = false;
            const wrapper = await enterDigit(4);

            expect(wrapper.find("[data-testid='test-writer']").exists()).toBe(false);
            expect(wrapper.get("[data-testid='cell-value']").text()).toBe("4");
            expect(wrapper.get("[data-testid='cell-value']").attributes("style") ?? "").not.toContain("--digit-writer-mask");
        });

        it("should draw nothing while motion effects are off", async () => {
            STYLE_MOMENTS.minimal.digitWriter = TestWriter;
            useSettingsStore().setMotionEffects(false);
            const wrapper = await enterDigit(4);

            expect(wrapper.find("[data-testid='test-writer']").exists()).toBe(false);
        });
    });

    it("should render notes grid when value is zero and notes are provided", () => {
        const wrapper = mountCell({ value: 0, notes: [1, 3, 5] });

        const noteTexts = wrapper.findAll("span").map((span) => span.text());
        expect(noteTexts).toContain("1");
        expect(noteTexts).toContain("3");
        expect(noteTexts).toContain("5");
        expect(noteTexts).not.toContain("2");
    });

    it.each([
        ["default", "bg-card"],
        ["clue", "bg-cell-clue"],
        ["selected", "bg-cell-selected"],
        ["focus", "bg-cell-focus"],
        ["scope", "bg-cell-scope"],
        ["error", "bg-error-surface"],
        ["same-digit", "bg-highlight"],
        ["peer", "bg-cell-peer"],
    ])("variant='%s' applies background class '%s'", (variant, expectedClass) => {
        const wrapper = mountCell({ variant });

        expect(wrapper.classes()).toContain(expectedClass);
    });

    it("should outline the selected cell inside its edges", () => {
        const wrapper = mountCell({ variant: "selected" });

        expect(wrapper.classes()).toEqual(expect.arrayContaining(["ring-2", "ring-inset", "ring-primary"]));
    });

    it("should keep player notes at least 10px", () => {
        const wrapper = mountCell({ value: 0, notes: [4] });

        const note = wrapper.findAll("span").find(span => span.text() === "4");
        expect(note?.classes()).toContain("text-[length:calc(clamp(10px,-0.49px+2.26vw,14px)*var(--note-scale,1))]");
        expect(note?.classes()).toContain("text-note");
    });

    it("should keep solver candidates at least 10px", () => {
        const wrapper = mountCell({ value: 0, notes: [4], noteTone: "solver" });

        const note = wrapper.findAll("span").find(span => span.text() === "4");
        expect(note?.classes()).toContain("text-[length:calc(clamp(10px,-0.49px+2.7vw,15px)*var(--note-scale,1))]");
    });

    it("should render valueFontWeight bold", () => {
        const wrapper = mountCell({ value: 5, valueFontWeight: "bold" });

        expect(wrapper.find("[data-testid='cell-value']").classes()).toContain("font-bold");
    });

    it.each([
        ["normal", "text-foreground"],
        ["error", "text-error"],
        ["primary", "text-primary"],
    ])("valueTextColor='%s' applies text color class '%s'", (colorName, expectedClass) => {
        const wrapper = mountCell({ value: 5, valueTextColor: colorName });

        expect(wrapper.find("[data-testid='cell-value']").classes()).toContain(expectedClass);
    });

    it("should render highlightedNote as a primary pill", () => {
        const wrapper = mountCell({ value: 0, notes: [1, 2, 3], highlightedNote: 2 });

        const spans = wrapper.findAll("span");
        const highlightedSpan = spans.find((span) => span.text() === "2");
        expect(highlightedSpan?.classes()).toContain("bg-primary");
        expect(highlightedSpan?.classes()).toContain("text-on-primary");
    });

    it("should mark the highlighted note so a style can redraw it", () => {
        const wrapper = mountCell({ value: 0, notes: [1, 2, 3], highlightedNote: 2 });
        const note = (digit: number) => wrapper.findAll("span").find(span => span.text() === `${digit}`);

        expect(note(2)?.attributes("data-note-highlight")).toBeDefined();
        expect(note(1)?.attributes("data-note-highlight")).toBeUndefined();
    });

    it("should apply top-left corner rounding at (0, 0)", () => {
        const wrapper = mountCell({ row: 0, column: 0 });

        expect(wrapper.classes()).toContain("rounded-tl-lg");
    });

    it("should apply bottom-right corner rounding at (8, 8)", () => {
        const wrapper = mount(BoardCell, { props: { row: 8, column: 8, value: 0 } });

        expect(wrapper.classes()).toContain("rounded-br-lg");
    });

    it("should apply thick right border at box boundary columns (2, 5)", () => {
        const wrapperCol2 = mount(BoardCell, { props: { row: 0, column: 2, value: 0 } });
        const wrapperCol5 = mount(BoardCell, { props: { row: 0, column: 5, value: 0 } });

        expect(wrapperCol2.classes()).toContain("border-r-3");
        expect(wrapperCol5.classes()).toContain("border-r-3");
    });

    it("should draw grid lines in the board's line colours, which a style can redraw", () => {
        const wrapper = mountCell({ row: 0, column: 0, variant: "clue" });
        const boxEdge = mountCell({ row: 2, column: 2 });

        expect(wrapper.classes()).toContain("border-r-(color:--board-line)");
        expect(wrapper.classes()).toContain("border-b-(color:--board-line)");
        expect(wrapper.classes()).not.toContain("border-r-border");
        expect(boxEdge.classes()).toContain("border-r-(color:--board-box-line)");
        expect(boxEdge.classes()).toContain("border-b-(color:--board-box-line)");
    });

    it("should default the board's line colours to translucent ink, so they still show on clue cells", () => {
        const indexCss = readFileSync("src/style/index.css", "utf8");

        expect(indexCss).toContain("--board-line: color-mix(in oklab, var(--color-foreground) 12%, transparent);");
        expect(indexCss).toContain("--board-box-line: color-mix(in oklab, var(--color-foreground) 20%, transparent);");
    });

    it("should apply thick bottom border at box boundary rows (2, 5)", () => {
        const wrapperRow2 = mount(BoardCell, { props: { row: 2, column: 0, value: 0 } });
        const wrapperRow5 = mount(BoardCell, { props: { row: 5, column: 0, value: 0 } });

        expect(wrapperRow2.classes()).toContain("border-b-3");
        expect(wrapperRow5.classes()).toContain("border-b-3");
    });

    it("should render eliminated digits with diagonal strike and error color in notes", () => {
        const wrapper = mountCell({ value: 0, notes: [1, 2, 3, 4], eliminatedDigits: [2, 4] });

        const elim2 = wrapper.find("[data-testid='eliminated-note-2']");
        const elim4 = wrapper.find("[data-testid='eliminated-note-4']");
        expect(elim2.exists()).toBe(true);
        expect(elim2.classes()).toContain("strike-diagonal");
        expect(elim2.classes()).toContain("text-error");
        expect(elim4.exists()).toBe(true);
    });

    it("should display eliminated digits even when they are not in notes", () => {
        const wrapper = mountCell({ value: 0, notes: [1, 3], eliminatedDigits: [2] });

        expect(wrapper.find("[data-testid='eliminated-note-2']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='eliminated-note-2']").text()).toBe("2");
    });

    it("should place itself on the board through its row, column and box, counted from zero", () => {
        const style = mountCell({ row: 4, column: 7 }).attributes("style");

        expect(style).toContain("--cell-row: 4");
        expect(style).toContain("--cell-column: 7");
        expect(style).toContain("--cell-box: 5");
    });

    it("should name the kinds of completed group it belongs to while in an effect", () => {
        expect(mountCell({ groupKinds: ["row", "box"], groupEffectId: 1 }).attributes("data-group")).toBe("row box");
        expect(mountCell({}).attributes("data-group")).toBeUndefined();
    });

    it("should restart its effect when a new effect takes over while it is still marked", async () => {
        // A CSS animation starts again only once its cell has been seen without it
        const wrapper = mountCell({ groupKinds: ["row"], groupEffectId: 1 });
        const groupHistory: (string | null)[] = [];
        const observer = new MutationObserver((records) => {
            for (const record of records) groupHistory.push((record.target as HTMLElement).getAttribute("data-group"));
        });
        observer.observe(wrapper.element as HTMLElement, { attributes: true, attributeFilter: ["data-group"] });

        await wrapper.setProps({ groupKinds: ["row", "column"], groupEffectId: 2 });
        await nextTick();
        await nextTick();
        observer.disconnect();

        expect(groupHistory).toContain(null);
        expect(wrapper.attributes("data-group")).toBe("row column");
    });

    it("should give a cell in a group effect its own delay, rippling from the origin", () => {
        const indexCss = readFileSync("src/style/index.css", "utf8");

        const delay = declarationsOf(indexCss, "[data-group-effect] [data-group]").get("--group-delay") ?? "";
        expect(delay).toContain("max(var(--cell-row) - var(--origin-row), var(--origin-row) - var(--cell-row))");
        expect(delay).toContain("max(var(--cell-column) - var(--origin-column), var(--origin-column) - var(--cell-column))");
        expect(delay).toContain("* var(--group-ripple-step)");
    });

    it("should glow the whole cell and pop the digit while popping", () => {
        const wrapper = mountCell({ value: 5, popping: true });

        expect(wrapper.classes()).toContain("animate-hint-reveal-glow");
        expect(wrapper.find("[data-testid='cell-value']").classes()).toContain("animate-hint-reveal-pop");
    });

    it("should neither flash, glow nor pop while motion effects are off", () => {
        useSettingsStore().setMotionEffects(false);
        const wrapper = mountCell({ value: 5, groupKinds: ["row"], groupEffectId: 1, popping: true });

        expect(wrapper.attributes("data-group")).toBeUndefined();
        expect(wrapper.classes()).not.toContain("animate-hint-reveal-glow");
        expect(wrapper.find("[data-testid='cell-value']").classes()).not.toContain("animate-hint-reveal-pop");
    });

    it("should not glow when not popping", () => {
        const wrapper = mountCell({ value: 5 });

        expect(wrapper.classes()).not.toContain("animate-hint-reveal-glow");
    });
});
