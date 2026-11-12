import { h } from "vue";
import { mount } from "@vue/test-utils";
import SudokuBoard from "@/presentation/components/sudoku-board/SudokuBoard.vue";

const CELLS = Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_unused, column) => row * 9 + column));

const mountBoard = (props: { selectedCell?: { row: number; column: number } } = {}, overlay = false) => mount(SudokuBoard, {
    props: { cells: CELLS, ...props },
    slots: {
        cell: ({ cell }: { cell: unknown }) => h("span", { "data-testid": `cell-${String(cell)}` }),
        ...(overlay ? { default: () => h("i", { "data-testid": "overlay" }) } : {}),
    },
});

describe("SudokuBoard", () => {
    it("should draw nine rows of nine cells through the cell slot, in reading order", () => {
        const wrapper = mountBoard();
        const rows = wrapper.findAll("[data-skin='board-grid'] > div");

        expect(rows).toHaveLength(9);
        expect(rows[4].findAll("span").map(cell => cell.attributes("data-testid"))).toEqual(CELLS[4].map(cell => `cell-${String(cell)}`));
    });

    it("should name the selected cell for the skin, and nothing without one", () => {
        expect(mountBoard({ selectedCell: { row: 3, column: 6 } }).attributes("data-selected-cell")).toBe("R4C7");
        expect(mountBoard().attributes("data-selected-cell")).toBeUndefined();
    });

    it("should position the grid only when something is laid over it", () => {
        expect(mountBoard().find("[data-skin='board-grid']").classes()).not.toContain("relative");

        const withOverlay = mountBoard({}, true);
        expect(withOverlay.find("[data-skin='board-grid']").classes()).toContain("relative");
        expect(withOverlay.find("[data-skin='board-grid'] > [data-testid='overlay']").exists()).toBe(true);
    });

    it("should give a page the element of a cell", () => {
        const wrapper = mountBoard();

        expect((wrapper.vm as unknown as { cellElement: (row: number, column: number) => HTMLElement | null }).cellElement(2, 5)?.dataset.testid).toBe("cell-23");
    });
});
