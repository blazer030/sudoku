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
    notYetKey?: string;
}

/** Tap the cells of a pattern. */
export interface PickStep extends PracticeStepBase {
    kind: "pick";
    targets: readonly CellReference[];
    wrongKey: string;
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

export type PracticeStep = PlaceStep | PickStep | RemoveStep | FillStep | NoteStep;

export type LessonStep = ShowStep | PracticeStep | DoneStep;

export interface Lesson {
    id: LessonId;
    steps: readonly LessonStep[];
}
