import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import Cell from "@/presentation/components/cell/Cell.vue";
import PuzzleCell from "@/domain/PuzzleCell";

describe("Cell", () => {
    const mountCell = (props: Record<string, unknown>) =>
        mount(Cell, { props: { row: 0, column: 0, ...props } });

    it("error=true 時顯示紅色背景和文字", () => {
        const puzzleCell = new PuzzleCell(0);
        puzzleCell.entry = 5;

        const wrapper = mountCell({ puzzleCell, error: true });

        expect(wrapper.classes()).toContain("bg-error-light");
        expect(wrapper.find("[data-testid='cell-entry']").classes()).toContain("text-error");
    });

    it("error=false 時正常顯示", () => {
        const puzzleCell = new PuzzleCell(0);
        puzzleCell.entry = 5;

        const wrapper = mountCell({ puzzleCell, error: false });

        expect(wrapper.classes()).not.toContain("bg-error-light");
        expect(wrapper.find("[data-testid='cell-entry']").classes()).not.toContain("text-error");
    });
});
