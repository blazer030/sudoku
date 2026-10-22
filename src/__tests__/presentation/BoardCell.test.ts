import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import BoardCell from "@/presentation/components/board-cell/BoardCell.vue";

describe("BoardCell", () => {
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
        expect(note?.classes()).toContain("text-[clamp(10px,-0.49px+2.26vw,14px)]");
        expect(note?.classes()).toContain("text-note");
    });

    it("should keep solver candidates at least 10px", () => {
        const wrapper = mountCell({ value: 0, notes: [4], noteTone: "solver" });

        const note = wrapper.findAll("span").find(span => span.text() === "4");
        expect(note?.classes()).toContain("text-[clamp(10px,-0.49px+2.7vw,15px)]");
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

    it("should draw thin grid lines in translucent ink so they show between clue cells", () => {
        const wrapper = mountCell({ row: 0, column: 0, variant: "clue" });

        expect(wrapper.classes()).toContain("border-r-foreground/12");
        expect(wrapper.classes()).toContain("border-b-foreground/12");
        expect(wrapper.classes()).not.toContain("border-r-border");
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

    it("should apply flash animation class when flashing", () => {
        const wrapper = mountCell({ value: 0, flashing: true });

        expect(wrapper.classes()).toContain("animate-completion-flash");
    });

    it("should glow the whole cell and pop the digit while popping", () => {
        const wrapper = mountCell({ value: 5, popping: true });

        expect(wrapper.classes()).toContain("animate-hint-reveal-glow");
        expect(wrapper.find("[data-testid='cell-value']").classes()).toContain("animate-hint-reveal-pop");
    });

    it("should not glow when not popping", () => {
        const wrapper = mountCell({ value: 5 });

        expect(wrapper.classes()).not.toContain("animate-hint-reveal-glow");
    });
});
