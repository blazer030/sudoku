import { createAnalyticsSpy } from "@/__tests__/fixtures/analyticsSpy";
import { setPageVisibility } from "@/__tests__/fixtures/pageVisibility";
import { nextTick } from "vue";
import { i18n } from "@/presentation/i18n";
import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter, onBeforeRouteLeave } from "vue-router";
import Game from "@/presentation/pages/game/Game.vue";
import { knownAnswer, knownPuzzle, createKnownSudoku, fillAllButLastKnownCell, lastKnownEmptyCell } from "@/__tests__/fixtures/knownPuzzle";
import type { GameState } from "@/application/game/GameState";
import Cell from "@/presentation/components/board-cell/Cell.vue";
import { useGameStore } from "@/stores/gameStore";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { Sudoku } from "@/domain/game/Sudoku";
import type { PuzzleCell } from "@/domain/board/PuzzleCell";
import { createMultiStepSudoku } from "@/__tests__/fixtures/multiStepPuzzle";
import { ANALYTICS_KEY, type AnalyticsService } from "@/application/analytics/AnalyticsService";
import { expectKeyRowsToShrinkToFit } from "@/__tests__/fixtures/digitKeyRows";

const createTestRouter = () => {
    return createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/game", component: Game }, { path: "/", component: { template: "<div/>" } }],
    });
};

const mountGame = (difficulty: Difficulty = "easy", sudoku: Sudoku = createKnownSudoku()) => {
    const pinia = createPinia();
    const router = createTestRouter();
    const gameStore = useGameStore(pinia);
    gameStore.sudoku = sudoku;
    gameStore.setDifficulty(difficulty);
    return mount(Game, { global: { plugins: [pinia, router] } });
};

const mountContinueGame = (savedState: GameState) => {
    const pinia = createPinia();
    const router = createTestRouter();
    const gameStore = useGameStore(pinia);
    gameStore.persistGame(savedState);
    gameStore.loadSavedGame(savedState);
    return mount(Game, { global: { plugins: [pinia, router] } });
};

const mountGameWith = (sudoku: Sudoku, analytics?: AnalyticsService) => {
    const pinia = createPinia();
    const router = createTestRouter();
    const gameStore = useGameStore(pinia);
    gameStore.sudoku = sudoku;
    gameStore.setDifficulty("hard");
    return mount(Game, {
        global: {
            plugins: [pinia, router],
            provide: analytics === undefined ? {} : { [ANALYTICS_KEY as symbol]: analytics },
        },
    });
};

type GameWrapper = ReturnType<typeof mountGame>;

const openRevealCell = async (wrapper: GameWrapper) => {
    await wrapper.find("[data-testid='hint-button']").trigger("click");
    await wrapper.find("[data-testid='hint-reveal-cell']").trigger("click");
    await flushPromises();
};

// The known puzzle with only its last empty cell left, so a test plays just the finishing move
const nearlySolvedSudoku = (): Sudoku => {
    const sudoku = createKnownSudoku();
    fillAllButLastKnownCell(sudoku);
    return sudoku;
};

// Fills the last empty cell through the digit pad, digit first
const fillLastCell = async (wrapper: GameWrapper) => {
    const { row, column, value } = lastKnownEmptyCell;
    const numberButton = wrapper.find(`[data-testid='number-${value}']`);
    await numberButton.trigger("click");
    await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
    await numberButton.trigger("click");
};

const boardOf = (wrapper: GameWrapper) =>
    wrapper.findAllComponents(Cell).map((cell) => {
        const puzzleCell = cell.props("puzzleCell") as PuzzleCell;
        return { entry: puzzleCell.entry, notes: [...puzzleCell.notes] };
    });

const pressPrimaryUntilLastStep = async (wrapper: GameWrapper, totalSteps: number) => {
    for (let index = 0; index < totalSteps - 1; index++) {
        await wrapper.find("[data-testid='hint-primary']").trigger("click");
    }
};

const multiStepPlan = () => {
    const plan = createMultiStepSudoku().planRevealHint();
    if (plan.kind !== "steps") throw new Error(`expected a steps plan, got ${plan.kind}`);
    return plan;
};

vi.mock("vue-router", async () => {
    const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
    return { ...actual, onBeforeRouteLeave: vi.fn() };
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.clear();
});

describe("Game", () => {
    it("should update the difficulty pill when the language changes", async () => {
        const wrapper = mountGame("medium");
        expect(wrapper.text()).toContain("Medium");

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.text()).toContain("中等");
    });

    it("should redirect to home when store has no active game", async () => {
        const pinia = createPinia();
        const router = createTestRouter();
        await router.push("/game");
        await router.isReady();
        mount(Game, { global: { plugins: [pinia, router] } });
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/");
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

    it("should outline a tapped clue cell", async () => {
        const wrapper = mountGame();

        // (0, 0) is the clue 5
        await wrapper.find("[data-testid='cell-0-0']").trigger("click");

        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-0']").props("selected")).toBe(true);
        expect(wrapper.find("[data-testid='cell-0-0']").classes()).toContain("ring-primary");
        await wrapper.find("[data-testid='number-4']").trigger("click");
        expect(wrapper.find("[data-testid='cell-0-0']").text()).toBe("5");
    });

    it("should not pick a digit when a clue is tapped, so the next tapped cell is not overwritten", async () => {
        const wrapper = mountGame();
        await wrapper.find("[data-testid='number-2']").trigger("click");
        await wrapper.find("[data-testid='cell-0-2']").trigger("click");
        await wrapper.find("[data-testid='number-2']").trigger("click");
        expect(wrapper.find("[data-testid='cell-0-2']").text()).toBe("2");

        await wrapper.find("[data-testid='cell-0-0']").trigger("click");
        expect(wrapper.find("[data-testid='number-5']").attributes("aria-pressed")).toBe("false");
        await wrapper.find("[data-testid='cell-0-2']").trigger("click");

        expect(wrapper.find("[data-testid='cell-0-2']").text()).toBe("2");
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("selected")).toBe(true);
    });

    it("should tint the row, column and box of the selected cell", async () => {
        const wrapper = mountGame();

        await wrapper.find("[data-testid='cell-0-2']").trigger("click");

        expect(wrapper.find("[data-testid='cell-0-8']").classes()).toContain("bg-cell-peer");
        expect(wrapper.find("[data-testid='cell-8-2']").classes()).toContain("bg-cell-peer");
        expect(wrapper.find("[data-testid='cell-1-1']").classes()).toContain("bg-cell-peer");
        expect(wrapper.find("[data-testid='cell-4-4']").classes()).not.toContain("bg-cell-peer");
    });

    it("should not tint peers when highlightScope is off", async () => {
        localStorage.setItem("sudoku-settings", JSON.stringify({ highlightScope: false }));
        const wrapper = mountGame();

        await wrapper.find("[data-testid='cell-0-2']").trigger("click");

        expect(wrapper.find("[data-testid='cell-0-8']").classes()).not.toContain("bg-cell-peer");
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

    it("should deselect cell after filling a digit via digit pad", async () => {
        const wrapper = mountGame();

        // 選取 (0, 2) slot 格子，按數字 4 填入
        await wrapper.find("[data-testid='cell-0-2']").trigger("click");
        await wrapper.find("[data-testid='number-4']").trigger("click");

        // 填入後格子應自動取消選擇
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("selected")).toBeFalsy();
    });

    it("should keep cell selected after toggling note via digit pad", async () => {
        const wrapper = mountGame();

        // 選取 (0, 2) slot 格子，切換到 Note 模式，按數字 4
        await wrapper.find("[data-testid='cell-0-2']").trigger("click");
        await wrapper.find("[data-testid='note-button']").trigger("click");
        await wrapper.find("[data-testid='number-4']").trigger("click");

        // Note 模式下格子應維持選擇
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("selected")).toBe(true);
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
        localStorage.setItem("sudoku-settings", JSON.stringify({ completionFlash: false }));
        const wrapper = mountGame("easy", nearlySolvedSudoku());

        await fillLastCell(wrapper);

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

        expect(wrapper.find("[data-testid='note-button']").attributes("aria-pressed")).toBe("true");
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

    it("should fill candidate notes for empty cells when using auto-notes hint", async () => {
        const wrapper = mountGame();

        await wrapper.find("[data-testid='hint-button']").trigger("click");
        await wrapper.find("[data-testid='hint-auto-notes']").trigger("click");

        // (0, 2) 是空格，候選 [1, 2, 4]
        const cell = wrapper.find("[data-testid='cell-0-2']");
        expect(cell.text()).toContain("1");
        expect(cell.text()).toContain("2");
        expect(cell.text()).toContain("4");
    });

    it("should auto-remove peer notes when inputting a number", async () => {
        const wrapper = mountGame();

        // 先填入 auto-notes via hint
        await wrapper.find("[data-testid='hint-button']").trigger("click");
        await wrapper.find("[data-testid='hint-auto-notes']").trigger("click");

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

    // Cell first works the same for Erase as for a digit: the selected cell is cleared at once
    it("should clear a selected cell at once when Erase is pressed, without entering Erase mode", async () => {
        const wrapper = mountGame();
        const cell = wrapper.find("[data-testid='cell-0-2']");
        await cell.trigger("click");
        await wrapper.find("[data-testid='number-4']").trigger("click");
        await cell.trigger("click");

        await wrapper.find("[data-testid='erase-button']").trigger("click");

        expect(cell.text()).toBe("");
        expect(wrapper.find("[data-testid='erase-button']").classes()).not.toContain("bg-primary");
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("selected")).toBe(false);
    });

    it("should disable Erase while the selected cell has nothing to erase", async () => {
        const wrapper = mountGame();

        await wrapper.find("[data-testid='cell-0-2']").trigger("click");

        expect(wrapper.find("[data-testid='erase-button']").attributes("disabled")).toBeDefined();
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

        // 用 auto-notes hint 填入筆記
        await wrapper.find("[data-testid='hint-button']").trigger("click");
        await wrapper.find("[data-testid='hint-auto-notes']").trigger("click");

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

    it("should show cursor-pointer on slot cells only", () => {
        const wrapper = mountGame();

        // (0, 2) is a slot cell, (0, 0) the clue 5
        expect(wrapper.find("[data-testid='cell-0-2']").classes()).toContain("cursor-pointer");
        expect(wrapper.find("[data-testid='cell-0-0']").classes()).not.toContain("cursor-pointer");
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
        expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(true);

        // 彈窗顯示期間計時器不應遞增
        await vi.advanceTimersByTimeAsync(5000);
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:03");

        // 關閉彈窗後計時器恢復
        await wrapper.find("[data-testid='leave-cancel-button']").trigger("click");
        expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(false);
        await vi.advanceTimersByTimeAsync(2000);
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:05");
    });

    it("should stop timer when game is completed", async () => {
        localStorage.setItem("sudoku-settings", JSON.stringify({ completionFlash: false }));
        vi.useFakeTimers();
        const wrapper = mountGame("easy", nearlySolvedSudoku());

        await vi.advanceTimersByTimeAsync(5000);

        await fillLastCell(wrapper);

        expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:05");

        // 完成後計時器不再遞增
        await vi.advanceTimersByTimeAsync(3000);
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:05");
    });

    it("should pass selectedDigit to all cells when a digit button is selected", async () => {
        const wrapper = mountGame();

        // 選擇數字 5
        await wrapper.find("[data-testid='number-5']").trigger("click");

        // 所有 Cell 都收到 selectedDigit=5
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-0']").props("selectedDigit")).toBe(5);
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-1']").props("selectedDigit")).toBe(5);
        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("selectedDigit")).toBe(5);
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

    it("should disable and deselect a number once all 9 instances are correctly filled", async () => {
        const wrapper = mountGame();

        // 8 has 5 clues; its other four places are (0,5), (1,8), (5,6) and (7,1)
        const cellsToFill = [[0, 5], [1, 8], [5, 6], [7, 1]];
        await wrapper.find("[data-testid='number-8']").trigger("click");
        for (const [row, column] of cellsToFill) {
            await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
        }

        expect(wrapper.find("[data-testid='number-8']").attributes("disabled")).toBeDefined();
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
        expect(wrapper.find("[data-testid='note-button']").attributes("aria-pressed")).toBe("true");
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
            hintsUsed: 0,
        };

        const wrapper = mountContinueGame(savedState);

        // 已填入的 entry 應還原
        expect(wrapper.find("[data-testid='cell-0-2']").text()).toBe("4");
        // 計時器應還原
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:45");
    });

    it("should record game result when game is completed", async () => {
        localStorage.setItem("sudoku-settings", JSON.stringify({ completionFlash: false }));
        const wrapper = mountGame("easy", nearlySolvedSudoku());

        await fillLastCell(wrapper);

        const history = useStatisticsStore().history;
        expect(history).toHaveLength(1);
        expect(history[0].completed).toBe(true);
        expect(history[0].difficulty).toBe("easy");
    });

    it("should delete saved game when game is completed", async () => {
        localStorage.setItem("sudoku-settings", JSON.stringify({ completionFlash: false }));
        const savedState: GameState = {
            difficulty: "easy",
            answer: knownAnswer.map(row => [...row]),
            // Everything filled but the last empty cell
            cells: knownPuzzle.map((row, rowIndex) =>
                row.map((puzzleValue, column) => ({
                    clue: puzzleValue,
                    entry: puzzleValue === 0 && !(rowIndex === lastKnownEmptyCell.row && column === lastKnownEmptyCell.column)
                        ? knownAnswer[rowIndex][column]
                        : 0,
                    notes: [],
                }))
            ),
            elapsedSeconds: 10,
            completed: false,
            hintsUsed: 0,
        };
        const wrapper = mountContinueGame(savedState);
        expect(useGameStore().savedGame).not.toBeNull();

        await fillLastCell(wrapper);

        expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(true);
        expect(useGameStore().savedGame).toBeNull();
    });

    it("should render the store's board: 81 cells, clues with their digits and empty slot cells", () => {
        const wrapper = mountGame();

        expect(wrapper.findAllComponents(Cell)).toHaveLength(81);
        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                const cell = wrapper.find(`[data-testid="cell-${row}-${column}"]`);
                expect(cell.text()).toBe(knownPuzzle[row][column] === 0 ? "" : String(knownPuzzle[row][column]));
            }
        }
    });

    describe("Hint System", () => {
        it("should show HintMenuPopup when clicking Hint button", async () => {
            const wrapper = mountGame();

            await wrapper.find("[data-testid='hint-button']").trigger("click");

            expect(wrapper.find("[data-testid='hint-auto-notes']").exists()).toBe(true);
        });

        it("should consume 1 hint when using Auto Notes", async () => {
            const wrapper = mountGame();

            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-auto-notes']").trigger("click");

            // 候選數字應該填入
            expect(wrapper.find("[data-testid='cell-0-2']").text()).toContain("4");

            // 再開 hint menu 檢查用量
            await wrapper.find("[data-testid='hint-button']").trigger("click");
            expect(wrapper.find("[data-testid='hint-remaining']").text()).toBe("3 hints left this game");
            expect(wrapper.find("[data-testid='hint-free-note']").exists()).toBe(false);
        });

        it("should toast when Check Conflicts finds nothing", async () => {
            const wrapper = mountGame();

            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-check-conflicts']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='game-toast']").text()).toBe("No repeated digits found");
        });

        it("should mark only the player cell when an entry repeats a clue", async () => {
            const wrapper = mountGame();

            // (0, 0) is the clue 5; fill 5 at (0, 2)
            await wrapper.find("[data-testid='number-5']").trigger("click");
            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-5']").trigger("click"); // deselect

            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-check-conflicts']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='cell-0-2']").classes()).toContain("bg-error-surface");
            expect(wrapper.find("[data-testid='cell-0-0']").classes()).not.toContain("bg-error-surface");
            expect(wrapper.find("[data-testid='game-toast']").exists()).toBe(false);
        });

        it("should clear conflict marks on the next interaction", async () => {
            const wrapper = mountGame();

            await wrapper.find("[data-testid='number-5']").trigger("click");
            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-5']").trigger("click"); // deselect

            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-check-conflicts']").trigger("click");
            expect(wrapper.find("[data-testid='cell-0-2']").classes()).toContain("bg-error-surface");

            await wrapper.find("[data-testid='cell-0-3']").trigger("click");

            expect(wrapper.find("[data-testid='cell-0-2']").classes()).not.toContain("bg-error-surface");
        });

        it("should show a random-reveal toast after Reveal Cell", async () => {
            vi.spyOn(Sudoku.prototype, "planRevealHint").mockReturnValue({ kind: "noTechnique" });
            const wrapper = mountGame();

            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-reveal-cell']").trigger("click");

            const toast = wrapper.find("[data-testid='game-toast']");
            expect(toast.exists()).toBe(true);
            expect(toast.text()).toMatch(/^Random reveal: Row \d, Col \d = \d$/);
        });

        it("should size the hint toast to its content so Chinese positions do not wrap early", async () => {
            vi.spyOn(Sudoku.prototype, "planRevealHint").mockReturnValue({ kind: "noTechnique" });
            const wrapper = mountGame();

            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-reveal-cell']").trigger("click");

            expect(wrapper.find("[data-testid='game-toast']").classes()).toContain("w-max");
        });

        it("should reveal a random cell with correct answer", async () => {
            vi.spyOn(Sudoku.prototype, "planRevealHint").mockReturnValue({ kind: "noTechnique" });
            const wrapper = mountGame();

            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-reveal-cell']").trigger("click");

            // 至少有一個 slot 被正確填入
            let filledCorrectly = false;
            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    if (knownPuzzle[row][column] === 0) {
                        const cellText = wrapper.find(`[data-testid='cell-${row}-${column}']`).text();
                        if (cellText === String(knownAnswer[row][column])) {
                            filledCorrectly = true;
                            break;
                        }
                    }
                }
                if (filledCorrectly) break;
            }
            expect(filledCorrectly).toBe(true);
        });

        it("should include hintsUsed in save (Save & Leave)", async () => {
            const pinia = createPinia();
            const router = createTestRouter();
            const gameStore = useGameStore(pinia);
            gameStore.sudoku = createKnownSudoku();
            gameStore.setDifficulty("easy");
            const wrapper = mount(Game, { global: { plugins: [pinia, router] } });

            // 用 2 次 hint
            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-auto-notes']").trigger("click");
            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-reveal-cell']").trigger("click");
            await flushPromises();
            // A shown hint is closed before the game can be left
            await wrapper.find("[data-testid='hint-close']").trigger("click");

            // Save & Leave
            await wrapper.find("[data-testid='back-button']").trigger("click");
            await wrapper.find("[data-testid='save-and-leave-button']").trigger("click");
            await flushPromises();

            const saved = useGameStore().savedGame;
            expect(saved?.hintsUsed).toBe(2);
        });

        it("should restore hint count from saved game", async () => {
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
                hintsUsed: 3,
            };
            const wrapper = mountContinueGame(savedState);

            // Three hints used out of four
            await wrapper.find("[data-testid='hint-button']").trigger("click");

            expect(wrapper.find("[data-testid='hint-remaining']").text()).toBe("1 hint left this game");
        });

        it("should check completion after Reveal Cell", async () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ completionFlash: false }));
            vi.spyOn(Sudoku.prototype, "planRevealHint").mockReturnValue({ kind: "noTechnique" });
            const wrapper = mountGame("easy", nearlySolvedSudoku());

            await openRevealCell(wrapper);

            expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(true);
        });
    });

    describe("Reveal Cell hint mode", () => {
        it("should point out one wrong cell with Clear and Close, and spend the hint", async () => {
            const wrapper = mountGame();
            i18n.global.locale.value = "zh-Hant";
            await nextTick();
            // (1, 1) should be 7
            await wrapper.find("[data-testid='cell-1-1']").trigger("click");
            await wrapper.find("[data-testid='number-1']").trigger("click");

            await openRevealCell(wrapper);

            expect(wrapper.find("[data-testid='hint-panel']").text()).toContain("第 2 列第 2 欄填錯了");
            expect(wrapper.find("[data-testid='hint-clear']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='hint-close']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='hint-primary']").exists()).toBe(false);

            await wrapper.find("[data-testid='hint-close']").trigger("click");

            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='cell-1-1']").text()).toBe("1");
            await wrapper.find("[data-testid='back-button']").trigger("click");
            await wrapper.find("[data-testid='save-and-leave-button']").trigger("click");
            await flushPromises();
            expect(useGameStore().savedGame?.hintsUsed).toBe(1);
        });

        it("should fill the hint's cell when the step-by-step hint is closed early", async () => {
            const plan = createKnownSudoku().planRevealHint();
            if (plan.kind !== "steps") throw new Error(`expected a steps plan, got ${plan.kind}`);
            const wrapper = mountGame();
            await openRevealCell(wrapper);

            await wrapper.find("[data-testid='hint-close']").trigger("click");

            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(false);
            expect(wrapper.find(`[data-testid='cell-${plan.target.row}-${plan.target.column}']`).text()).toBe(String(plan.digit));
        });

        it("should clear only the wrong entry when Clear is pressed", async () => {
            const wrapper = mountGame();
            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-4']").trigger("click");
            await wrapper.find("[data-testid='cell-1-1']").trigger("click");
            await wrapper.find("[data-testid='number-1']").trigger("click");
            await openRevealCell(wrapper);

            await wrapper.find("[data-testid='hint-clear']").trigger("click");

            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='cell-1-1']").text()).toBe("");
            expect(wrapper.find("[data-testid='cell-0-2']").text()).toBe("4");
        });

        it("should count a long run of steps with a counter that fits the panel", async () => {
            const plan = multiStepPlan();
            const wrapper = mountGameWith(createMultiStepSudoku());

            await openRevealCell(wrapper);
            await wrapper.find("[data-testid='hint-primary']").trigger("click");

            expect(wrapper.find("[data-testid='hint-step-counter']").text()).toBe(`2 / ${plan.steps.length}`);
            expect(wrapper.findAll("[data-testid^='hint-dot-']")).toHaveLength(0);
        });

        it("should lift the panel over the board when its buttons would not fit below", async () => {
            // The input area starts 120px above the bottom edge, leaving 104px under the 16px gap,
            // and the panel's smallest layout is 190px tall
            vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: window.innerHeight - 120 } as DOMRect);
            Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
                configurable: true,
                get(this: HTMLElement) { return this.dataset.testid === "hint-panel" ? 190 : 0; },
            });
            try {
                const wrapper = mountGameWith(createMultiStepSudoku());

                await openRevealCell(wrapper);
                await flushPromises();

                const panel = wrapper.find<HTMLElement>("[data-testid='hint-panel']");
                expect(panel.element.style.maxHeight).toBe("190px");
                expect(wrapper.find<HTMLElement>("[data-testid='hint-panel-position']").element.style.top).toBe("-86px");
            } finally {
                Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
            }
        });

        it("should hand the cells the same hint views when only the timer ticks", async () => {
            vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
            const wrapper = mountGameWith(createMultiStepSudoku());
            await openRevealCell(wrapper);
            const timerBefore = wrapper.find("[data-testid='timer']").text();
            const viewsBefore = wrapper.findAllComponents(Cell).map((cell) => cell.props("hint"));

            await vi.advanceTimersByTimeAsync(1000);

            expect(wrapper.find("[data-testid='timer']").text()).not.toBe(timerBefore);
            const viewsAfter = wrapper.findAllComponents(Cell).map((cell) => cell.props("hint"));
            viewsAfter.forEach((view, index) => { expect(view).toBe(viewsBefore[index]); });
        });

        it("should step with Next and fill the answer on the last step", async () => {
            const plan = multiStepPlan();
            const wrapper = mountGameWith(createMultiStepSudoku());
            i18n.global.locale.value = "zh-Hant";
            await nextTick();

            await openRevealCell(wrapper);

            const primary = () => wrapper.find("[data-testid='hint-primary']");
            for (let index = 0; index < plan.steps.length - 1; index++) {
                expect(primary().text()).toBe("下一步");
                await primary().trigger("click");
            }
            expect(primary().text()).toBe(`${plan.digit} 填入答案`);

            await primary().trigger("click");

            const { row, column } = plan.target;
            expect(wrapper.find(`[data-testid='cell-${row}-${column}']`).text()).toBe(String(plan.digit));
            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='game-inputs']").attributes("inert")).toBeUndefined();
        });

        it("should mark the board while hinting, so a style can draw hint mode", async () => {
            const wrapper = mountGame();
            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-4']").trigger("click");

            expect(wrapper.find("[data-testid='game-board']").attributes("data-hint-mode")).toBeUndefined();
            await openRevealCell(wrapper);

            expect(wrapper.find("[data-testid='game-board']").attributes("data-hint-mode")).toBeDefined();
        });

        it("should lock the board and show the hint mode badge while hinting", async () => {
            const wrapper = mountGame();
            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-4']").trigger("click");
            await openRevealCell(wrapper);
            const before = boardOf(wrapper);

            expect(wrapper.find("[data-testid='hint-mode-pill']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='game-inputs']").attributes("inert")).toBeDefined();
            await wrapper.find("[data-testid='cell-0-3']").trigger("click");
            await wrapper.find("[data-testid='number-6']").trigger("click");
            await wrapper.find("[data-testid='cell-0-3']").trigger("click");
            await wrapper.find("[data-testid='cell-0-0']").trigger("click");
            await wrapper.find("[data-testid='undo-button']").trigger("click");
            await wrapper.find("[data-testid='note-button']").trigger("click");
            await wrapper.find("[data-testid='erase-button']").trigger("click");
            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='hint-button']").trigger("click");

            expect(boardOf(wrapper)).toEqual(before);
            expect(wrapper.find("[data-testid='hint-auto-notes']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(true);

            await wrapper.find("[data-testid='hint-close']").trigger("click");
            await wrapper.find("[data-testid='cell-0-3']").trigger("click");
            await wrapper.find("[data-testid='number-6']").trigger("click");
            expect(wrapper.find("[data-testid='cell-0-3']").text()).toBe("6");
        });

        it("should ignore long presses while hinting", async () => {
            const wrapper = mountGame();
            await wrapper.find("[data-testid='number-4']").trigger("click");
            await openRevealCell(wrapper);
            vi.useFakeTimers();
            const cell = wrapper.find("[data-testid='cell-0-2']");

            const pointerdown = new Event("pointerdown", { bubbles: true });
            Object.assign(pointerdown, { isPrimary: true, pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
            cell.element.dispatchEvent(pointerdown);
            vi.advanceTimersByTime(400);
            await cell.trigger("pointerup");
            await cell.trigger("click");

            const puzzleCell = wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("puzzleCell");
            expect(puzzleCell.notes).toEqual([]);
            expect(puzzleCell.entry).toBe(0);
        });

        it("should show the complete modal and log game_complete when the hint fills the last cell", async () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ completionFlash: false }));
            const analytics = createAnalyticsSpy();
            const wrapper = mountGameWith(nearlySolvedSudoku(), analytics);

            await openRevealCell(wrapper);
            await wrapper.find("[data-testid='hint-primary']").trigger("click");

            expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(true);
            expect(analytics.logEvent).toHaveBeenCalledWith(expect.objectContaining({ name: "game_complete" }));
        });

        it("should keep every note empty after filling when the player had none", async () => {
            const plan = multiStepPlan();
            const wrapper = mountGameWith(createMultiStepSudoku());
            await openRevealCell(wrapper);
            await pressPrimaryUntilLastStep(wrapper, plan.steps.length);

            await wrapper.find("[data-testid='hint-primary']").trigger("click");

            expect(boardOf(wrapper).every((cell) => cell.notes.length === 0)).toBe(true);
        });

        it("should keep the filled answer glowing for about a second, then settle", async () => {
            const plan = multiStepPlan();
            const wrapper = mountGameWith(createMultiStepSudoku());
            await openRevealCell(wrapper);
            await pressPrimaryUntilLastStep(wrapper, plan.steps.length);
            vi.useFakeTimers();
            const answerCell = () => wrapper.find(`[data-testid='cell-${plan.target.row}-${plan.target.column}']`);

            await wrapper.find("[data-testid='hint-primary']").trigger("click");

            expect(answerCell().classes()).toContain("animate-hint-reveal-glow");
            await vi.advanceTimersByTimeAsync(900);
            expect(answerCell().classes()).toContain("animate-hint-reveal-glow");
            await vi.advanceTimersByTimeAsync(400);
            expect(answerCell().classes()).not.toContain("animate-hint-reveal-glow");
        });

        it("should undo the whole hint in one step", async () => {
            const plan = multiStepPlan();
            const wrapper = mountGameWith(createMultiStepSudoku());
            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-auto-notes']").trigger("click");
            const before = boardOf(wrapper);
            await openRevealCell(wrapper);
            await pressPrimaryUntilLastStep(wrapper, plan.steps.length);
            await wrapper.find("[data-testid='hint-primary']").trigger("click");
            expect(boardOf(wrapper)).not.toEqual(before);

            await wrapper.find("[data-testid='undo-button']").trigger("click");

            expect(boardOf(wrapper)).toEqual(before);
        });

        // A hint is finished (填入答案) or closed first; the header's Back cannot leave the game in the middle
        it("should keep the header's Back disabled while a hint is shown", async () => {
            const wrapper = mountGame();
            await openRevealCell(wrapper);
            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(true);

            const back = wrapper.find("[data-testid='back-button']");
            expect(back.attributes("disabled")).toBeDefined();
            await back.trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(true);

            await wrapper.find("[data-testid='hint-close']").trigger("click");
            expect(wrapper.find("[data-testid='back-button']").attributes("disabled")).toBeUndefined();
        });
    });

    describe("System Back key", () => {
        // Android's Back key reaches the game as a route-leave attempt.
        const pressBack = async () => {
            const leaveGuards = vi.mocked(onBeforeRouteLeave).mock.calls;
            const leaveGuard = leaveGuards[leaveGuards.length - 1][0] as unknown as () => boolean;
            expect(leaveGuard()).toBe(false);
            await flushPromises();
        };

        it("should close the hint menu without opening the leave dialog", async () => {
            const wrapper = mountGame();
            await wrapper.find("[data-testid='hint-button']").trigger("click");
            expect(wrapper.find("[data-testid='hint-menu']").exists()).toBe(true);

            await pressBack();

            expect(wrapper.find("[data-testid='hint-menu']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(false);
        });

        it("should close a step-by-step hint by filling its cell, without opening the leave dialog", async () => {
            const wrapper = mountGame();
            await wrapper.find("[data-testid='note-button']").trigger("click");
            await wrapper.find("[data-testid='cell-0-3']").trigger("click");
            await wrapper.find("[data-testid='number-6']").trigger("click");
            await wrapper.find("[data-testid='note-button']").trigger("click");
            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-4']").trigger("click");
            await openRevealCell(wrapper);
            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(true);

            const filledBefore = boardOf(wrapper).filter(cell => cell.entry !== 0).length;

            await pressBack();

            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(false);
            expect(boardOf(wrapper).filter(cell => cell.entry !== 0)).toHaveLength(filledBefore + 1);
        });
    });

    describe("Replay across Save & Leave", () => {
        const visitGame = (pinia: ReturnType<typeof createPinia>) =>
            mount(Game, { global: { plugins: [pinia, createTestRouter()] } });

        const giveUp = async (wrapper: ReturnType<typeof visitGame>) => {
            await wrapper.find("[data-testid='back-button']").trigger("click");
            await wrapper.find("[data-testid='give-up-and-leave-button']").trigger("click");
            await flushPromises();
        };

        it("should keep the moves made before Save & Leave in the replay of a continued game", async () => {
            const pinia = createPinia();
            const gameStore = useGameStore(pinia);
            gameStore.sudoku = createKnownSudoku();
            gameStore.setDifficulty("easy");

            const firstVisit = visitGame(pinia);
            await firstVisit.find("[data-testid='hint-button']").trigger("click");
            await firstVisit.find("[data-testid='hint-auto-notes']").trigger("click");
            await firstVisit.find("[data-testid='back-button']").trigger("click");
            await firstVisit.find("[data-testid='save-and-leave-button']").trigger("click");
            await flushPromises();
            firstVisit.unmount();

            // Continue Game from the home page
            const saved = gameStore.savedGame;
            if (saved === null) throw new Error("Save & Leave did not save the game");
            gameStore.loadSavedGame(saved);
            const secondVisit = visitGame(pinia);
            await secondVisit.find("[data-testid='cell-0-2']").trigger("click");
            await secondVisit.find("[data-testid='number-4']").trigger("click");
            await giveUp(secondVisit);

            const replay = useStatisticsStore(pinia).history[0].replay;
            // The initial board is the original puzzle, before Auto Notes
            expect(replay?.initialBoard.flat().every(cell => cell.notes.length === 0)).toBe(true);
            expect(replay?.steps.map(step => step.action)).toEqual(["autoNotes", "fill"]);
            expect(replay?.steps[1]).toMatchObject({ row: 0, column: 2, value: 4 });
        });

        it("should start the replay from the resumed board when the save has no replay", async () => {
            const savedState: GameState = {
                difficulty: "easy",
                answer: knownAnswer.map(row => [...row]),
                cells: knownPuzzle.map((row, rowIndex) =>
                    row.map((puzzleValue, columnIndex) => ({
                        clue: puzzleValue,
                        entry: rowIndex === 0 && columnIndex === 2 ? 4 : 0,
                        notes: [],
                    }))
                ),
                elapsedSeconds: 10,
                completed: false,
                hintsUsed: 0,
            };
            const wrapper = mountContinueGame(savedState);

            await giveUp(wrapper);

            const replay = useStatisticsStore().history[0].replay;
            expect(replay?.initialBoard[0][2].entry).toBe(4);
            expect(replay?.steps).toEqual([]);
        });
    });

    describe("leave dialog", () => {
        const openLeaveDialog = async () => {
            const wrapper = mountGame();
            await wrapper.find("[data-testid='back-button']").trigger("click");
            return wrapper;
        };

        it("should make saving the primary choice and giving up a quiet text button", async () => {
            const wrapper = await openLeaveDialog();

            expect(wrapper.find("[data-testid='save-and-leave-button']").classes()).toContain("bg-primary");
            const giveUp = wrapper.find("[data-testid='give-up-and-leave-button']");
            expect(giveUp.text()).toBe("Give Up This Game");
            expect(giveUp.classes()).toContain("text-danger");
            expect(giveUp.classes()).not.toContain("bg-danger");
        });

        it("should keep the give-up label on one line beside Cancel", async () => {
            const wrapper = await openLeaveDialog();

            for (const testId of ["leave-cancel-button", "give-up-and-leave-button"]) {
                expect(wrapper.find(`[data-testid='${testId}']`).classes()).toEqual(expect.arrayContaining(["flex-1", "whitespace-nowrap"]));
            }
        });

        it("should spell out what giving up costs", async () => {
            const wrapper = await openLeaveDialog();

            expect(wrapper.find("[data-testid='leave-give-up-note']").text()).toBe("Giving up counts as an unfinished game and lowers your win rate.");
        });
    });

    describe("picking a digit", () => {
        it("should not show any toast the first time a digit is selected", async () => {
            const wrapper = mountGame();

            await wrapper.find("[data-testid='number-4']").trigger("click");

            expect(wrapper.find("[data-testid='game-toast']").exists()).toBe(false);
        });
    });

    describe("control labels", () => {
        it.each([
            ["undo-button", "Undo"],
            ["note-button", "Notes"],
            ["hint-button", "Hint"],
            ["erase-button", "Erase"],
        ])("should label %s in text and for screen readers", (testId, label) => {
            const button = mountGame().find(`[data-testid='${testId}']`);

            expect(button.text()).toBe(label);
            expect(button.attributes("aria-label")).toBe(label);
        });

        it("should show note mode as a pressed, solid Notes button", async () => {
            const wrapper = mountGame();
            const noteButton = () => wrapper.find("[data-testid='note-button']");
            expect(noteButton().attributes("aria-pressed")).toBe("false");

            await noteButton().trigger("click");

            expect(noteButton().text()).toBe("Notes on");
            expect(noteButton().attributes("aria-label")).toBe("Notes");
            expect(noteButton().attributes("aria-pressed")).toBe("true");
            expect(noteButton().find("[data-testid='control-tile']").classes()).toContain("bg-primary");
        });

        it("should expose the erase mode and the selected digit as pressed states", async () => {
            const wrapper = mountGame();
            const eraseKey = () => wrapper.find("[data-testid='erase-button']");
            const digitKey = (digit: number) => wrapper.find(`[data-testid='number-${digit}']`);
            expect(eraseKey().attributes("aria-pressed")).toBe("false");
            expect(digitKey(4).attributes("aria-pressed")).toBe("false");

            await eraseKey().trigger("click");
            expect(eraseKey().attributes("aria-pressed")).toBe("true");

            await digitKey(4).trigger("click");
            expect(digitKey(4).attributes("aria-pressed")).toBe("true");
            expect(digitKey(3).attributes("aria-pressed")).toBe("false");
        });

        it("should name each digit key with what it does and how many are left", async () => {
            const wrapper = mountGame();
            const digitKey = () => wrapper.find("[data-testid='number-8']");

            // 8 has five clues in the fixture
            expect(digitKey().attributes("aria-label")).toBe("Fill 8, 4 left");
            await wrapper.find("[data-testid='note-button']").trigger("click");
            expect(digitKey().attributes("aria-label")).toBe("Note 8, 4 left");
        });

        it("should draw smaller digits in note mode, each moved to its place in a cell's note grid", async () => {
            const wrapper = mountGame();
            const digitKey = (digit: number) => wrapper.get(`[data-testid='number-${digit}']`);
            const glyph = (digit: number) => wrapper.get(`[data-testid='number-${digit}-glyph']`);
            const normalSize = "text-[length:calc(var(--text-2xl)*var(--key-scale,1))]";
            const noteSize = "text-[length:calc(var(--text-lg)*var(--key-scale,1))]";
            expect(digitKey(8).classes()).toContain(normalSize);
            for (const digit of [1, 5, 9]) expect(glyph(digit).attributes("style") ?? "").not.toContain("translate");

            await wrapper.find("[data-testid='note-button']").trigger("click");

            expect(digitKey(8).classes()).toContain(noteSize);
            expect(digitKey(8).classes()).not.toContain(normalSize);
            // 1 top left, 2 top, 3 top right … 9 bottom right, like the notes inside a cell
            // The step is 27% of the key's width: 15px on a 56px key
            const expected: [number, string][] = [
                [1, "translate(-27cqw, -27cqw)"], [2, "translate(0cqw, -27cqw)"], [3, "translate(27cqw, -27cqw)"],
                [4, "translate(-27cqw, 0cqw)"], [5, "translate(0cqw, 0cqw)"], [6, "translate(27cqw, 0cqw)"],
                [7, "translate(-27cqw, 27cqw)"], [8, "translate(0cqw, 27cqw)"], [9, "translate(27cqw, 27cqw)"],
            ];
            for (const [digit, transform] of expected) {
                expect(glyph(digit).attributes("style"), `${digit}`).toContain(`transform: ${transform}`);
                expect(glyph(digit).text()).toBe(`${digit}`);
            }
        });

        it("should fade the remaining counts while note mode moves digits into the corners", async () => {
            const wrapper = mountGame();
            const badge = () => wrapper.get("[data-testid='badge-3']");
            expect(badge().classes()).not.toContain("opacity-0");

            await wrapper.find("[data-testid='note-button']").trigger("click");
            expect(badge().classes()).toContain("opacity-0");
            // The count is still spoken
            expect(wrapper.get("[data-testid='number-3']").attributes("aria-label")).toMatch(/\d+ left/);

            await wrapper.find("[data-testid='note-button']").trigger("click");
            expect(badge().classes()).not.toContain("opacity-0");
        });

        it("should glide digits to their note places, and jump under reduced motion", () => {
            const wrapper = mountGame();

            expect(wrapper.get("[data-testid='number-1-glyph']").classes()).toEqual(expect.arrayContaining(["transition-transform", "motion-reduce:transition-none"]));
        });

        it("should write digit keys in the key face", () => {
            const wrapper = mountGame();

            expect(wrapper.get("[data-testid='number-8']").classes()).toContain("font-key");
        });

        it("should keep digit keys' line box at the glyph size", async () => {
            const wrapper = mountGame();
            expect(wrapper.get("[data-testid='number-8']").classes()).toContain("leading-none");

            await wrapper.find("[data-testid='note-button']").trigger("click");

            expect(wrapper.get("[data-testid='number-8']").classes()).toContain("leading-none");
        });
    });

    describe("narrow windows", () => {
        // A letterboxed window can be narrower than a 312px row of five keys
        it("should fit the digit keys to the window instead of clipping the outer ones", () => {
            const wrapper = mountGame();

            expectKeyRowsToShrinkToFit(wrapper);
        });

        it("should not let a digit taller than a narrow cell stretch the board, so it keeps one height in every style", () => {
            const wrapper = mountGame();

            for (const cell of wrapper.findAllComponents(Cell)) {
                expect(cell.classes()).toEqual(expect.arrayContaining(["aspect-square", "min-w-0", "min-h-0"]));
            }
        });
    });

    describe("quick input", () => {
        it("should toggle a note when a cell is long-pressed in Normal mode with a digit selected", async () => {
            vi.useFakeTimers();
            const wrapper = mountGame();
            await wrapper.find("[data-testid='number-4']").trigger("click");
            const cell = wrapper.find("[data-testid='cell-0-2']");

            // jsdom has no PointerEvent, so build a plain event carrying the pointer fields.
            const pointerdown = new Event("pointerdown", { bubbles: true });
            Object.assign(pointerdown, { isPrimary: true, pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
            cell.element.dispatchEvent(pointerdown);
            vi.advanceTimersByTime(400);
            await cell.trigger("pointerup");
            await cell.trigger("click");

            expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("puzzleCell").notes).toEqual([4]);
            expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("puzzleCell").entry).toBe(0);
        });
    });

    describe("press feedback", () => {
        // jsdom has no PointerEvent, so build a plain event carrying the pointer fields.
        const pressDown = (element: Element) => {
            const pointerdown = new Event("pointerdown", { bubbles: true });
            Object.assign(pointerdown, { isPrimary: true, pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
            element.dispatchEvent(pointerdown);
        };

        const releaseOnWindow = () => {
            window.dispatchEvent(new Event("pointerup"));
        };

        afterEach(() => {
            releaseOnWindow();
        });

        it("should press and bounce a digit key", async () => {
            const wrapper = mountGame();
            const digitKey = wrapper.find("[data-testid='number-4']");

            pressDown(digitKey.element);
            await nextTick();
            expect(digitKey.attributes()).toHaveProperty("data-pressed");
            expect(digitKey.attributes()).toHaveProperty("data-press-motion");

            releaseOnWindow();
            expect(digitKey.attributes()).toHaveProperty("data-press-bounce");
        });

        it("should tint a cell without motion", () => {
            const wrapper = mountGame();
            const cell = wrapper.find("[data-testid='cell-0-2']");

            pressDown(cell.element);

            expect(cell.attributes()).toHaveProperty("data-pressed");
            expect(cell.attributes()).not.toHaveProperty("data-press-motion");
        });

        it("should still long-press a cell with press feedback", async () => {
            vi.useFakeTimers();
            const wrapper = mountGame();
            await wrapper.find("[data-testid='number-4']").trigger("click");
            const cell = wrapper.find("[data-testid='cell-0-2']");

            pressDown(cell.element);
            vi.advanceTimersByTime(400);
            await cell.trigger("pointerup");
            releaseOnWindow();
            await cell.trigger("click");

            const cellComponent = wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']");
            expect(cellComponent.emitted("longPress")).toHaveLength(1);
            expect(cellComponent.props("puzzleCell").notes).toEqual([4]);
            expect(cellComponent.props("puzzleCell").entry).toBe(0);
        });

        it("should register quick taps on two cells", async () => {
            vi.useFakeTimers();
            const wrapper = mountGame();
            const firstCell = wrapper.find("[data-testid='cell-0-2']");
            const secondCell = wrapper.find("[data-testid='cell-0-3']");

            pressDown(firstCell.element);
            await firstCell.trigger("pointerup");
            releaseOnWindow();
            await firstCell.trigger("click");
            vi.advanceTimersByTime(20);
            pressDown(secondCell.element);
            await secondCell.trigger("pointerup");
            releaseOnWindow();
            await secondCell.trigger("click");

            expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-3']").props("selected")).toBe(true);
            expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-2']").props("selected")).toBe(false);
        });
    });
});

describe("Game — saving when the app goes to the background", () => {
    afterEach(() => {
        setPageVisibility("visible");
    });

    it("should save the game with its latest move when the page is hidden, so a killed app resumes it", async () => {
        const wrapper = mountGame();
        await wrapper.find("[data-testid='cell-0-2']").trigger("click");
        await wrapper.find("[data-testid='number-2']").trigger("click");

        setPageVisibility("hidden");

        const saved = useGameStore().savedGame;
        expect(saved?.cells[0][2].entry).toBe(2);
        expect(saved?.completed).toBe(false);
    });
});
