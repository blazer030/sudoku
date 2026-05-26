import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import { Sudoku } from "@/domain/game/Sudoku";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { useLeaveGame } from "@/presentation/pages/game/useLeaveGame";
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
}

const mountLeaveHarness = ({ sudoku, analytics }: MountConfig): LeaveApi => {
    const captured: { api: LeaveApi | undefined } = { api: undefined };
    const Harness = defineComponent({
        setup() {
            captured.api = useLeaveGame({
                sudoku,
                difficulty: ref("easy"),
                completed: ref(false),
                getElapsedSeconds: () => 60,
                getReplayData: emptyReplay,
                analytics,
            });
            return () => null;
        },
    });
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/", component: Harness }],
    });
    void router.push("/");
    mount(Harness, { global: { plugins: [router] } });
    if (captured.api === undefined) throw new Error("useLeaveGame did not initialize");
    return captured.api;
};

describe("useLeaveGame — analytics", () => {
    it("emits game_abandon with correct progress_pct when user gives up", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const api = mountLeaveHarness({
            sudoku: buildSudokuWithFilledCount(40),
            analytics: { logEvent },
        });
        vi.spyOn(api.leaveDialog, "open").mockResolvedValue("giveUp");

        await api.showLeaveDialog();

        expect(logEvent).toHaveBeenCalledWith({
            name: "game_abandon",
            difficulty: "easy",
            progress_pct: Math.round((40 / 81) * 100),
        });
    });

    it("does not emit game_abandon when user chooses save", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const api = mountLeaveHarness({
            sudoku: buildSudokuWithFilledCount(10),
            analytics: { logEvent },
        });
        vi.spyOn(api.leaveDialog, "open").mockResolvedValue("save");

        await api.showLeaveDialog();

        expect(logEvent).not.toHaveBeenCalled();
    });

    it("does not emit game_abandon when user cancels", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const api = mountLeaveHarness({
            sudoku: buildSudokuWithFilledCount(10),
            analytics: { logEvent },
        });
        vi.spyOn(api.leaveDialog, "open").mockResolvedValue("cancel");

        await api.showLeaveDialog();

        expect(logEvent).not.toHaveBeenCalled();
    });
});
