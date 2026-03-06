import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import Game from "@/presentation/pages/game/Game.vue";
import { knownAnswer, knownPuzzle, createKnownSudoku } from "@/__tests__/fixtures/knownPuzzle";
import type { GameState } from "@/application/GameState";
import Cell from "@/presentation/components/cell/Cell.vue";
import CellHighlight from "@/domain/CellHighlight";
import { useGameStore } from "@/stores/gameStore";
import { getGameHistory } from "@/application/Statistics";
import { hasSavedGame, loadGame, saveGame } from "@/application/GameStorage";

function createTestRouter() {
    return createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/game", component: Game }, { path: "/", component: { template: "<div/>" } }],
    });
}

function mountGame(difficulty = "easy") {
    const pinia = createPinia();
    const router = createTestRouter();
    const gameStore = useGameStore(pinia);
    gameStore.sudoku = createKnownSudoku();
    gameStore.setDifficulty(difficulty as "easy" | "medium" | "hard");
    return mount(Game, { global: { plugins: [pinia, router] } });
}

function mountContinueGame(savedState: GameState) {
    saveGame(savedState);
    const pinia = createPinia();
    const router = createTestRouter();
    const gameStore = useGameStore(pinia);
    gameStore.loadSavedGame(savedState);
    return mount(Game, { global: { plugins: [pinia, router] } });
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.clear();
});

describe("Game", () => {
    it("should redirect to home when store has no active game", async () => {
        const pinia = createPinia();
        const router = createTestRouter();
        await router.push("/game");
        await router.isReady();
        mount(Game, { global: { plugins: [pinia, router] } });
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/");
    });

    it("should render board from store sudoku instance", () => {
        const pinia = createPinia();
        const router = createTestRouter();
        const gameStore = useGameStore(pinia);
        gameStore.sudoku = createKnownSudoku();
        gameStore.setDifficulty("easy");
        const wrapper = mount(Game, { global: { plugins: [pinia, router] } });

        // clue cells should show their numbers
        expect(wrapper.find("[data-testid='cell-0-0']").text()).toBe("5");
        expect(wrapper.find("[data-testid='cell-0-1']").text()).toBe("3");
        // slot cells should be empty
        expect(wrapper.find("[data-testid='cell-0-2']").text()).toBe("");
    });

    it("should start timer from store elapsedSeconds", async () => {
        vi.useFakeTimers();
        const pinia = createPinia();
        const router = createTestRouter();
        const gameStore = useGameStore(pinia);
        gameStore.sudoku = createKnownSudoku();
        gameStore.setDifficulty("easy");
        gameStore.elapsedSeconds = 60;
        const wrapper = mount(Game, { global: { plugins: [pinia, router] } });

        expect(wrapper.find("[data-testid='timer']").text()).toBe("01:00");

        await vi.advanceTimersByTimeAsync(3000);
        expect(wrapper.find("[data-testid='timer']").text()).toBe("01:03");
    });

    it("should highlight the selected cell when clicked", async () => {
        const wrapper = mountGame();

        // (0, 2) 是 slot 格子
        await wrapper.find("[data-testid='cell-0-2']").trigger("click");

        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("selected")).toBe(true);
    });

    it("should not select a clue cell", async () => {
        const wrapper = mountGame();

        // (0, 0) 是 clue 格子（值為 5）
        await wrapper.find("[data-testid='cell-0-0']").trigger("click");

        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-0']").props("selected")).toBeFalsy();
    });

    it("should deselect when clicking the same cell again", async () => {
        const wrapper = mountGame();

        await wrapper.find("[data-testid='cell-0-2']").trigger("click");
        await wrapper.find("[data-testid='cell-0-2']").trigger("click");

        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("selected")).toBeFalsy();
    });

    it("should display number in slot cell after clicking number button", async () => {
        const wrapper = mountGame();

        // (0, 2) 是 slot 格子，選取後按數字 4
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");

        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        expect(cell.text()).toBe("4");
    });

    it("should ignore number button when no cell is selected", async () => {
        const wrapper = mountGame();

        // 不選取格子，直接按數字
        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        // (0, 2) 是 slot 格子，應該仍然是空的
        const cell = wrapper.find("[data-testid='cell-0-2']");
        expect(cell.text()).toBe("");
    });

    it("should ignore number button when clue cell is selected", async () => {
        const wrapper = mountGame();

        // 選取 (0, 0) clue 格子（值為 5），按數字 4
        const clueCell = wrapper.find("[data-testid='cell-0-0']");
        await clueCell.trigger("click");

        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        // clue 格子仍顯示原始值
        expect(clueCell.text()).toBe("5");
    });

    it("should select number button when clicked without cell selected", async () => {
        const wrapper = mountGame();

        await wrapper.find("[data-testid='number-4']").trigger("click");

        expect(wrapper.find("[data-testid='number-4']").classes()).toContain("bg-primary");
    });

    it("should fill slot cell when number is selected first then cell is clicked", async () => {
        const wrapper = mountGame();

        // 先選數字 4
        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        // 再點 (0, 2) slot 格子
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");

        expect(cell.text()).toBe("4");
    });

    it("should fill multiple slot cells consecutively in number-first mode", async () => {
        const wrapper = mountGame();

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
        const wrapper = mountGame();

        // 選數字 4，點 clue 格子 (0, 0)
        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        const clueCell = wrapper.find("[data-testid='cell-0-0']");
        await clueCell.trigger("click");

        // clue 格子仍顯示原始值 5
        expect(clueCell.text()).toBe("5");
    });

    it("should deselect number when clicking the same number button again", async () => {
        const wrapper = mountGame();

        await wrapper.find("[data-testid='number-4']").trigger("click");
        await wrapper.find("[data-testid='number-4']").trigger("click");

        expect(wrapper.find("[data-testid='number-4']").classes()).not.toContain("bg-primary");
    });

    it("should clear cell when clicking a cell that already has the selected number", async () => {
        const wrapper = mountGame();

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

    it("should show game complete modal when all cells are correctly filled", async () => {
        const wrapper = mountGame();

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                const cell = wrapper.find(`[data-testid='cell-${row}-${column}']`);
                if (cell.text() !== "") continue;

                const value = knownAnswer[row][column];
                const numberButton = wrapper.find(`[data-testid='number-${value}']`);
                await numberButton.trigger("click");
                await cell.trigger("click");
                await numberButton.trigger("click");
            }
        }

        const modal = wrapper.find("[data-testid='game-complete-modal']");
        expect(modal.exists()).toBe(true);
        expect(modal.text()).toContain("Congratulations!");
        expect(modal.text()).toContain("You solved the puzzle!");
        expect(modal.text()).toContain("00:00");
        expect(modal.text()).toContain("Easy");
        expect(modal.find("[data-testid='back-to-home-button']").exists()).toBe(true);
    });

    it("should toggle note mode when clicking Note button", async () => {
        const wrapper = mountGame();

        await wrapper.find("[data-testid='note-button']").trigger("click");

        expect(wrapper.find("[data-testid='note-button']").find(".bg-primary-light").exists()).toBe(true);
    });

    it("should add note to slot cell in note mode", async () => {
        const wrapper = mountGame();

        // 開啟筆記模式
        const noteButton = wrapper.find("[data-testid='note-button']");
        await noteButton.trigger("click");

        // 選取 slot 格子 (0, 2)，按數字 4
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");
        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        expect(cell.text()).toContain("4");
    });

    it("should remove note when clicking the same number again in note mode", async () => {
        const wrapper = mountGame();

        const noteButton = wrapper.find("[data-testid='note-button']");
        await noteButton.trigger("click");

        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");
        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");
        await numberButton.trigger("click");

        expect(cell.text()).not.toContain("4");
    });

    it("should add note instead of input in number-first mode with note mode on", async () => {
        const wrapper = mountGame();

        // 開啟筆記模式
        const noteButton = wrapper.find("[data-testid='note-button']");
        await noteButton.trigger("click");

        // 數字優先：先選數字 4
        const numberButton = wrapper.find("[data-testid='number-4']");
        await numberButton.trigger("click");

        // 再點 slot 格子 (0, 2)
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");

        // 應該是加 note 而非 input
        expect(cell.text()).toContain("4");
        // 確認不是 input（input 會顯示大字，note 是小字在 grid 中）
        const noteContainer = cell.find(".grid");
        expect(noteContainer.exists()).toBe(true);
    });

    it("should fill candidate notes for empty cells when clicking auto-notes button", async () => {
        const wrapper = mountGame();

        const autoNotesButton = wrapper.find("[data-testid='auto-notes-button']");
        await autoNotesButton.trigger("click");

        // (0, 2) 是空格，候選 [1, 2, 4]
        const cell = wrapper.find("[data-testid='cell-0-2']");
        expect(cell.text()).toContain("1");
        expect(cell.text()).toContain("2");
        expect(cell.text()).toContain("4");
    });

    it("should auto-remove peer notes when inputting a number", async () => {
        const wrapper = mountGame();

        // 先填入 auto-notes
        const autoNotesButton = wrapper.find("[data-testid='auto-notes-button']");
        await autoNotesButton.trigger("click");

        // (0, 5) 和 (0, 6) 同行，候選包含 4
        const cell05 = wrapper.find("[data-testid='cell-0-5']");
        const cell06 = wrapper.find("[data-testid='cell-0-6']");
        expect(cell05.text()).toContain("4");
        expect(cell06.text()).toContain("4");

        // 填入 4 到 (0, 2)
        const cell02 = wrapper.find("[data-testid='cell-0-2']");
        await cell02.trigger("click");
        const numberButton4 = wrapper.find("[data-testid='number-4']");
        await numberButton4.trigger("click");

        // 同行 peer 的 note 4 應被自動移除
        expect(cell05.text()).not.toContain("4");
        expect(cell06.text()).not.toContain("4");
    });

    it("should enter erase mode when clicking Erase button", async () => {
        const wrapper = mountGame();

        await wrapper.find("[data-testid='erase-button']").trigger("click");

        expect(wrapper.find("[data-testid='erase-button']").classes()).toContain("bg-primary");
    });

    it("should clear input when clicking a filled slot cell in erase mode", async () => {
        const wrapper = mountGame();

        // 填入 4 到 (0, 2)
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");
        await wrapper.find("[data-testid='number-4']").trigger("click");
        expect(cell.text()).toBe("4");

        // 取消選取，進入 erase mode
        await cell.trigger("click");
        const eraseButton = wrapper.find("[data-testid='erase-button']");
        await eraseButton.trigger("click");

        // 點擊有輸入的格子
        await cell.trigger("click");

        expect(cell.text()).toBe("");
    });

    it("should clear notes when clicking a noted slot cell in erase mode", async () => {
        const wrapper = mountGame();

        // 用 auto-notes 填入筆記
        const autoNotesButton = wrapper.find("[data-testid='auto-notes-button']");
        await autoNotesButton.trigger("click");

        const cell = wrapper.find("[data-testid='cell-0-2']");
        expect(cell.text()).toContain("1");

        // 進入 erase mode，點擊有筆記的格子
        const eraseButton = wrapper.find("[data-testid='erase-button']");
        await eraseButton.trigger("click");
        await cell.trigger("click");

        expect(cell.text()).not.toContain("1");
        expect(cell.text()).not.toContain("2");
        expect(cell.text()).not.toContain("4");
    });

    it("should not affect clue cell in erase mode", async () => {
        const wrapper = mountGame();

        const eraseButton = wrapper.find("[data-testid='erase-button']");
        await eraseButton.trigger("click");

        const clueCell = wrapper.find("[data-testid='cell-0-0']");
        await clueCell.trigger("click");

        expect(clueCell.text()).toBe("5");
    });

    it("should undo the last input when clicking Undo button", async () => {
        const wrapper = mountGame();

        // 填入 4 到 (0, 2)
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");
        await wrapper.find("[data-testid='number-4']").trigger("click");
        expect(cell.text()).toBe("4");

        // 點 Undo
        const undoButton = wrapper.find("[data-testid='undo-button']");
        await undoButton.trigger("click");

        expect(cell.text()).toBe("");
    });

    it("should undo the last erase when clicking Undo button", async () => {
        const wrapper = mountGame();

        // 填入 4 到 (0, 2)
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");
        await wrapper.find("[data-testid='number-4']").trigger("click");
        expect(cell.text()).toBe("4");

        // 取消選取，進入 erase mode，清除格子
        await cell.trigger("click");
        await wrapper.find("[data-testid='erase-button']").trigger("click");
        await cell.trigger("click");
        expect(cell.text()).toBe("");

        // 點 Undo 還原清除
        const undoButton = wrapper.find("[data-testid='undo-button']");
        await undoButton.trigger("click");

        expect(cell.text()).toBe("4");
    });

    it("should do nothing when clicking Undo with no history", async () => {
        const wrapper = mountGame();

        const undoButton = wrapper.find("[data-testid='undo-button']");
        await undoButton.trigger("click");

        // (0, 2) 是 slot，應仍為空
        const cell = wrapper.find("[data-testid='cell-0-2']");
        expect(cell.text()).toBe("");
    });

    it("should show cursor-pointer on slot cells", () => {
        const wrapper = mountGame();

        // (0, 2) 是 slot 格子
        const slotCell = wrapper.find("[data-testid='cell-0-2']");
        expect(slotCell.classes()).toContain("cursor-pointer");
    });

    it("should not show cursor-pointer on clue cells", () => {
        const wrapper = mountGame();

        // (0, 0) 是 clue 格子
        const clueCell = wrapper.find("[data-testid='cell-0-0']");
        expect(clueCell.classes()).not.toContain("cursor-pointer");
    });

    it("should render slot cells as empty", () => {
        const wrapper = mountGame();

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (knownPuzzle[row][column] === 0) {
                    const cell = wrapper.find(`[data-testid="cell-${row}-${column}"]`);
                    expect(cell.text()).toBe("");
                }
            }
        }
    });

    it("should increment timer every second after game starts", async () => {
        vi.useFakeTimers();
        const wrapper = mountGame();

        const timer = wrapper.find("[data-testid='timer']");
        expect(timer.text()).toBe("00:00");

        await vi.advanceTimersByTimeAsync(3000);

        expect(timer.text()).toBe("00:03");
    });

    it("should pause timer when leave dialog is shown", async () => {
        vi.useFakeTimers();
        const wrapper = mountGame();

        await vi.advanceTimersByTimeAsync(3000);
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:03");

        // 打開離開彈窗
        await wrapper.find("[data-testid='back-button']").trigger("click");

        // 彈窗顯示期間計時器不應遞增
        await vi.advanceTimersByTimeAsync(5000);
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:03");

        // 關閉彈窗後計時器恢復
        await wrapper.find("[data-testid='leave-cancel-button']").trigger("click");
        await vi.advanceTimersByTimeAsync(2000);
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:05");
    });

    it("should stop timer when game is completed", async () => {
        vi.useFakeTimers();
        const wrapper = mountGame();

        await vi.advanceTimersByTimeAsync(5000);

        // 填入所有正確答案
        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (knownPuzzle[row][column] === 0) {
                    const cell = wrapper.find(`[data-testid='cell-${row}-${column}']`);
                    const value = knownAnswer[row][column];
                    const numberButton = wrapper.find(`[data-testid='number-${value}']`);
                    await numberButton.trigger("click");
                    await cell.trigger("click");
                    await numberButton.trigger("click");
                }
            }
        }

        expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:05");

        // 完成後計時器不再遞增
        await vi.advanceTimersByTimeAsync(3000);
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:05");
    });

    it("should highlight cells in same row, column, and box when a cell is selected", async () => {
        const wrapper = mountGame();

        // 選取 (0, 2) slot 格子
        await wrapper.find("[data-testid='cell-0-2']").trigger("click");

        // 同行
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-5']").props("highlight")).toBe(CellHighlight.Peer);
        // 同列
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-3-2']").props("highlight")).toBe(CellHighlight.Peer);
        // 同宮
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-1-0']").props("highlight")).toBe(CellHighlight.Peer);
        // 不相關
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-5-5']").props("highlight")).toBe(CellHighlight.None);
        // 自身不傳 highlight
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("highlight")).toBe(CellHighlight.None);
    });

    it("should highlight cells with same digit as SameDigit when a digit button is selected", async () => {
        const wrapper = mountGame();

        // 選擇數字 5
        await wrapper.find("[data-testid='number-5']").trigger("click");

        // (0, 0) 是 clue=5 → SameDigit
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-0']").props("highlight")).toBe(CellHighlight.SameDigit);
        // (1, 5) 是 clue=5 → SameDigit
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-1-5']").props("highlight")).toBe(CellHighlight.SameDigit);
        // (7, 8) 是 clue=5 → SameDigit
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-7-8']").props("highlight")).toBe(CellHighlight.SameDigit);
        // (0, 1) 是 clue=3，不同數字 → None
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-1']").props("highlight")).toBe(CellHighlight.None);
        // (0, 2) 是空 slot → None
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("highlight")).toBe(CellHighlight.None);
    });

    it("should update remaining count badge after inputting a number", async () => {
        const wrapper = mountGame();

        // 數字 8 有 5 個 clue → 初始剩餘 = 4
        expect(wrapper.find("[data-testid='badge-8']").text()).toBe("4");

        // 填入 1 個 8 → (0,5) 的答案是 8
        await wrapper.find("[data-testid='number-8']").trigger("click");
        await wrapper.find("[data-testid='cell-0-5']").trigger("click");

        // 剩餘應該降為 3
        expect(wrapper.find("[data-testid='badge-8']").text()).toBe("3");
    });

    it("should disable number button when all 9 instances are correctly filled", async () => {
        const wrapper = mountGame();

        // 數字 8 有 5 個 clue，再填入 4 個正確位置湊滿 9 次
        // (0,5)=8, (1,8)=8, (5,6)=8, (7,1)=8
        const cellsToFill = [[0, 5], [1, 8], [5, 6], [7, 1]];
        await wrapper.find("[data-testid='number-8']").trigger("click");
        for (const [row, col] of cellsToFill) {
            await wrapper.find(`[data-testid='cell-${row}-${col}']`).trigger("click");
        }

        expect(wrapper.find("[data-testid='number-8']").attributes("disabled")).toBeDefined();
    });

    it("should deselect number when all 9 instances are filled in number-first mode", async () => {
        const wrapper = mountGame();

        // 數字 8 有 5 個 clue，再填入 4 個正確位置湊滿 9 次
        const cellsToFill = [[0, 5], [1, 8], [5, 6], [7, 1]];
        await wrapper.find("[data-testid='number-8']").trigger("click");
        for (const [row, col] of cellsToFill) {
            await wrapper.find(`[data-testid='cell-${row}-${col}']`).trigger("click");
        }

        // 填滿 9 個後，數字按鈕不再是 selected
        expect(wrapper.find("[data-testid='number-8']").classes()).not.toContain("bg-primary");
    });

    it("should cancel erase mode when selecting a number", async () => {
        const wrapper = mountGame();

        // 進入 erase mode
        await wrapper.find("[data-testid='erase-button']").trigger("click");
        expect(wrapper.find("[data-testid='erase-button']").classes()).toContain("bg-primary");

        // 選擇數字
        await wrapper.find("[data-testid='number-4']").trigger("click");

        // erase mode 取消
        expect(wrapper.find("[data-testid='erase-button']").classes()).not.toContain("bg-primary");
        // 數字被選取
        expect(wrapper.find("[data-testid='number-4']").classes()).toContain("bg-primary");
    });

    it("should deselect number when entering erase mode", async () => {
        const wrapper = mountGame();

        // 先選擇數字
        await wrapper.find("[data-testid='number-4']").trigger("click");
        expect(wrapper.find("[data-testid='number-4']").classes()).toContain("bg-primary");

        // 進入 erase mode
        await wrapper.find("[data-testid='erase-button']").trigger("click");

        // 數字選取取消
        expect(wrapper.find("[data-testid='number-4']").classes()).not.toContain("bg-primary");
        // erase mode 啟用
        expect(wrapper.find("[data-testid='erase-button']").classes()).toContain("bg-primary");
    });

    it("should cancel erase mode when entering note mode", async () => {
        const wrapper = mountGame();

        // 進入 erase mode
        await wrapper.find("[data-testid='erase-button']").trigger("click");
        expect(wrapper.find("[data-testid='erase-button']").classes()).toContain("bg-primary");

        // 進入 note mode
        await wrapper.find("[data-testid='note-button']").trigger("click");

        // erase mode 取消
        expect(wrapper.find("[data-testid='erase-button']").classes()).not.toContain("bg-primary");
        // note mode 啟用
        expect(wrapper.find("[data-testid='note-button']").find(".bg-primary-light").exists()).toBe(true);
    });

    it("should restore saved game state from store", () => {
        const savedState: GameState = {
            difficulty: "medium",
            answer: knownAnswer.map(row => [...row]),
            cells: knownPuzzle.map((row, rowIndex) =>
                row.map((puzzleValue, colIndex) => ({
                    clue: puzzleValue,
                    entry: rowIndex === 0 && colIndex === 2 ? 4 : 0,
                    notes: [],
                }))
            ),
            elapsedSeconds: 45,
            completed: false,
        };

        const wrapper = mountContinueGame(savedState);

        // 已填入的 entry 應還原
        expect(wrapper.find("[data-testid='cell-0-2']").text()).toBe("4");
        // 計時器應還原
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:45");
    });

    it("should update remaining count badge after inputting a number in continued game", async () => {
        const savedState: GameState = {
            difficulty: "medium",
            answer: knownAnswer.map(row => [...row]),
            cells: knownPuzzle.map(row =>
                row.map(puzzleValue => ({
                    clue: puzzleValue,
                    entry: 0,
                    notes: [],
                }))
            ),
            elapsedSeconds: 10,
            completed: false,
        };

        const wrapper = mountContinueGame(savedState);

        // 數字 8 有 5 個 clue → 初始剩餘 = 4
        expect(wrapper.find("[data-testid='badge-8']").text()).toBe("4");

        // 填入 1 個 8 → (0,5) 的答案是 8
        await wrapper.find("[data-testid='number-8']").trigger("click");
        await wrapper.find("[data-testid='cell-0-5']").trigger("click");

        // 剩餘應該降為 3
        expect(wrapper.find("[data-testid='badge-8']").text()).toBe("3");
    });

    it("should record game result when game is completed", async () => {
        const wrapper = mountGame();

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (knownPuzzle[row][column] === 0) {
                    const value = knownAnswer[row][column];
                    const numberButton = wrapper.find(`[data-testid='number-${value}']`);
                    await numberButton.trigger("click");
                    await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
                    await numberButton.trigger("click");
                }
            }
        }

        const history = getGameHistory();
        expect(history).toHaveLength(1);
        expect(history[0].completed).toBe(true);
        expect(history[0].difficulty).toBe("easy");
    });

    it("should delete saved game when game is completed", async () => {
        const savedState: GameState = {
            difficulty: "easy",
            answer: knownAnswer.map(row => [...row]),
            cells: knownPuzzle.map(row =>
                row.map(puzzleValue => ({
                    clue: puzzleValue,
                    entry: 0,
                    notes: [],
                }))
            ),
            elapsedSeconds: 10,
            completed: false,
        };
        const wrapper = mountContinueGame(savedState);
        expect(hasSavedGame()).toBe(true);

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                if (knownPuzzle[row][column] === 0) {
                    const value = knownAnswer[row][column];
                    const numberButton = wrapper.find(`[data-testid='number-${value}']`);
                    await numberButton.trigger("click");
                    await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
                    await numberButton.trigger("click");
                }
            }
        }

        expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(true);
        expect(hasSavedGame()).toBe(false);
    });

    it("should render 9x9 grid with clue cells showing their numbers", () => {
        const wrapper = mountGame();

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

    describe("Route Leave Guard", () => {
        function createRouterViewApp() {
            const pinia = createPinia();
            const router = createRouter({
                history: createMemoryHistory(),
                routes: [
                    { path: "/game", component: Game },
                    { path: "/", component: { template: "<div>Home</div>" } },
                ],
            });
            const gameStore = useGameStore(pinia);
            gameStore.sudoku = createKnownSudoku();
            gameStore.setDifficulty("easy");
            return { pinia, router, gameStore };
        }

        async function mountWithRouterView() {
            const { pinia, router, gameStore } = createRouterViewApp();
            await router.push("/game");
            await router.isReady();
            const wrapper = mount(
                { template: "<router-view />" },
                { global: { plugins: [pinia, router] } },
            );
            await flushPromises();
            return { wrapper, router, gameStore };
        }

        it("should block route leave and show LeaveGameDialog when game is in progress", async () => {
            const { wrapper, router } = await mountWithRouterView();

            await router.push("/");
            await flushPromises();

            // 導航應被阻止
            expect(router.currentRoute.value.path).toBe("/game");
            // LeaveGameDialog 應顯示
            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(true);
        });

        it("should allow route leave when game is completed", async () => {
            const { wrapper, router } = await mountWithRouterView();

            // 填入所有正確答案
            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    if (knownPuzzle[row][column] === 0) {
                        const value = knownAnswer[row][column];
                        const numberButton = wrapper.find(`[data-testid='number-${value}']`);
                        await numberButton.trigger("click");
                        await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
                        await numberButton.trigger("click");
                    }
                }
            }
            expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(true);

            await router.push("/");
            await flushPromises();

            expect(router.currentRoute.value.path).toBe("/");
        });
    });

    describe("Leave Game Dialog", () => {
        it("should show leave game dialog when clicking Back button", async () => {
            const wrapper = mountGame();

            await wrapper.find("[data-testid='back-button']").trigger("click");

            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='leave-game-dialog']").text()).toContain("Leave Game?");
        });

        it("should save game and navigate home when clicking Save & Leave", async () => {
            const pinia = createPinia();
            const router = createTestRouter();
            const gameStore = useGameStore(pinia);
            gameStore.sudoku = createKnownSudoku();
            gameStore.setDifficulty("easy");
            const wrapper = mount(Game, { global: { plugins: [pinia, router] } });

            // 填入一個數字
            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-4']").trigger("click");

            // 點 Back → 點 Save & Leave
            await wrapper.find("[data-testid='back-button']").trigger("click");
            await wrapper.find("[data-testid='save-and-leave-button']").trigger("click");
            await flushPromises();

            expect(hasSavedGame()).toBe(true);
            expect(loadGame()?.cells[0][2].entry).toBe(4);
            expect(router.currentRoute.value.path).toBe("/");
        });

        it("should record gave up and delete save when clicking Give Up & Leave", async () => {
            const pinia = createPinia();
            const router = createTestRouter();
            const gameStore = useGameStore(pinia);
            gameStore.sudoku = createKnownSudoku();
            gameStore.setDifficulty("easy");
            const wrapper = mount(Game, { global: { plugins: [pinia, router] } });

            // 點 Back → 點 Give Up & Leave
            await wrapper.find("[data-testid='back-button']").trigger("click");
            await wrapper.find("[data-testid='give-up-and-leave-button']").trigger("click");
            await flushPromises();

            const history = getGameHistory();
            expect(history).toHaveLength(1);
            expect(history[0].completed).toBe(false);
            expect(history[0].difficulty).toBe("easy");
            expect(hasSavedGame()).toBe(false);
            expect(router.currentRoute.value.path).toBe("/");
        });

        it("should close dialog when clicking Cancel", async () => {
            const wrapper = mountGame();

            await wrapper.find("[data-testid='back-button']").trigger("click");
            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(true);

            await wrapper.find("[data-testid='leave-cancel-button']").trigger("click");

            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(false);
        });
    });
});
