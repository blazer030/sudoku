import { createAnalyticsSpy } from "@/__tests__/fixtures/analyticsSpy";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory, RouterView } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import { Sudoku } from "@/domain/game/Sudoku";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { useLeaveGame } from "@/presentation/pages/game/useLeaveGame";
import { useGameStore } from "@/stores/gameStore";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";

beforeEach(() => {
    setActivePinia(createPinia());
});

const SOLVED_BOARD: number[][] = [
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

const buildSudokuWithEntries = (entryCount: number, wrongCount = 0): Sudoku => {
    // Every cell is an empty slot; the first `entryCount` get an entry, the first `wrongCount` of those are wrong.
    const puzzleCells = SOLVED_BOARD.map((row, rowIndex) =>
        row.map((value, columnIndex) => {
            const cellIndex = rowIndex * 9 + columnIndex;
            const cell = new PuzzleCell(0);
            if (cellIndex < entryCount) cell.entry = cellIndex < wrongCount ? (value % 9) + 1 : value;
            return cell;
        })
    );
    return Sudoku.restoreSave(SOLVED_BOARD, puzzleCells);
};

const buildSudokuWithFilledCount = (filledCount: number): Sudoku => {
    const puzzleCells = SOLVED_BOARD.map((row, rowIndex) =>
        row.map((value, columnIndex) => {
            const cellIndex = rowIndex * 9 + columnIndex;
            return new PuzzleCell(cellIndex < filledCount ? value : 0);
        })
    );
    return Sudoku.restoreSave(SOLVED_BOARD, puzzleCells);
};

const emptyReplay = (): GameReplayData => ({
    initialBoard: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({ clue: 0, entry: 0, notes: [] }))),
    steps: [],
});

type LeaveApi = ReturnType<typeof useLeaveGame>;

interface MountConfig {
    sudoku: Sudoku;
    analytics: AnalyticsService;
    dismissOverlay?: () => boolean;
    completed?: boolean;
}

const mountLeaveHarness = async (config: MountConfig): Promise<LeaveApi> => {
    return (await mountLeaveHarnessWithRouter(config)).api;
};

const mountLeaveHarnessWithRouter = async ({ sudoku, analytics, dismissOverlay, completed = false }: MountConfig) => {
    const captured: { api: LeaveApi | undefined } = { api: undefined };
    const Harness = defineComponent({
        setup() {
            captured.api = useLeaveGame({
                sudoku,
                difficulty: ref("easy"),
                completed: ref(completed),
                getElapsedSeconds: () => 60,
                getReplayData: emptyReplay,
                analytics,
                dismissOverlay,
            });
            return () => null;
        },
    });
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: Harness },
            { path: "/home", component: { template: "<div />" } },
        ],
    });
    await router.push("/");
    // onBeforeRouteLeave only registers for a component rendered by a router-view
    const App = defineComponent({ components: { RouterView }, template: "<RouterView />" });
    mount(App, { global: { plugins: [router] } });
    if (captured.api === undefined) throw new Error("useLeaveGame did not initialize");
    return { api: captured.api, router };
};

describe("useLeaveGame — analytics", () => {
    it("emits game_abandon with progress computed without clue cells", async () => {
        const analytics = createAnalyticsSpy();
        // 40 clue cells, 41 empty cells with no entries yet.
        const api = await mountLeaveHarness({
            sudoku: buildSudokuWithFilledCount(40),
            analytics,
        });
        vi.spyOn(api.leaveDialog, "open").mockResolvedValue("giveUp");

        await api.showLeaveDialog();

        expect(analytics.logEvent).toHaveBeenCalledWith({
            name: "game_abandon",
            difficulty: "easy",
            progress_pct: 0,
            correct_pct: 0,
            incorrect_pct: 0,
        });
    });

    it("emits progress, correct and incorrect percentages of the player's cells", async () => {
        const analytics = createAnalyticsSpy();
        // 81 empty cells: 40 entries, 20 of them wrong.
        const api = await mountLeaveHarness({
            sudoku: buildSudokuWithEntries(40, 20),
            analytics,
        });
        vi.spyOn(api.leaveDialog, "open").mockResolvedValue("giveUp");

        await api.showLeaveDialog();

        expect(analytics.logEvent).toHaveBeenCalledWith({
            name: "game_abandon",
            difficulty: "easy",
            progress_pct: Math.round((40 / 81) * 100),
            correct_pct: Math.round((20 / 81) * 100),
            incorrect_pct: Math.round((20 / 81) * 100),
        });
    });

    it("does not emit game_abandon when user chooses save", async () => {
        const analytics = createAnalyticsSpy();
        const api = await mountLeaveHarness({
            sudoku: buildSudokuWithFilledCount(10),
            analytics,
        });
        vi.spyOn(api.leaveDialog, "open").mockResolvedValue("save");

        await api.showLeaveDialog();

        expect(analytics.logEvent).not.toHaveBeenCalled();
    });

    it("does not emit game_abandon when user cancels", async () => {
        const analytics = createAnalyticsSpy();
        const api = await mountLeaveHarness({
            sudoku: buildSudokuWithFilledCount(10),
            analytics,
        });
        vi.spyOn(api.leaveDialog, "open").mockResolvedValue("cancel");

        await api.showLeaveDialog();

        expect(analytics.logEvent).not.toHaveBeenCalled();
    });
});

describe("useLeaveGame — save", () => {
    it("saves the session's replay with the game", async () => {
        const api = await mountLeaveHarness({
            sudoku: buildSudokuWithFilledCount(10),
            analytics: createAnalyticsSpy(),
        });
        vi.spyOn(api.leaveDialog, "open").mockResolvedValue("save");

        await api.showLeaveDialog();

        expect(useGameStore().savedGame?.replay).toEqual(emptyReplay());
    });
});

describe("useLeaveGame — Back key", () => {
    const harness = (dismissOverlay?: () => boolean) => mountLeaveHarnessWithRouter({
        sudoku: buildSudokuWithFilledCount(10),
        analytics: createAnalyticsSpy(),
        dismissOverlay,
    });

    it("opens the leave dialog when nothing else is open", async () => {
        const { api, router } = await harness(() => false);

        await router.push("/home");

        expect(api.leaveDialog.visible.value).toBe(true);
        expect(router.currentRoute.value.path).toBe("/");
    });

    it("closes the open overlay instead of opening the leave dialog", async () => {
        const dismissOverlay = vi.fn(() => true);
        const { api, router } = await harness(dismissOverlay);

        await router.push("/home");

        expect(dismissOverlay).toHaveBeenCalledOnce();
        expect(api.leaveDialog.visible.value).toBe(false);
        expect(router.currentRoute.value.path).toBe("/");
    });

    it("closes the leave dialog itself instead of stacking another", async () => {
        const { api, router } = await harness(() => false);
        await router.push("/home");
        expect(api.leaveDialog.visible.value).toBe(true);

        await router.push("/home");

        expect(api.leaveDialog.visible.value).toBe(false);
        expect(router.currentRoute.value.path).toBe("/");
    });
});

const setPageVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
    document.dispatchEvent(new Event("visibilitychange"));
};

describe("useLeaveGame — saving when the page is hidden", () => {
    afterEach(() => {
        setPageVisibility("visible");
    });

    it("saves the game as it stands when the page is hidden", async () => {
        await mountLeaveHarness({ sudoku: buildSudokuWithEntries(3), analytics: createAnalyticsSpy() });

        setPageVisibility("hidden");

        const saved = useGameStore().savedGame;
        expect(saved?.cells[0][2].entry).toBe(SOLVED_BOARD[0][2]);
        expect(saved?.elapsedSeconds).toBe(60);
    });

    it("leaves a finished game unsaved when the page is hidden", async () => {
        await mountLeaveHarness({ sudoku: buildSudokuWithEntries(3), analytics: createAnalyticsSpy(), completed: true });

        setPageVisibility("hidden");

        expect(useGameStore().savedGame).toBeNull();
    });

    it("saves nothing when the page becomes visible again", async () => {
        await mountLeaveHarness({ sudoku: buildSudokuWithEntries(3), analytics: createAnalyticsSpy() });

        setPageVisibility("visible");

        expect(useGameStore().savedGame).toBeNull();
    });
});

