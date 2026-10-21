import { ref } from "vue";
import type { RevealOutcome } from "@/domain/game/RevealOutcome";
import type { Sudoku } from "@/domain/game/Sudoku";
import type { StepRecorder } from "@/domain/game/StepRecorder";
import { provideHintMenu, type HintAction } from "@/presentation/pages/game/components/useHintMenu";
import type { AnalyticsEvent, AnalyticsService } from "@/application/analytics/AnalyticsService";

interface HintActionsOptions {
    sudoku: Sudoku;
    stepRecorder: StepRecorder;
    onRevealComplete: (origin: { row: number; column: number }) => void;
    onGroupCompleted?: (cells: { row: number; column: number }[], origin: { row: number; column: number }) => void;
    onHintReveal?: (outcome: RevealOutcome) => void;
    analytics?: AnalyticsService;
}

type HintUsedEvent = Extract<AnalyticsEvent, { name: "hint_used" }>;

const HINT_TYPE_EVENT: Record<Exclude<HintAction, "close">, HintUsedEvent["hint_type"]> = {
    autoNotes:      "auto_notes",
    checkConflicts: "check_conflicts",
    checkErrors:    "check_errors",
    revealCell:     "reveal_cell",
};

export const useHintActions = ({ sudoku, stepRecorder, onRevealComplete, onGroupCompleted, onHintReveal, analytics }: HintActionsOptions) => {
    const hintMenu = provideHintMenu();
    const errorCells = ref<{ row: number; column: number }[]>([]);

    const clearErrors = () => {
        errorCells.value = [];
    };

    const isError = (row: number, column: number): boolean =>
        errorCells.value.some(cell => cell.row === row && cell.column === column);

    const openHintMenu = async () => {
        const action = await hintMenu.open({
            recordedUsed: sudoku.hintTracker.recordedUsed,
            canUseHint: sudoku.hintTracker.canUseHint,
        });
        if (action === "close") return;
        sudoku.hintTracker.useHint();
        void analytics?.logEvent({ name: "hint_used", hint_type: HINT_TYPE_EVENT[action] });
        switch (action) {
        case "autoNotes":
            sudoku.autoNotes();
            stepRecorder.record(sudoku.puzzle, "autoNotes", 0, 0, 0);
            break;
        case "checkConflicts":
            errorCells.value = sudoku.checkAllConflicts();
            break;
        case "checkErrors":
            errorCells.value = sudoku.checkErrors();
            break;
        case "revealCell": {
            const outcome = sudoku.revealCellWithTechnique();
            if (outcome) {
                stepRecorder.record(sudoku.puzzle, "hint", outcome.cell.row, outcome.cell.column, outcome.value);
                onHintReveal?.(outcome);
            }
            if (outcome && !sudoku.isCompleted()) {
                const completed = sudoku.findCompletedGroups(outcome.cell.row, outcome.cell.column);
                if (completed.cells.length > 0) onGroupCompleted?.(completed.cells, outcome.cell);
            }
            onRevealComplete(outcome?.cell ?? { row: 4, column: 4 });
            break;
        }
        }
    };

    return { errorCells, clearErrors, isError, openHintMenu };
};
