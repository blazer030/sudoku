import { describe, it, expect, vi } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { Sudoku } from "@/domain/game/Sudoku";
import { StepRecorder } from "@/domain/game/StepRecorder";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import type { RevealOutcome } from "@/domain/game/RevealOutcome";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";
import type { HintAction } from "@/presentation/pages/game/components/useHintMenu";
import { createKnownSudoku } from "@/__tests__/fixtures/knownPuzzle";

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

interface HarnessParts {
    sudoku?: Sudoku;
    stepRecorder?: StepRecorder;
    onHintReveal?: (outcome: RevealOutcome) => void;
    onNoConflicts?: () => void;
}

const mountHintHarness = (
    analytics: AnalyticsService,
    { sudoku = buildPartialSudoku(), stepRecorder = new StepRecorder(), onHintReveal, onNoConflicts }: HarnessParts = {},
) => {
    const captured: { api: HintApi | undefined } = { api: undefined };
    const Harness = defineComponent({
        setup() {
            captured.api = useHintActions({
                sudoku,
                stepRecorder,
                autoRemoveNotes: () => true,
                onRevealComplete: () => { /* noop */ },
                onHintReveal,
                onNoConflicts,
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

describe("useHintActions — step recording", () => {
    it("records the free first Auto Notes as a replay step", async () => {
        openHintDialog.mockResolvedValue("autoNotes");
        const sudoku = buildPartialSudoku();
        const stepRecorder = new StepRecorder();
        const api = mountHintHarness({ logEvent: vi.fn().mockResolvedValue(undefined) }, { sudoku, stepRecorder });

        await api.openHintMenu();

        // The first hint is free: it is not counted, but it is still a move in the replay
        expect(sudoku.hintTracker.recordedUsed).toBe(0);
        expect(stepRecorder.steps).toHaveLength(1);
        expect(stepRecorder.steps[0].action).toBe("autoNotes");
    });
});

describe("useHintActions — check conflicts", () => {
    it("reports no conflicts and still spends a hint", async () => {
        openHintDialog.mockReset();
        openHintDialog.mockResolvedValue("checkConflicts");
        const sudoku = buildPartialSudoku();
        const onNoConflicts = vi.fn();
        const api = mountHintHarness({ logEvent: vi.fn().mockResolvedValue(undefined) }, { sudoku, onNoConflicts });

        await api.openHintMenu();

        expect(onNoConflicts).toHaveBeenCalledTimes(1);
        expect(sudoku.hintTracker.totalUsed).toBe(1);
    });

    it("does not report no conflicts when a duplicate exists", async () => {
        openHintDialog.mockReset();
        openHintDialog.mockResolvedValue("checkConflicts");
        const sudoku = buildPartialSudoku();
        // Column 0 already has the clue 5
        sudoku.fill(4, 0, 5);
        const onNoConflicts = vi.fn();
        const api = mountHintHarness({ logEvent: vi.fn().mockResolvedValue(undefined) }, { sudoku, onNoConflicts });

        await api.openHintMenu();

        expect(onNoConflicts).not.toHaveBeenCalled();
    });
});

describe("useHintActions — reveal cell", () => {
    it("does not spend a hint when the puzzle is already solved", async () => {
        openHintDialog.mockReset();
        openHintDialog.mockResolvedValue("revealCell");
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const sudoku = createKnownSudoku();
        vi.spyOn(sudoku, "planRevealHint").mockReturnValue({ kind: "solved" });
        const api = mountHintHarness({ logEvent }, { sudoku });

        await api.openHintMenu();

        expect(sudoku.hintTracker.totalUsed).toBe(0);
        expect(logEvent).not.toHaveBeenCalled();
        expect(api.hintMode.active.value).toBe(false);
    });

    it("falls back to a random reveal when no technique applies", async () => {
        openHintDialog.mockReset();
        openHintDialog.mockResolvedValue("revealCell");
        const sudoku = createKnownSudoku();
        vi.spyOn(sudoku, "planRevealHint").mockReturnValue({ kind: "noTechnique" });
        const onHintReveal = vi.fn();
        const api = mountHintHarness({ logEvent: vi.fn().mockResolvedValue(undefined) }, { sudoku, onHintReveal });

        await api.openHintMenu();

        expect(api.hintMode.active.value).toBe(false);
        expect(sudoku.hintTracker.totalUsed).toBe(1);
        expect(onHintReveal).toHaveBeenCalledTimes(1);
        const [outcome] = onHintReveal.mock.calls[0] as [RevealOutcome];
        expect(outcome.value).toBe(sudoku.answer[outcome.cell.row][outcome.cell.column]);
    });

    it("enters hint mode, spends one hint and logs it once without touching the board", async () => {
        openHintDialog.mockReset();
        openHintDialog.mockResolvedValue("revealCell");
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const sudoku = createKnownSudoku();
        const stepRecorder = new StepRecorder();
        const api = mountHintHarness({ logEvent }, { sudoku, stepRecorder });

        await api.openHintMenu();
        await api.openHintMenu();

        expect(api.hintMode.active.value).toBe(true);
        expect(sudoku.hintTracker.totalUsed).toBe(1);
        expect(openHintDialog).toHaveBeenCalledTimes(1);
        expect(logEvent).toHaveBeenCalledTimes(1);
        expect(logEvent).toHaveBeenCalledWith({ name: "hint_used", hint_type: "reveal_cell" });
        expect(stepRecorder.steps).toHaveLength(0);
    });
});
