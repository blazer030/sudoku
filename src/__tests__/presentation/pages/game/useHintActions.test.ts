import { describe, it, expect, vi } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { Sudoku } from "@/domain/game/Sudoku";
import { StepRecorder } from "@/domain/game/StepRecorder";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";
import type { HintAction } from "@/presentation/pages/game/components/useHintMenu";

const openHintDialog = vi.fn();

vi.mock("@/presentation/pages/game/components/useHintMenu", async () => {
    const actual = await vi.importActual<typeof import("@/presentation/pages/game/components/useHintMenu")>("@/presentation/pages/game/components/useHintMenu");
    return {
        ...actual,
        provideHintMenu: () => ({
            open: openHintDialog,
            close: vi.fn(),
            visible: { value: false },
            params: { value: undefined },
        }),
    };
});

import { useHintActions } from "@/presentation/pages/game/useHintActions";

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

const buildPartialSudoku = (): Sudoku => {
    const puzzleCells = SOLVED_BOARD.map((row, rowIndex) =>
        row.map((value) => new PuzzleCell(rowIndex < 4 ? value : 0))
    );
    return Sudoku.restoreSave(SOLVED_BOARD, puzzleCells);
};

type HintApi = ReturnType<typeof useHintActions>;

const mountHintHarness = (analytics: AnalyticsService) => {
    const captured: { api: HintApi | undefined } = { api: undefined };
    const Harness = defineComponent({
        setup() {
            captured.api = useHintActions({
                sudoku: buildPartialSudoku(),
                stepRecorder: new StepRecorder(),
                onRevealComplete: () => { /* noop */ },
                analytics,
            });
            return () => null;
        },
    });
    mount(Harness);
    if (captured.api === undefined) throw new Error("useHintActions did not initialize");
    return captured.api;
};

const runAction = async (action: HintAction, analytics: AnalyticsService) => {
    openHintDialog.mockResolvedValue(action);
    const api = mountHintHarness(analytics);
    await api.openHintMenu();
};

describe("useHintActions — analytics", () => {
    it.each([
        ["autoNotes" as const,       "auto_notes"],
        ["checkConflicts" as const,  "check_conflicts"],
        ["checkErrors" as const,     "check_errors"],
        ["revealCell" as const,      "reveal_cell"],
    ])("emits hint_used with hint_type=%s -> %s", async (action, hintType) => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        await runAction(action, { logEvent });
        expect(logEvent).toHaveBeenCalledWith({ name: "hint_used", hint_type: hintType });
    });

    it("does not emit hint_used when user closes menu", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        await runAction("close", { logEvent });
        expect(logEvent).not.toHaveBeenCalled();
    });
});
