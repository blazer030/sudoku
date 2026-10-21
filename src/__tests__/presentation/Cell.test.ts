import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { i18n } from "@/presentation/i18n";
import Cell from "@/presentation/pages/game/components/Cell.vue";
import { PuzzleCell } from "@/domain/board/PuzzleCell";

describe("Cell", () => {
    const mountCell = (props: { puzzleCell: PuzzleCell } & Record<string, unknown>) =>
        mount(Cell, { props: { row: 0, column: 0, ...props } });

    it("should show red background and text when error=true", () => {
        const puzzleCell = new PuzzleCell(0);
        puzzleCell.entry = 5;

        const wrapper = mountCell({ puzzleCell, error: true });

        expect(wrapper.classes()).toContain("bg-error-surface");
        expect(wrapper.find("[data-testid='cell-value']").classes()).toContain("text-error");
    });

    it("should display normally when error=false", () => {
        const puzzleCell = new PuzzleCell(0);
        puzzleCell.entry = 5;

        const wrapper = mountCell({ puzzleCell, error: false });

        expect(wrapper.classes()).not.toContain("bg-error-surface");
        expect(wrapper.find("[data-testid='cell-value']").classes()).not.toContain("text-error");
    });

    it("should layer selected over same digit over peer over clue", async () => {
        const wrapper = mountCell({ puzzleCell: new PuzzleCell(5) });
        expect(wrapper.classes()).toContain("bg-cell-clue");
        expect(wrapper.find("[data-testid='cell-value']").classes()).toContain("font-bold");

        await wrapper.setProps({ peer: true });
        expect(wrapper.classes()).toContain("bg-cell-peer");

        await wrapper.setProps({ selectedDigit: 5 });
        expect(wrapper.classes()).toContain("bg-highlight");

        await wrapper.setProps({ selected: true });
        expect(wrapper.classes()).toContain("bg-cell-selected");
    });

    describe("spoken label", () => {
        const mountAt = (puzzleCell: PuzzleCell) => mount(Cell, { props: { row: 0, column: 2, puzzleCell } });

        it("should name an empty cell by row and column", () => {
            const wrapper = mountAt(new PuzzleCell(0));

            expect(wrapper.attributes("aria-label")).toBe("Row 1, column 3, empty");
            expect(wrapper.attributes("role")).toBe("button");
        });

        it("should read out the cell's digit", () => {
            const puzzleCell = new PuzzleCell(0);
            puzzleCell.entry = 5;

            expect(mountAt(puzzleCell).attributes("aria-label")).toBe("Row 1, column 3, 5");
        });

        it("should read out the notes", () => {
            const puzzleCell = new PuzzleCell(0);
            puzzleCell.toggleNote(1);
            puzzleCell.toggleNote(3);

            expect(mountAt(puzzleCell).attributes("aria-label")).toBe("Row 1, column 3, notes 1 3");
        });

        it("should name the cell in Traditional Chinese", async () => {
            const wrapper = mountAt(new PuzzleCell(0));
            i18n.global.locale.value = "zh-Hant";
            await nextTick();

            expect(wrapper.attributes("aria-label")).toBe("第 1 列第 3 欄，空白");
        });
    });

    describe("click handling", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        const pointerdown = (wrapper: { element: Element }) => {
            const event = new Event("pointerdown", { bubbles: true });
            Object.assign(event, { isPrimary: true, pointerType: "touch", button: 0, clientX: 5, clientY: 5 });
            wrapper.element.dispatchEvent(event);
        };

        it("should emit click for a normal tap", async () => {
            const wrapper = mountCell({ puzzleCell: new PuzzleCell(0) });

            pointerdown(wrapper);
            await wrapper.trigger("pointerup");
            await wrapper.trigger("click");

            expect(wrapper.emitted("click")).toHaveLength(1);
            expect(wrapper.emitted("longPress")).toBeUndefined();
        });

        it("should emit longPress and suppress the following click", async () => {
            const wrapper = mountCell({ puzzleCell: new PuzzleCell(0) });

            pointerdown(wrapper);
            vi.advanceTimersByTime(400);
            await wrapper.trigger("pointerup");
            await wrapper.trigger("click");

            expect(wrapper.emitted("longPress")).toHaveLength(1);
            expect(wrapper.emitted("click")).toBeUndefined();
        });

        it("should emit click for a tap after a long press that had no click", async () => {
            const wrapper = mountCell({ puzzleCell: new PuzzleCell(0) });

            pointerdown(wrapper);
            vi.advanceTimersByTime(400);
            await wrapper.trigger("pointerup");
            pointerdown(wrapper);
            await wrapper.trigger("pointerup");
            await wrapper.trigger("click");

            expect(wrapper.emitted("click")).toHaveLength(1);
        });
    });
});
