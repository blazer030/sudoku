import { describe, expect, it } from "vitest";
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

        expect(wrapper.classes()).toContain("bg-error-light");
        expect(wrapper.find("[data-testid='cell-entry']").classes()).toContain("text-error");
    });

    it("should display normally when error=false", () => {
        const puzzleCell = new PuzzleCell(0);
        puzzleCell.entry = 5;

        const wrapper = mountCell({ puzzleCell, error: false });

        expect(wrapper.classes()).not.toContain("bg-error-light");
        expect(wrapper.find("[data-testid='cell-entry']").classes()).not.toContain("text-error");
    });
});
