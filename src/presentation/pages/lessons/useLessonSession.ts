import { computed, ref } from "vue";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import type { Lesson, LessonHint, LessonStep, PracticeStep, StepMarks } from "@/domain/lessons/Lesson";
import { boardGrid } from "@/domain/lessons/lessonBoard";
import { freshPracticeState, hintsFor, practiceReducer, type PracticeAction, type PracticeFeedback, type PracticeState } from "@/domain/lessons/practice";
import type { CellReference } from "@/domain/solver/SolveStep";
import { lessonCellViews, mergeMarks } from "@/presentation/pages/lessons/lessonCellView";

export type LessonMessage =
    | { kind: "plain"; key: string }
    | { kind: "hint"; hint: LessonHint }
    | { kind: "wrong"; feedback: PracticeFeedback };

const isPractice = (step: LessonStep): step is PracticeStep => step.kind !== "show" && step.kind !== "done";

const EMPTY_MARKS: StepMarks = {};

/** Where the player is in a lesson, and what each of its steps shows. Practice stays as it was left when they go back, but for its wrong answers in a row. */
export const useLessonSession = (lesson: Lesson) => {
    const stepIndex = ref(0);
    const practices = ref<Record<number, PracticeState>>({});

    const step = computed(() => lesson.steps[stepIndex.value]);

    // The closing step keeps the board of the last practice, as the player left it
    const shownIndex = computed(() => {
        if (step.value.kind !== "done") return stepIndex.value;
        const steps = lesson.steps.slice(0, stepIndex.value);
        const last = steps.map(isPractice).lastIndexOf(true);
        return last === -1 ? stepIndex.value : last;
    });
    const shownStep = computed(() => lesson.steps[shownIndex.value]);

    const practiceAt = (index: number): PracticeState => practices.value[index] ?? freshPracticeState();
    const practice = computed(() => practiceAt(shownIndex.value));

    const hint = computed((): LessonHint | null => {
        const current = step.value;
        if (!isPractice(current)) return null;
        const state = practice.value;
        if (state.solved || state.hintLevel === 0) return null;
        return hintsFor(current, state)[state.hintLevel - 1] ?? null;
    });

    const marks = computed((): StepMarks => {
        if (step.value.kind === "done") return EMPTY_MARKS;
        return mergeMarks(shownStep.value.marks, hint.value?.marks);
    });

    const cellViews = computed(() => lessonCellViews(shownStep.value.board, marks.value, practice.value));

    const puzzleCells = computed((): PuzzleCell[][] => {
        const state = practice.value;
        const cells = boardGrid(shownStep.value.board).map(row => row.map(digit => new PuzzleCell(digit)));
        (marks.value.answers ?? []).forEach(({ cell, digit }) => { cells[cell.row][cell.column].entry = digit; });
        (marks.value.supposed ?? []).forEach(({ cell, digit }) => { cells[cell.row][cell.column].entry = digit; });
        state.placed.forEach(({ cell, digit }) => { cells[cell.row][cell.column].entry = digit; });
        if (state.wrong !== null) cells[state.wrong.cell.row][state.wrong.cell.column].entry = state.wrong.digit;
        const current = shownStep.value;
        if (current.kind === "note") {
            state.notes.forEach(digit => { cells[current.cell.row][current.cell.column].toggleNote(digit); });
        }
        return cells;
    });

    const message = computed((): LessonMessage => {
        const current = step.value;
        if (current.kind === "show") return { kind: "plain", key: current.textKey };
        if (current.kind === "done") return { kind: "plain", key: current.takeawayKey };
        const state = practice.value;
        if (state.solved) return { kind: "plain", key: current.successKey };
        if (state.feedback !== null) return { kind: "wrong", feedback: state.feedback };
        if (hint.value !== null) return { kind: "hint", hint: hint.value };
        return { kind: "plain", key: current.promptKey };
    });

    // A digit is only ever typed where the step leaves it to the player
    const padCell = computed((): CellReference | null => {
        const current = step.value;
        if (current.kind !== "fill" && current.kind !== "note") return null;
        return practice.value.solved ? null : practice.value.selected;
    });

    const canLeave = (index: number): boolean => {
        const candidate = lesson.steps[index];
        return !isPractice(candidate) || practiceAt(index).solved;
    };
    const canGoNext = computed(() => stepIndex.value < lesson.steps.length - 1 && canLeave(stepIndex.value));

    const canReach = (index: number): boolean => lesson.steps.slice(0, index).every((_, earlier) => canLeave(earlier));

    // Leaving a step starts its wrong answers in a row again; the rest of its practice stays
    const forgetMisses = (index: number) => {
        const state = practiceAt(index);
        if (state.missesInARow > 0) practices.value = { ...practices.value, [index]: { ...state, missesInARow: 0 } };
    };

    const goTo = (index: number) => {
        if (index === stepIndex.value || index < 0 || index >= lesson.steps.length || !canReach(index)) return;
        forgetMisses(stepIndex.value);
        stepIndex.value = index;
    };
    const next = () => { goTo(stepIndex.value + 1); };
    const previous = () => { goTo(stepIndex.value - 1); };

    // Only explanations lie between here and the next practice, so nothing unsolved is passed on the way
    const nextPracticeIndex = computed(() => lesson.steps.findIndex((candidate, index) => index > stepIndex.value && isPractice(candidate)));
    // Only where explanation lies between here and the practice; otherwise Next is the way there
    const canSkipToPractice = computed(() => nextPracticeIndex.value > stepIndex.value + 1);
    const skipToPractice = () => { goTo(nextPracticeIndex.value); };

    const dispatch = (action: PracticeAction) => {
        const current = step.value;
        if (!isPractice(current)) return;
        practices.value = { ...practices.value, [stepIndex.value]: practiceReducer(current, practice.value, action) };
    };

    const hintsLeft = computed(() => {
        const current = step.value;
        if (!isPractice(current) || practice.value.solved) return false;
        return practice.value.hintLevel < hintsFor(current, practice.value).length;
    });

    return {
        stepIndex,
        step,
        practice,
        marks,
        cellViews,
        puzzleCells,
        message,
        padCell,
        canGoNext,
        hintsLeft,
        canSkipToPractice,
        goTo,
        next,
        previous,
        skipToPractice,
        tapCell: (row: number, column: number) => { dispatch({ kind: "tapCell", row, column }); },
        pressDigit: (digit: number) => { dispatch({ kind: "pressDigit", digit }); },
        toggleNoteMode: () => { dispatch({ kind: "toggleNoteMode" }); },
        requestHint: () => { dispatch({ kind: "requestHint" }); },
    };
};
