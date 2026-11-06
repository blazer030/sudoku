import { BOARD_SIZE } from "@/domain/board/constants";
import { boardState } from "@/domain/lessons/lessonBoard";
import type { LessonBoard, StepMarks } from "@/domain/lessons/Lesson";
import { practiceValueAt, type PracticeState } from "@/domain/lessons/practice";
import { sameCell } from "@/domain/solver/cellRelations";
import type { CellReference } from "@/domain/solver/SolveStep";
import type { StepCellView, StepHighlight } from "@/presentation/components/step-presentation/stepCellView";

const has = (cells: readonly CellReference[] | undefined, cell: CellReference): boolean =>
    (cells ?? []).some(other => sameCell(other, cell));

/** A step's marks with a hint's on top: its cells added, its digits taking over. */
export const mergeMarks = (marks: StepMarks, hint: StepMarks | undefined): StepMarks => {
    if (hint === undefined) return marks;
    const joined = <Item>(first: readonly Item[] | undefined, second: readonly Item[] | undefined): readonly Item[] =>
        [...(first ?? []), ...(second ?? [])];
    return {
        ...marks,
        ...hint,
        range: joined(marks.range, hint.range),
        pattern: joined(marks.pattern, hint.pattern),
        targets: joined(marks.targets, hint.targets),
        crossed: joined(marks.crossed, hint.crossed),
        lit: joined(marks.lit, hint.lit),
        answers: joined(marks.answers, hint.answers),
        eliminated: joined(marks.eliminated, hint.eliminated),
    };
};

const highlightOf = (marks: StepMarks, practice: PracticeState, cell: CellReference, value: number): StepHighlight => {
    if (practice.wrong !== null && sameCell(practice.wrong.cell, cell)) return "wrong";
    if (practice.selected !== null && sameCell(practice.selected, cell)) return "answer";
    if (has(marks.lit, cell)) return "answer";
    if ((marks.answers ?? []).some(answer => sameCell(answer.cell, cell))) return "answer";
    if (practice.placed.some(placed => sameCell(placed.cell, cell))) return "answer";
    if (has(marks.targets, cell) || (practice.sameDigit !== 0 && value === practice.sameDigit)) return "target";
    if (has(marks.pattern, cell) || has(practice.picked, cell)) return "pattern";
    if (has(marks.range, cell)) return "scope";
    return "none";
};

/** How each cell of a lesson's board shows the current step, indexed [row][column]. */
export const lessonCellViews = (board: LessonBoard, marks: StepMarks, practice: PracticeState): StepCellView[][] => {
    const state = board.showsCandidates ? boardState(board) : null;
    const removed = [...(marks.eliminated ?? []), ...practice.removed];

    return Array.from({ length: BOARD_SIZE }, (_, row) => Array.from({ length: BOARD_SIZE }, (_, column): StepCellView => {
        const cell = { row, column };
        const answer = (marks.answers ?? []).find(item => sameCell(item.cell, cell));
        const value = answer?.digit ?? practiceValueAt(board, practice, cell);
        const candidates = state !== null && value === 0 ? state.candidatesOf(row, column) : null;
        const isKept = has(marks.range, cell) || has(marks.pattern, cell) || has(marks.targets, cell) || has(marks.lit, cell)
            || has(practice.picked, cell) || removed.some(item => sameCell(item.cell, cell));
        const isDimmedCell = marks.dimOthers === true && !isKept;

        return {
            highlight: highlightOf(marks, practice, cell, value),
            candidates,
            eliminated: removed.filter(item => sameCell(item.cell, cell)).map(item => item.digit),
            emphasized: (has(marks.pattern, cell) || has(practice.picked, cell))
                ? (candidates ?? []).filter(digit => (marks.emphasized ?? []).includes(digit))
                : [],
            dimmed: value !== 0 && isDimmedCell && value !== marks.keepDigit && answer === undefined,
            dimmedNotes: (candidates ?? []).filter(digit =>
                isDimmedCell || (marks.noteDigit !== undefined && digit !== marks.noteDigit)),
            crossed: has(marks.crossed, cell),
        };
    }));
};
