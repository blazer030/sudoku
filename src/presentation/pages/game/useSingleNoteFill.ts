import { onScopeDispose, ref } from "vue";
import type { CompletedCells, Sudoku } from "@/domain/game/Sudoku";
import type { StepRecorder } from "@/domain/game/StepRecorder";

/** How long after one cell of a run the next is filled, so each plays its arrival in turn. */
export const SINGLE_NOTE_FILL_STEP_MS = 60;

interface SingleNoteFillOptions {
    sudoku: Sudoku;
    stepRecorder: StepRecorder;
    autoRemoveNotes: () => boolean;
    motionAllowed: () => boolean;
    checkAndComplete: () => void;
    onGroupCompleted?: (completed: CompletedCells, origin: { row: number; column: number }) => void;
    onFilled?: (count: number) => void;
    onNothingToFill?: () => void;
}

/**
 * Fills every cell down to one note, one round only: the plan is fixed before the first fill, so a note
 * a fill removes does not change it, and a peer it leaves with a single note waits for the next run.
 */
export const useSingleNoteFill = ({
    sudoku,
    stepRecorder,
    autoRemoveNotes,
    motionAllowed,
    checkAndComplete,
    onGroupCompleted,
    onFilled,
    onNothingToFill,
}: SingleNoteFillOptions) => {
    const running = ref(false);
    let plan: ReturnType<Sudoku["singleNoteCells"]> = [];
    let nextIndex = 0;
    let stepTimer: ReturnType<typeof setTimeout> | null = null;

    const fillNext = () => {
        const { row, column, digit } = plan[nextIndex];
        nextIndex++;
        sudoku.fillInRun(row, column, digit, { autoRemoveNotes: autoRemoveNotes() });
        stepRecorder.record(sudoku.puzzle, "fill", row, column, digit);
    };

    // A new group effect replaces a running one, so the whole run plays one, holding each group once
    const playMergedGroupEffect = () => {
        const groups = new Map<string, CompletedCells["groups"][number]>();
        const cells = new Map<string, CompletedCells["cells"][number]>();
        for (const { row, column } of plan) {
            const completed = sudoku.findCompletedGroups(row, column);
            for (const group of completed.groups) groups.set(`${group.kind}${group.index}`, group);
            for (const cell of completed.cells) cells.set(`${cell.row},${cell.column}`, cell);
        }
        if (groups.size === 0) return;
        const { row, column } = plan[plan.length - 1];
        onGroupCompleted?.({ groups: [...groups.values()], cells: [...cells.values()] }, { row, column });
    };

    const end = () => {
        running.value = false;
        if (!sudoku.isCompleted()) playMergedGroupEffect();
        checkAndComplete();
        onFilled?.(plan.length);
    };

    const scheduleNext = () => {
        stepTimer = setTimeout(() => {
            stepTimer = null;
            fillNext();
            if (nextIndex < plan.length) scheduleNext();
            else end();
        }, SINGLE_NOTE_FILL_STEP_MS);
    };

    const clearTimer = () => {
        if (stepTimer !== null) clearTimeout(stepTimer);
        stepTimer = null;
    };

    /** Fills the rest at once, so nothing saves or shows a part of a run. Does nothing with no run going. */
    const finish = () => {
        if (!running.value) return;
        clearTimer();
        while (nextIndex < plan.length) fillNext();
        end();
    };

    const start = () => {
        if (running.value) return;
        plan = sudoku.singleNoteCells();
        nextIndex = 0;
        if (plan.length === 0) {
            onNothingToFill?.();
            return;
        }
        sudoku.beginFillRun();
        running.value = true;
        if (!motionAllowed()) {
            finish();
            return;
        }
        fillNext();
        if (nextIndex < plan.length) scheduleNext();
        else end();
    };

    onScopeDispose(clearTimer);

    return { running, start, finish };
};
