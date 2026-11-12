import type { Assignment, CellReference, ChainLink, Elimination, TechniqueId } from "@/domain/solver/SolveStep";

export type LessonId =
    | "rules"
    | "fillingIn"
    | "hiddenSingle"
    | "nakedSingle"
    | "pointing"
    | "claiming"
    | "nakedPair"
    | "hiddenPair"
    | "nakedSubset"
    | "hiddenSubset"
    | "xWing"
    | "fish"
    | "xyWing"
    | "wWing"
    | "xyzWing"
    | "xChain"
    | "xyChain";

export type LessonGroupId = "basics" | "easy" | "medium" | "hard";

export type LessonStage = "explain" | "follow" | "alone" | "done";

/** A position to teach on: the digits on the board (row by row, 0 for empty) and the candidates already ruled out. */
export interface LessonBoard {
    values: string;
    removedCandidates?: readonly Elimination[];
    /** Whether empty cells list their candidates, as hint mode does. */
    showsCandidates: boolean;
}

/** What a step, or a hint on it, picks out on the board. */
export interface StepMarks {
    range?: readonly CellReference[];
    pattern?: readonly CellReference[];
    targets?: readonly CellReference[];
    crossed?: readonly CellReference[];
    lit?: readonly CellReference[];
    answers?: readonly Assignment[];
    eliminated?: readonly Elimination[];
    /** Candidates stressed in the pattern's cells. */
    emphasized?: readonly number[];
    /** Dims the digits and notes that have nothing to do with this step. */
    dimOthers?: boolean;
    /** This digit stays undimmed anywhere on the board. */
    keepDigit?: number;
    /** Other candidates are dimmed, wherever they are. */
    noteDigit?: number;
    links?: readonly ChainLink[];
    /** Digits supposed for the length of an argument, in the order it places them; never part of the board. */
    supposed?: readonly Assignment[];
    /** Supposed cells shown as refuted. */
    refuted?: readonly CellReference[];
}

export interface LessonHint {
    textKey: string;
    params?: Record<string, number>;
    marks?: StepMarks;
    /** The cell a fill step's last hint selects, so the digit pad opens there. */
    selects?: CellReference;
}

interface LessonStepBase {
    stage: LessonStage;
    board: LessonBoard;
    marks: StepMarks;
}

/** One idea of an explanation; nothing to do but read it. */
export interface ShowStep extends LessonStepBase {
    kind: "show";
    textKey: string;
    /** When set, the marks' eliminations are checked against this technique. */
    technique?: TechniqueId;
    /** Claims that, with every supposed digit on the board, the range has no place left for the digit. */
    contradiction?: Contradiction;
}

export interface Contradiction {
    digit: number;
    range: readonly CellReference[];
}

interface PracticeStepBase extends LessonStepBase {
    promptKey: string;
    successKey: string;
    hints: readonly LessonHint[];
}

/** The digit is known: tap the cell it goes in. */
export interface PlaceStep extends PracticeStepBase {
    kind: "place";
    digit: number;
    /** The cell hints lead to. */
    answer: CellReference;
    /** Any cell where the digit is a hidden single counts, not just `answer`. */
    acceptsAnyHiddenSingle?: boolean;
    /** Tapping outside this says to look here first. */
    range?: readonly CellReference[];
    /** Said for a cell where the digit fits but isn't the answer. A step where that can happen must have it (a test checks). */
    notYetKey?: string;
    /** The step is about this digit alone: tapping a filled cell lights no other. */
    holdsDigit?: boolean;
}

/** Tap any cell holding the digit, which lights it across the board. */
export interface LightStep extends PracticeStepBase {
    kind: "light";
    digit: number;
    /** The cell hints lead to. */
    answer: CellReference;
    /** Said for an empty cell. */
    wrongKey: string;
}

/**
 * The order a pattern's cells are tapped in. `chain`: `targets` run along the chain, tapped from either end, each joined to the last.
 * `pivotFirst`: `targets[0]` is the pivot, tapped before the rest, which come in any order.
 */
export interface PickOrder {
    rule: "chain" | "pivotFirst";
    /** Said for a cell of the pattern tapped before its turn. */
    key: string;
}

/** Tap the cells of a pattern, in any order unless it has one. */
export interface PickStep extends PracticeStepBase {
    kind: "pick";
    targets: readonly CellReference[];
    wrongKey: string;
    order?: PickOrder;
}

/** Tap the cells that can lose a candidate. */
export interface RemoveStep extends PracticeStepBase {
    kind: "remove";
    removals: readonly Elimination[];
    /** The pattern the removals follow from: tapping it says to keep it. */
    pattern: readonly CellReference[];
    technique?: TechniqueId;
    keepKey: string;
    wrongKey: string;
    /** The digits the step is about; a cell with none of them says so. */
    digits?: readonly number[];
}

export type FillRule = "answer" | "nakedSingle";

/** The digit has to be worked out: tap a cell, then use the digit pad. */
export interface FillStep extends PracticeStepBase {
    kind: "fill";
    rule: FillRule;
    /** How many cells to fill before the step is solved. */
    required: number;
    /** Only these cells can be chosen. */
    area?: readonly CellReference[];
    areaKey?: string;
    /** Said for a digit that fits the cell but isn't the answer. A step where that can happen must have it (a test checks). */
    notYetKey?: string;
}

/** Filling in and notes only: write the given candidates in a cell, with the note mode on. */
export interface NoteStep extends PracticeStepBase {
    kind: "note";
    cell: CellReference;
    digits: readonly number[];
}

export interface DoneStep extends LessonStepBase {
    kind: "done";
    takeawayKey: string;
}

export type PracticeStep = PlaceStep | LightStep | PickStep | RemoveStep | FillStep | NoteStep;

export type LessonStep = ShowStep | PracticeStep | DoneStep;

/** Whether the player does the step, as against reading it or finishing the lesson. */
export const isPracticeStep = (step: LessonStep): step is PracticeStep => step.kind !== "show" && step.kind !== "done";

export interface Lesson {
    id: LessonId;
    steps: readonly LessonStep[];
}
