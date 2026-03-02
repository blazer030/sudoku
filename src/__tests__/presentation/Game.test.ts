import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import Game from "@/presentation/pages/game/Game.vue";
import { SudokuGenerator } from "@/domain/SudokuGenerator";

const knownAnswer = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const knownPuzzle = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

function spyGeneratePuzzle() {
    vi.spyOn(SudokuGenerator.prototype, "generatePuzzle").mockReturnValue({
        puzzle: knownPuzzle.map(row => [...row]),
        answer: knownAnswer.map(row => [...row]),
    });
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("Game", () => {
    it("should highlight the selected cell when clicked", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        const cell = wrapper.find("[data-testid='cell-0-0']");
        await cell.trigger("click");

        expect(cell.classes()).toContain("selected");
    });

    it("should allow selecting a tip cell", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // (0, 0) 是 tip 格子（值為 5）
        const cell = wrapper.find("[data-testid='cell-0-0']");
        await cell.trigger("click");

        expect(cell.classes()).toContain("selected");
    });

    it("should deselect when clicking the same cell again", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        const cell = wrapper.find("[data-testid='cell-0-0']");
        await cell.trigger("click");
        await cell.trigger("click");

        expect(cell.classes()).not.toContain("selected");
    });

    it("should display number in slot cell after clicking number button", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // (0, 2) 是 slot 格子，選取後按數字 4
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");

        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        expect(cell.text()).toBe("4");
    });

    it("should ignore number button when no cell is selected", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // 不選取格子，直接按數字
        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        // (0, 2) 是 slot 格子，應該仍然是空的
        const cell = wrapper.find("[data-testid='cell-0-2']");
        expect(cell.text()).toBe("");
    });

    it("should ignore number button when tip cell is selected", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // 選取 (0, 0) tip 格子（值為 5），按數字 4
        const tipCell = wrapper.find("[data-testid='cell-0-0']");
        await tipCell.trigger("click");

        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        // tip 格子仍顯示原始值
        expect(tipCell.text()).toBe("5");
    });

    it("should render slot cells as empty", () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (knownPuzzle[row][column] === 0) {
                    const cell = wrapper.find(`[data-testid="cell-${row}-${column}"]`);
                    expect(cell.text()).toBe("");
                }
            }
        }
    });

    it("should render 9x9 grid with tip cells showing their numbers", () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        const cells = wrapper.findAll("[data-testid^='cell-']");
        expect(cells).toHaveLength(81);

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (knownPuzzle[row][column] !== 0) {
                    const cell = wrapper.find(`[data-testid="cell-${row}-${column}"]`);
                    expect(cell.text()).toBe(String(knownPuzzle[row][column]));
                }
            }
        }
    });
});
