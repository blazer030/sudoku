import { nextTick } from "vue";
import { i18n } from "@/presentation/i18n";
import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter, onBeforeRouteLeave } from "vue-router";
import Game from "@/presentation/pages/game/Game.vue";
import { knownAnswer, knownPuzzle, createKnownSudoku } from "@/__tests__/fixtures/knownPuzzle";
import type { GameState } from "@/application/GameState";
import Cell from "@/presentation/pages/game/components/Cell.vue";
import { useGameStore } from "@/stores/gameStore";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Sudoku } from "@/domain/game/Sudoku";
import type { PuzzleCell } from "@/domain/board/PuzzleCell";
import { createMultiStepSudoku } from "@/__tests__/fixtures/multiStepPuzzle";
import { ANALYTICS_KEY, type AnalyticsService } from "@/application/analytics/AnalyticsService";

const createTestRouter = () => {
    return createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/game", component: Game }, { path: "/", component: { template: "<div/>" } }],
    });
};

const mountGame = (difficulty: Difficulty = "easy") => {
    const pinia = createPinia();
    const router = createTestRouter();
    const gameStore = useGameStore(pinia);
    gameStore.sudoku = createKnownSudoku();
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

// Fills every empty cell of the known puzzle except the last one, digit first.
const fillAllButLastEmptyCell = async (wrapper: GameWrapper) => {
    const emptyCells: [number, number][] = [];
    for (let row = 0; row < 9; row++) {
        for (let column = 0; column < 9; column++) {
            if (knownPuzzle[row][column] === 0) emptyCells.push([row, column]);
        }
    }
    for (const [row, column] of emptyCells.slice(0, -1)) {
        const numberButton = wrapper.find(`[data-testid='number-${knownAnswer[row][column]}']`);
        await numberButton.trigger("click");
        await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
        await numberButton.trigger("click");
    }
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

    it("should outline a tapped clue cell", async () => {
        const wrapper = mountGame();

        // (0, 0) is the clue 5
        await wrapper.find("[data-testid='cell-0-0']").trigger("click");

        expect(wrapper.findComponent<typeof Cell>("[data-testid='cell-0-0']").props("selected")).toBe(true);
        expect(wrapper.find("[data-testid='cell-0-0']").classes()).toContain("ring-primary");
        await wrapper.find("[data-testid='number-4']").trigger("click");
        expect(wrapper.find("[data-testid='cell-0-0']").text()).toBe("5");
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
        localStorage.setItem("sudoku-settings", JSON.stringify({ completionFlash: false }));
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
        localStorage.setItem("sudoku-settings", JSON.stringify({ completionFlash: false }));
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

    it("should disable number button when all 9 instances are correctly filled", async () => {
        const wrapper = mountGame();

        // 數字 8 有 5 個 clue，再填入 4 個正確位置湊滿 9 次
        // (0,5)=8, (1,8)=8, (5,6)=8, (7,1)=8
        const cellsToFill = [[0, 5], [1, 8], [5, 6], [7, 1]];
        await wrapper.find("[data-testid='number-8']").trigger("click");
        for (const [row, column] of cellsToFill) {
            await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
        }

        expect(wrapper.find("[data-testid='number-8']").attributes("disabled")).toBeDefined();
    });

    it("should deselect number when all 9 instances are filled in number-first mode", async () => {
        const wrapper = mountGame();

        // 數字 8 有 5 個 clue，再填入 4 個正確位置湊滿 9 次
        const cellsToFill = [[0, 5], [1, 8], [5, 6], [7, 1]];
        await wrapper.find("[data-testid='number-8']").trigger("click");
        for (const [row, column] of cellsToFill) {
            await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
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
            hintsUsed: 0,
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
        localStorage.setItem("sudoku-settings", JSON.stringify({ completionFlash: false }));
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
            cells: knownPuzzle.map(row =>
                row.map(puzzleValue => ({
                    clue: puzzleValue,
                    entry: 0,
                    notes: [],
                }))
            ),
            elapsedSeconds: 10,
            completed: false,
            hintsUsed: 0,
        };
        const wrapper = mountContinueGame(savedState);
        expect(useGameStore().savedGame).not.toBeNull();

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
        expect(useGameStore().savedGame).toBeNull();
    });

    it("should render 9x9 grid with clue cells showing their numbers", () => {
        const wrapper = mountGame();

        const cells = wrapper.findAllComponents(Cell);
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

    describe("Hint System", () => {
        it("should show Hint button in controls (replacing Auto-Notes)", () => {
            const wrapper = mountGame();

            expect(wrapper.find("[data-testid='hint-button']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='auto-notes-button']").exists()).toBe(false);
        });

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

        it("should show error style on conflict cells after Check Conflicts", async () => {
            const wrapper = mountGame();

            // 填入衝突數字: (0,0) clue=5，在 (0,2) 填 5
            await wrapper.find("[data-testid='number-5']").trigger("click");
            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-5']").trigger("click"); // deselect

            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-check-conflicts']").trigger("click");

            expect(wrapper.find("[data-testid='cell-0-2']").classes()).toContain("bg-error-surface");
        });

        it("should toast when Check Conflicts finds nothing", async () => {
            const wrapper = mountGame();

            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-check-conflicts']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='game-toast']").text()).toBe("No repeated digits found");
        });

        it("should mark only the player cell when an entry repeats a clue", async () => {
            // Keep the one-time long-press tip out of the way of the toast check
            localStorage.setItem("sudoku-settings", JSON.stringify({ seenLongPressTip: true }));
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
            expect(toast.text()).toMatch(/^Random reveal: /);
        });

        it("should show the toast position in Chinese after Reveal Cell", async () => {
            vi.spyOn(Sudoku.prototype, "planRevealHint").mockReturnValue({ kind: "noTechnique" });
            const wrapper = mountGame();
            i18n.global.locale.value = "zh-Hant";
            await nextTick();

            await wrapper.find("[data-testid='hint-button']").trigger("click");
            await wrapper.find("[data-testid='hint-reveal-cell']").trigger("click");

            expect(wrapper.find("[data-testid='game-toast']").text()).toMatch(/第 \d 列第 \d 欄 = \d/);
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
            const wrapper = mountGame();
            await fillAllButLastEmptyCell(wrapper);

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
            expect(wrapper.find("[data-testid='hint-clear']").text()).toBe("清除");
            expect(wrapper.find("[data-testid='hint-close']").text()).toBe("關閉");
            expect(wrapper.find("[data-testid='hint-primary']").exists()).toBe(false);

            await wrapper.find("[data-testid='hint-close']").trigger("click");

            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='cell-1-1']").text()).toBe("1");
            await wrapper.find("[data-testid='back-button']").trigger("click");
            await wrapper.find("[data-testid='save-and-leave-button']").trigger("click");
            await flushPromises();
            expect(useGameStore().savedGame?.hintsUsed).toBe(1);
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

        it("should lock the board and show the hint mode badge while hinting", async () => {
            const wrapper = mountGame();
            i18n.global.locale.value = "zh-Hant";
            await nextTick();
            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-4']").trigger("click");
            await openRevealCell(wrapper);
            const before = boardOf(wrapper);

            expect(wrapper.find("[data-testid='hint-mode-pill']").text()).toBe("提示模式");
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
            const logEvent = vi.fn().mockResolvedValue(undefined);
            const wrapper = mountGameWith(createKnownSudoku(), { logEvent });
            await fillAllButLastEmptyCell(wrapper);

            await openRevealCell(wrapper);
            await wrapper.find("[data-testid='hint-primary']").trigger("click");

            expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(true);
            expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ name: "game_complete" }));
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

        it("should end hint mode without changing the board when leaving through the router", async () => {
            const wrapper = mountGame();
            await wrapper.find("[data-testid='note-button']").trigger("click");
            await wrapper.find("[data-testid='cell-0-3']").trigger("click");
            await wrapper.find("[data-testid='number-6']").trigger("click");
            await wrapper.find("[data-testid='note-button']").trigger("click");
            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-4']").trigger("click");
            await openRevealCell(wrapper);
            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(true);
            const before = boardOf(wrapper);

            const leaveGuards = vi.mocked(onBeforeRouteLeave).mock.calls;
            const leaveGuard = leaveGuards[leaveGuards.length - 1][0] as unknown as () => boolean;
            expect(leaveGuard()).toBe(false);
            await flushPromises();
            await wrapper.find("[data-testid='save-and-leave-button']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='hint-panel']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='hint-mode-pill']").exists()).toBe(false);
            expect(boardOf(wrapper)).toEqual(before);
            const saved = useGameStore().savedGame;
            expect(saved?.cells.flat().map(({ entry, notes }) => ({ entry, notes }))).toEqual(before);
            expect(saved?.hintsUsed).toBe(1);
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

        it("should show the give-up choice and its cost in Traditional Chinese", async () => {
            const wrapper = await openLeaveDialog();
            i18n.global.locale.value = "zh-Hant";
            await nextTick();

            expect(wrapper.find("[data-testid='give-up-and-leave-button']").text()).toBe("放棄這局");
            expect(wrapper.find("[data-testid='leave-give-up-note']").text()).toBe("放棄會記為一場未完成，會影響勝率");
        });
    });

    describe("long-press tip", () => {
        const LONG_PRESS_TIP = "Long-press a cell to toggle a note directly (in note mode, it fills the digit)";

        it("should show the long-press tip the first time a digit is selected", async () => {
            const wrapper = mountGame();

            await wrapper.find("[data-testid='number-4']").trigger("click");

            expect(wrapper.find("[data-testid='game-toast']").text()).toBe(LONG_PRESS_TIP);
            expect(useSettingsStore().seenLongPressTip).toBe(true);
            const stored = JSON.parse(localStorage.getItem("sudoku-settings") ?? "{}") as Record<string, unknown>;
            expect(stored.seenLongPressTip).toBe(true);
        });

        it("should show the tip when the first digit comes from a clue", async () => {
            const wrapper = mountGame();

            await wrapper.find("[data-testid='cell-0-0']").trigger("click");

            expect(wrapper.find("[data-testid='game-toast']").text()).toBe(LONG_PRESS_TIP);
        });

        it("should not show the tip twice in one game", async () => {
            vi.useFakeTimers();
            const wrapper = mountGame();

            await wrapper.find("[data-testid='number-4']").trigger("click");
            await vi.advanceTimersByTimeAsync(6000);
            await wrapper.find("[data-testid='number-4']").trigger("click");
            await wrapper.find("[data-testid='number-6']").trigger("click");

            expect(wrapper.find("[data-testid='game-toast']").exists()).toBe(false);
        });

        it("should not show the tip after a reload", async () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ seenLongPressTip: true }));
            const wrapper = mountGame();

            await wrapper.find("[data-testid='number-4']").trigger("click");

            expect(wrapper.find("[data-testid='game-toast']").exists()).toBe(false);
        });
    });

    describe("control labels", () => {
        it.each([
            ["undo-button", "Undo", "復原"],
            ["note-button", "Notes", "筆記"],
            ["hint-button", "Hint", "提示"],
            ["erase-button", "Erase", "擦除"],
        ])("should label %s in text and for screen readers", async (testId, english, chinese) => {
            const wrapper = mountGame();
            const button = () => wrapper.find(`[data-testid='${testId}']`);

            expect(button().text()).toBe(english);
            expect(button().attributes("aria-label")).toBe(english);

            i18n.global.locale.value = "zh-Hant";
            await nextTick();

            expect(button().text()).toBe(chinese);
            expect(button().attributes("aria-label")).toBe(chinese);
        });

        it("should show note mode as a pressed, solid Notes button", async () => {
            const wrapper = mountGame();
            const noteButton = () => wrapper.find("[data-testid='note-button']");
            expect(noteButton().attributes("aria-pressed")).toBe("false");

            await noteButton().trigger("click");

            expect(noteButton().text()).toBe("Notes on");
            expect(noteButton().attributes("aria-pressed")).toBe("true");
            expect(noteButton().find("[data-testid='control-tile']").classes()).toContain("bg-primary");
            i18n.global.locale.value = "zh-Hant";
            await nextTick();
            expect(noteButton().text()).toBe("筆記 開");
        });

        it("should name each digit key with what it does and how many are left", async () => {
            const wrapper = mountGame();
            const digitKey = () => wrapper.find("[data-testid='number-8']");

            // 8 has five clues in the fixture
            expect(digitKey().attributes("aria-label")).toBe("Fill 8, 4 left");
            await wrapper.find("[data-testid='note-button']").trigger("click");
            expect(digitKey().attributes("aria-label")).toBe("Note 8, 4 left");
            await wrapper.find("[data-testid='note-button']").trigger("click");

            i18n.global.locale.value = "zh-Hant";
            await nextTick();
            expect(digitKey().attributes("aria-label")).toBe("填入 8，還剩 4 個");
        });

        it("should draw smaller, top-aligned digits in note mode", async () => {
            const wrapper = mountGame();
            const digitKey = () => wrapper.find("[data-testid='number-8']");
            expect(digitKey().classes()).toEqual(expect.arrayContaining(["items-center", "text-2xl"]));

            await wrapper.find("[data-testid='note-button']").trigger("click");

            expect(digitKey().classes()).toEqual(expect.arrayContaining(["items-start", "text-lg"]));
            expect(digitKey().classes()).not.toContain("text-2xl");
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
