import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import Game from "@/presentation/pages/game/Game.vue";
import { knownPuzzle, spyGeneratePuzzle } from "@/__tests__/fixtures/knownPuzzle";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("Game", () => {
    it("should highlight the selected cell when clicked", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // (0, 2) 是 slot 格子
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");

        expect(cell.classes()).toContain("selected");
    });

    it("should not select a clue cell", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // (0, 0) 是 clue 格子（值為 5）
        const cell = wrapper.find("[data-testid='cell-0-0']");
        await cell.trigger("click");

        expect(cell.classes()).not.toContain("selected");
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

    it("should ignore number button when clue cell is selected", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // 選取 (0, 0) clue 格子（值為 5），按數字 4
        const clueCell = wrapper.find("[data-testid='cell-0-0']");
        await clueCell.trigger("click");

        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        // clue 格子仍顯示原始值
        expect(clueCell.text()).toBe("5");
    });

    it("should select number button when clicked without cell selected", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        expect(numberButton.classes()).toContain("bg-sky-50");
    });

    it("should fill slot cell when number is selected first then cell is clicked", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // 先選數字 4
        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        // 再點 (0, 2) slot 格子
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");

        expect(cell.text()).toBe("4");
    });

    it("should fill mulcluele slot cells consecutively in number-first mode", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // 選數字 1
        const numberButton = wrapper.find("[data-testid='number-1']");
        await numberButton.trigger("click");

        // 連續點兩個 slot 格子
        const cell1 = wrapper.find("[data-testid='cell-0-3']");
        await cell1.trigger("click");
        const cell2 = wrapper.find("[data-testid='cell-0-5']");
        await cell2.trigger("click");

        expect(cell1.text()).toBe("1");
        expect(cell2.text()).toBe("1");
    });

    it("should not fill clue cell in number-first mode", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // 選數字 4，點 clue 格子 (0, 0)
        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        const clueCell = wrapper.find("[data-testid='cell-0-0']");
        await clueCell.trigger("click");

        // clue 格子仍顯示原始值 5
        expect(clueCell.text()).toBe("5");
    });

    it("should deselect number when clicking the same number button again", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");
        await numberButton.trigger("click");

        expect(numberButton.classes()).not.toContain("bg-sky-50");
    });

    it("should clear cell when clicking a cell that already has the selected number", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // 先用格子優先模式填入 4 到 (0, 2)
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");
        const numberButton4 = wrapper.find("[data-testid='number-4']");
        await numberButton4.trigger("click");
        expect(cell.text()).toBe("4");

        // 取消格子選取
        await cell.trigger("click");

        // 進入數字優先模式，選 4，再點同一格子
        await numberButton4.trigger("click");
        await cell.trigger("click");

        expect(cell.text()).toBe("");
    });

    it("should highlight conflicting cells when inputting a wrong number", async () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // (0, 2) 是 slot，填入 5 → 與 (0, 0) 的 clue=5 同行衝突
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");
        const numberButton5 = wrapper.find("[data-testid='number-5']");
        await numberButton5.trigger("click");

        const conflictCell = wrapper.find("[data-testid='cell-0-0']");
        expect(conflictCell.classes()).toContain("conflict");
    });

    it("should show cursor-pointer on slot cells", () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // (0, 2) 是 slot 格子
        const slotCell = wrapper.find("[data-testid='cell-0-2']");
        expect(slotCell.classes()).toContain("cursor-pointer");
    });

    it("should not show cursor-pointer on clue cells", () => {
        spyGeneratePuzzle();
        const wrapper = mount(Game);

        // (0, 0) 是 clue 格子
        const clueCell = wrapper.find("[data-testid='cell-0-0']");
        expect(clueCell.classes()).not.toContain("cursor-pointer");
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

    it("should render 9x9 grid with clue cells showing their numbers", () => {
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
