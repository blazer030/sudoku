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
        ["selected", "bg-primary-light"],
        ["focus", "bg-primary/40"],
        ["scope", "bg-primary/15"],
        ["error", "bg-error-light"],
        ["same-digit", "bg-highlight"],
    ])("variant='%s' applies background class '%s'", (variant, expectedClass) => {
        const wrapper = mountCell({ variant });

        expect(wrapper.classes()).toContain(expectedClass);
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
        expect(highlightedSpan?.classes()).toContain("text-white");
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
});
