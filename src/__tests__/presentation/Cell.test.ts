import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
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
