import { ref } from "vue";
import type { RevealOutcome } from "@/domain/game/RevealOutcome";
import type { Sudoku } from "@/domain/game/Sudoku";
import type { StepRecorder } from "@/domain/game/StepRecorder";
import type { CellReference } from "@/domain/solver/SolveStep";
import { provideHintMenu, type HintAction } from "@/presentation/pages/game/components/useHintMenu";
import type { AnalyticsEvent, AnalyticsService } from "@/application/analytics/AnalyticsService";
import { useHintMode } from "@/presentation/pages/game/hint-mode/useHintMode";

interface HintActionsOptions {
    sudoku: Sudoku;
    stepRecorder: StepRecorder;
    autoRemoveNotes: () => boolean;
    onRevealComplete: (origin: { row: number; column: number }) => void;
    onGroupCompleted?: (cells: { row: number; column: number }[], origin: { row: number; column: number }) => void;
    onHintReveal?: (outcome: RevealOutcome) => void;
    /** Check Conflicts found no repeated digits; the hint is still spent. */
    onNoConflicts?: () => void;
    analytics?: AnalyticsService;
}

type HintUsedEvent = Extract<AnalyticsEvent, { name: "hint_used" }>;

const HINT_TYPE_EVENT: Record<Exclude<HintAction, "close">, HintUsedEvent["hint_type"]> = {
    autoNotes:      "auto_notes",
    checkConflicts: "check_conflicts",
    revealCell:     "reveal_cell",
};

// Long enough for the pop and glow animations on the filled answer to finish.
const REVEALED_CELL_DURATION_MS = 1100;

export const useHintActions = ({
    sudoku,
    stepRecorder,
    autoRemoveNotes,
    onRevealComplete,
    onGroupCompleted,
    onHintReveal,
    onNoConflicts,
    analytics,
}: HintActionsOptions) => {
    const hintMenu = provideHintMenu();
    const errorCells = ref<{ row: number; column: number }[]>([]);
    const revealedCell = ref<CellReference | null>(null);
    let revealedCellTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearErrors = () => {
        errorCells.value = [];
    };

    const isError = (row: number, column: number): boolean =>
        errorCells.value.some(cell => cell.row === row && cell.column === column);

    const isRevealed = (row: number, column: number): boolean =>
        revealedCell.value?.row === row && revealedCell.value.column === column;

    const markRevealed = (cell: CellReference) => {
        if (revealedCellTimeout !== null) clearTimeout(revealedCellTimeout);
        revealedCell.value = cell;
        revealedCellTimeout = setTimeout(() => {
            revealedCell.value = null;
            revealedCellTimeout = null;
        }, REVEALED_CELL_DURATION_MS);
    };

    const finishReveal = (cell: CellReference) => {
        if (!sudoku.isCompleted()) {
            const completed = sudoku.findCompletedGroups(cell.row, cell.column);
            if (completed.cells.length > 0) onGroupCompleted?.(completed.cells, cell);
        }
        onRevealComplete(cell);
    };

    const hintMode = useHintMode(sudoku, {
        autoRemoveNotes,
        record: (action, cell, value) => {
            stepRecorder.record(sudoku.puzzle, action, cell.row, cell.column, value);
        },
        onApplied: (cell) => {
            markRevealed(cell);
            finishReveal(cell);
        },
    });

    const revealRandomCell = () => {
        const target = sudoku.revealRandomCell();
        if (target === null) {
            onRevealComplete({ row: 4, column: 4 });
            return;
        }
        const outcome: RevealOutcome = {
            cell: { row: target.row, column: target.column },
            value: sudoku.answer[target.row][target.column],
        };
        stepRecorder.record(sudoku.puzzle, "hint", outcome.cell.row, outcome.cell.column, outcome.value);
        onHintReveal?.(outcome);
        finishReveal(outcome.cell);
    };

    const openHintMenu = async () => {
        if (hintMode.active.value) return;
        const action = await hintMenu.open({
            remaining: sudoku.hintTracker.remainingHints,
            firstHintFree: sudoku.hintTracker.totalUsed === 0,
        });
        if (action === "close") return;
        // Plan before spending: a solved board has nothing to reveal and must not cost a hint.
        const plan = action === "revealCell" ? sudoku.planRevealHint() : null;
        if (plan?.kind === "solved") return;
        sudoku.hintTracker.useHint();
        void analytics?.logEvent({ name: "hint_used", hint_type: HINT_TYPE_EVENT[action] });
        switch (action) {
        case "autoNotes":
            sudoku.autoNotes();
            stepRecorder.record(sudoku.puzzle, "autoNotes", 0, 0, 0);
            break;
        case "checkConflicts":
            errorCells.value = sudoku.checkAllConflicts();
            if (errorCells.value.length === 0) onNoConflicts?.();
            break;
        case "revealCell": {
            // A wrong entry or a solver path is shown step by step; only a stuck solver falls back to a random cell.
            if (plan?.kind === "wrongEntry" || plan?.kind === "steps") {
                clearErrors();
                hintMode.start(plan);
                break;
            }
            revealRandomCell();
            break;
        }
        }
    };

    // Closes whichever hint overlay is on top (the menu, else the hint panel); false when none is open.
    const dismissOverlay = (): boolean => {
        if (hintMenu.visible.value) {
            hintMenu.close("close");
            return true;
        }
        if (hintMode.active.value) {
            hintMode.close();
            return true;
        }
        return false;
    };

    return { errorCells, clearErrors, isError, isRevealed, openHintMenu, hintMode, dismissOverlay };
};
