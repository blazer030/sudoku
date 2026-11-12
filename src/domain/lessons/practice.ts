import { BOARD_SIZE } from "@/domain/board/constants";
import { SudokuSolver } from "@/domain/generator/SudokuSolver";
import { boardGrid, boardState } from "@/domain/lessons/lessonBoard";
import type { FillStep, LessonBoard, LessonHint, LightStep, NoteStep, PickStep, PlaceStep, PracticeStep, RemoveStep } from "@/domain/lessons/Lesson";
import { sameCell } from "@/domain/solver/cellRelations";
import type { Assignment, CellReference, Elimination } from "@/domain/solver/SolveStep";
import { boxIndexOf, type HouseKind } from "@/domain/board/geometry";
import { boxHouse, columnHouse, rowHouse } from "@/domain/solver/houses";

/** Why a tap was wrong, or what to do first. */
export type PracticeFeedback =
    | { kind: "conflict"; house: HouseKind; number: number; digit: number }
    | { kind: "outsideRange" }
    | { kind: "noCandidates" }
    | { kind: "turnOnNotes" }
    | { kind: "message"; key: string };

export interface PracticeState {
    placed: readonly Assignment[];
    picked: readonly CellReference[];
    removed: readonly Elimination[];
    notes: readonly number[];
    noteMode: boolean;
    selected: CellReference | null;
    /** The digit just tried in the selected cell, shown as wrong. */
    wrong: Assignment | null;
    /** The digit of a filled cell the player tapped, lit across the board. */
    sameDigit: number;
    hintLevel: number;
    solved: boolean;
    feedback: PracticeFeedback | null;
    /** Actions in a row that brought a correcting message; one that moves the step on, or a hint, starts it again. */
    missesInARow: number;
}

export type PracticeAction =
    | { kind: "tapCell"; row: number; column: number }
    | { kind: "pressDigit"; digit: number }
    | { kind: "toggleNoteMode" }
    | { kind: "requestHint" };

export const freshPracticeState = (): PracticeState => ({
    placed: [],
    picked: [],
    removed: [],
    notes: [],
    noteMode: false,
    selected: null,
    wrong: null,
    sameDigit: 0,
    hintLevel: 0,
    solved: false,
    feedback: null,
    missesInARow: 0,
});

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const rowCells = (row: number): readonly CellReference[] => rowHouse(row).cells;
const columnCells = (column: number): readonly CellReference[] => columnHouse(column).cells;
// Boxes count from 1 here, as the feedback names them
const boxNumberOf = ({ row, column }: CellReference): number => boxIndexOf(row, column) + 1;
const boxCells = (boxNumber: number): readonly CellReference[] => boxHouse(boxNumber - 1).cells;

const includesCell = (cells: readonly CellReference[] | undefined, cell: CellReference): boolean =>
    (cells ?? []).some(other => sameCell(other, cell));

/** The digit in a cell once the player's placements are counted, 0 when it is empty. */
export const practiceValueAt = (board: LessonBoard, state: PracticeState, cell: CellReference): number => {
    const placed = state.placed.find(item => sameCell(item.cell, cell));
    return placed ? placed.digit : Number(board.values[cell.row * BOARD_SIZE + cell.column]);
};

const conflictOf = (board: LessonBoard, state: PracticeState, cell: CellReference, digit: number): PracticeFeedback | null => {
    const holds = (other: CellReference) => practiceValueAt(board, state, other) === digit;
    if (rowCells(cell.row).some(holds)) return { kind: "conflict", house: "row", number: cell.row + 1, digit };
    if (columnCells(cell.column).some(holds)) return { kind: "conflict", house: "column", number: cell.column + 1, digit };
    const box = boxNumberOf(cell);
    if (boxCells(box).some(holds)) return { kind: "conflict", house: "box", number: box, digit };
    return null;
};

const canHold = (board: LessonBoard, state: PracticeState, cell: CellReference, digit: number): boolean =>
    practiceValueAt(board, state, cell) === 0 && conflictOf(board, state, cell, digit) === null;

const isHiddenSingle = (board: LessonBoard, state: PracticeState, cell: CellReference, digit: number): boolean => {
    if (!canHold(board, state, cell, digit)) return false;
    const openIn = (cells: readonly CellReference[]) => cells.filter(other => canHold(board, state, other, digit)).length;
    return openIn(boxCells(boxNumberOf(cell))) === 1 || openIn(rowCells(cell.row)) === 1 || openIn(columnCells(cell.column)) === 1;
};

const isNakedSingle = (board: LessonBoard, state: PracticeState, cell: CellReference, digit: number): boolean => {
    const open = DIGITS.filter(candidate => canHold(board, state, cell, candidate));
    return open.length === 1 && open[0] === digit;
};

const answers = new WeakMap<LessonBoard, number[][] | null>();
const answerOf = (board: LessonBoard): number[][] | null => {
    if (!answers.has(board)) answers.set(board, new SudokuSolver().solve(boardGrid(board)));
    return answers.get(board) ?? null;
};

const fillAccepts = (step: FillStep, state: PracticeState, cell: CellReference, digit: number): boolean => {
    if (step.rule === "nakedSingle") return isNakedSingle(step.board, state, cell, digit);
    return answerOf(step.board)?.[cell.row][cell.column] === digit;
};

const notYetOf = (key: string | undefined): PracticeFeedback | null => key === undefined ? null : { kind: "message", key };

const tapOnPlace = (step: PlaceStep, state: PracticeState, cell: CellReference): PracticeState => {
    const value = practiceValueAt(step.board, state, cell);
    if (value !== 0) return step.holdsDigit || state.sameDigit === value ? state : { ...state, sameDigit: value };
    const isRight = step.acceptsAnyHiddenSingle
        ? isHiddenSingle(step.board, state, cell, step.digit)
        : sameCell(cell, step.answer);
    if (isRight) return { ...state, placed: [...state.placed, { cell, digit: step.digit }], solved: true };
    if (step.range && !includesCell(step.range, cell)) return { ...state, feedback: { kind: "outsideRange" } };

    return { ...state, feedback: conflictOf(step.board, state, cell, step.digit) ?? notYetOf(step.notYetKey) };
};

const tapOnLight = (step: LightStep, state: PracticeState, cell: CellReference): PracticeState => {
    const value = practiceValueAt(step.board, state, cell);
    if (value === 0) return { ...state, feedback: { kind: "message", key: step.wrongKey } };
    return { ...state, sameDigit: value, solved: value === step.digit };
};

/** The cells a pick step takes next, given those picked so far. */
const nextPicks = ({ targets, order }: PickStep, picked: readonly CellReference[]): readonly CellReference[] => {
    if (order?.rule === "pivotFirst") return picked.length === 0 ? [targets[0]] : targets.slice(1);
    if (order?.rule === "chain") {
        const last = targets.length - 1;
        if (picked.length === 0) return [targets[0], targets[last]];
        const fromFirst = sameCell(picked[0], targets[0]);
        return [targets[fromFirst ? picked.length : last - picked.length]];
    }
    return targets;
};

const tapOnPick = (step: PickStep, state: PracticeState, cell: CellReference): PracticeState => {
    if (includesCell(state.picked, cell)) return state;
    if (!includesCell(step.targets, cell)) {
        if (practiceValueAt(step.board, state, cell) !== 0) return state;
        return { ...state, feedback: { kind: "message", key: step.wrongKey } };
    }
    if (step.order && !includesCell(nextPicks(step, state.picked), cell)) {
        return { ...state, feedback: { kind: "message", key: step.order.key } };
    }
    const picked = [...state.picked, cell];
    return { ...state, picked, solved: picked.length === step.targets.length };
};

const tapOnRemove = (step: RemoveStep, state: PracticeState, cell: CellReference): PracticeState => {
    const here = step.removals.filter(removal => sameCell(removal.cell, cell));
    if (here.length > 0) {
        if (state.removed.some(removal => sameCell(removal.cell, cell))) return state;
        const removed = [...state.removed, ...here];
        return { ...state, removed, solved: removed.length === step.removals.length };
    }
    if (includesCell(step.pattern, cell)) return { ...state, feedback: { kind: "message", key: step.keepKey } };
    if (practiceValueAt(step.board, state, cell) !== 0) return state;

    const candidates = boardState(step.board).candidatesOf(cell.row, cell.column);
    const digits = step.digits ?? [...new Set(step.removals.map(removal => removal.digit))];
    if (!candidates.some(digit => digits.includes(digit))) return { ...state, feedback: { kind: "noCandidates" } };
    return { ...state, feedback: { kind: "message", key: step.wrongKey } };
};

const tapOnFill = (step: FillStep, state: PracticeState, cell: CellReference): PracticeState => {
    const value = practiceValueAt(step.board, state, cell);
    if (value !== 0) return { ...state, selected: null, sameDigit: value };
    if (step.area && !includesCell(step.area, cell)) {
        const feedback: PracticeFeedback = step.areaKey ? { kind: "message", key: step.areaKey } : { kind: "outsideRange" };
        return { ...state, selected: null, sameDigit: 0, feedback };
    }
    return { ...state, selected: cell, sameDigit: 0 };
};

const tapOnNote = (step: NoteStep, state: PracticeState, cell: CellReference): PracticeState => {
    if (sameCell(step.cell, cell)) return { ...state, selected: cell };
    if (practiceValueAt(step.board, state, cell) !== 0) return state;
    return { ...state, selected: null, feedback: { kind: "outsideRange" } };
};

const pressOnFill = (step: FillStep, state: PracticeState, digit: number): PracticeState => {
    // The pad only shows while a cell is selected, so a press always has one
    const { selected } = state;
    if (selected === null) return state;

    if (fillAccepts(step, state, selected, digit)) {
        const placed = [...state.placed, { cell: selected, digit }];
        return { ...state, placed, selected: null, hintLevel: 0, solved: placed.length >= step.required };
    }
    return {
        ...state,
        wrong: { cell: selected, digit },
        feedback: conflictOf(step.board, state, selected, digit) ?? notYetOf(step.notYetKey),
    };
};

const pressOnNote = (step: NoteStep, state: PracticeState, digit: number): PracticeState => {
    if (state.selected === null) return state;
    if (!state.noteMode) return { ...state, feedback: { kind: "turnOnNotes" } };
    if (!step.digits.includes(digit)) {
        return { ...state, feedback: conflictOf(step.board, state, step.cell, digit) };
    }
    if (state.notes.includes(digit)) return state;
    const notes = [...state.notes, digit];
    return { ...state, notes, solved: notes.length === step.digits.length };
};

const lookingForFill = (step: FillStep, state: PracticeState): Assignment | null => {
    for (let box = 1; box <= BOARD_SIZE; box++) {
        for (const cell of boxCells(box)) {
            if (step.area && !includesCell(step.area, cell)) continue;
            if (practiceValueAt(step.board, state, cell) !== 0) continue;
            const digit = DIGITS.find(candidate => fillAccepts(step, state, cell, candidate));
            if (digit !== undefined) return { cell, digit };
        }
    }
    return null;
};

/** A step's hints, weakest first. A fill step's come from the board as it stands, so they never name a filled cell. */
export const hintsFor = (step: PracticeStep, state: PracticeState): readonly LessonHint[] => {
    if (step.kind !== "fill") return step.hints;
    if (step.hints.length > 0) return step.hints;

    const target = lookingForFill(step, state);
    if (target === null) return [];
    const { cell, digit } = target;
    const box = boxNumberOf(cell);
    const answer: LessonHint = {
        textKey: "lessons.common.hints.answer",
        params: { row: cell.row + 1, column: cell.column + 1, digit },
        marks: { lit: [cell] },
        selects: cell,
    };
    if (step.rule === "answer") return [answer];
    const houses = [...rowCells(cell.row), ...columnCells(cell.column), ...boxCells(box)];
    return [
        { textKey: "lessons.common.hints.lookAtCell", params: { row: cell.row + 1, column: cell.column + 1 }, marks: { lit: [cell] } },
        { textKey: "lessons.common.hints.countHouses", marks: { range: houses, lit: [cell] } },
        answer,
    ];
};

const requestHint = (step: PracticeStep, state: PracticeState): PracticeState => {
    const hints = hintsFor(step, state);
    if (state.hintLevel >= hints.length) return state;
    const hintLevel = state.hintLevel + 1;
    const selects = hints[hintLevel - 1].selects;
    return { ...state, hintLevel, selected: selects ?? state.selected, feedback: null, wrong: null };
};

const tapCell = (step: PracticeStep, state: PracticeState, cell: CellReference): PracticeState => {
    switch (step.kind) {
        case "place": return tapOnPlace(step, state, cell);
        case "light": return tapOnLight(step, state, cell);
        case "pick": return tapOnPick(step, state, cell);
        case "remove": return tapOnRemove(step, state, cell);
        case "fill": return tapOnFill(step, state, cell);
        case "note": return tapOnNote(step, state, cell);
    }
};

const pressDigit = (step: PracticeStep, state: PracticeState, digit: number): PracticeState => {
    if (step.kind === "fill") return pressOnFill(step, state, digit);
    if (step.kind === "note") return pressOnNote(step, state, digit);
    return state;
};

// Whether a tap or key took the player a step further
const movedOn = (before: PracticeState, after: PracticeState): boolean =>
    after.solved
    || after.placed.length > before.placed.length
    || after.picked.length > before.picked.length
    || after.removed.length > before.removed.length
    || after.notes.length > before.notes.length;

// A wrong answer adds to the count; a hint or a step further starts it again
const countMisses = (before: PracticeState, after: PracticeState, action: PracticeAction): PracticeState => {
    const missesInARow = action.kind === "requestHint" || movedOn(before, after) ? 0
        : after.feedback !== null ? before.missesInARow + 1
            : before.missesInARow;
    return missesInARow === after.missesInARow ? after : { ...after, missesInARow };
};

/** What one tap or key does to a practice step. Returns `state` itself when it changes nothing, wrong answers in a row included. */
export const practiceReducer = (step: PracticeStep, state: PracticeState, action: PracticeAction): PracticeState => {
    if (state.solved) return state;
    return countMisses(state, reduce(step, state, action), action);
};

const reduce = (step: PracticeStep, state: PracticeState, action: PracticeAction): PracticeState => {
    // A new tap or key clears what the last one said; if it changes nothing else, the screen shows nothing new
    const cleared: PracticeState = state.feedback === null && state.wrong === null ? state : { ...state, feedback: null, wrong: null };

    switch (action.kind) {
        case "requestHint":
            return requestHint(step, state);
        case "toggleNoteMode":
            return { ...cleared, noteMode: !state.noteMode };
        case "pressDigit":
            return pressDigit(step, cleared, action.digit);
        case "tapCell":
            return tapCell(step, cleared, { row: action.row, column: action.column });
    }
};
