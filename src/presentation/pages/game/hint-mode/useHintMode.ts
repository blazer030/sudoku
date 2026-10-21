import { computed, ref, shallowRef } from "vue";
import { BOARD_SIZE, BOX_SIZE } from "@/domain/board/constants";
import type { Sudoku } from "@/domain/game/Sudoku";
import type { RevealHintPlan, RevealHintStep } from "@/domain/game/RevealHint";
import type { CellReference, ChainLink, Scope, SolveStep } from "@/domain/solver/SolveStep";

export type HintPhase = "wrongEntry" | "steps";

export type HintHighlight = "none" | "scope" | "pattern" | "answer" | "wrong";

export interface HintCellView {
    highlight: HintHighlight;
    /** The solver's candidates to show instead of the player's notes; null keeps the player's own content. */
    candidates: number[] | null;
    eliminated: number[];
    emphasized: number[];
}

export interface HintAnswer {
    cell: CellReference;
    digit: number;
}

interface HintModeOptions {
    autoRemoveNotes: () => boolean;
    onApplied: (cell: CellReference) => void;
    record: (action: "hint" | "erase", cell: CellReference, value: number) => void;
}

type StepsPlan = Extract<RevealHintPlan, { kind: "steps" }>;

const cellKey = (cell: CellReference): string => `${cell.row}-${cell.column}`;

const sameCell = (left: CellReference, right: CellReference): boolean =>
    left.row === right.row && left.column === right.column;

const scopeCells = (scope: Scope): CellReference[] => {
    const cells: CellReference[] = [];
    if (scope.kind === "row") {
        for (let column = 0; column < BOARD_SIZE; column++) cells.push({ row: scope.row, column });
    } else if (scope.kind === "column") {
        for (let row = 0; row < BOARD_SIZE; row++) cells.push({ row, column: scope.column });
    } else {
        for (let row = scope.boxRow; row < scope.boxRow + BOX_SIZE; row++) {
            for (let column = scope.boxColumn; column < scope.boxColumn + BOX_SIZE; column++) {
                cells.push({ row, column });
            }
        }
    }
    return cells;
};

// Wings carry no chain links of their own, so draw the relationships that make them work.
const wingLinks = ({ step, candidatesBefore }: RevealHintStep): ChainLink[] => {
    const candidatesOf = (cell: CellReference): number[] => candidatesBefore[cell.row][cell.column];
    const eliminatedDigit = step.eliminations.length > 0 ? step.eliminations[0].digit : 0;

    if (step.technique === "xyWing" || step.technique === "xyzWing" || step.technique === "wxyzWing") {
        const [pivot, ...pincers] = step.focus;
        return pincers.map((pincer) => {
            const shared = candidatesOf(pincer).filter((digit) => candidatesOf(pivot).includes(digit));
            // Anchor the line on the digit the pivot hands to the pincer, not on the eliminated one.
            const digit = shared.find((candidate) => candidate !== eliminatedDigit) ?? (shared.length > 0 ? shared[0] : 0);
            return { from: pivot, to: pincer, digit, type: "strong" };
        });
    }

    if (step.technique === "wWing" && step.supporters) {
        // Endpoint – supporter – strong link – supporter – endpoint, all on the pair digit that is kept.
        const [endpointOne, endpointTwo] = step.focus;
        const [supporterOne, supporterTwo] = step.supporters;
        const linkDigit = candidatesOf(endpointOne).find((digit) => digit !== eliminatedDigit) ?? 0;
        return [
            { from: endpointOne, to: supporterOne, digit: linkDigit, type: "weak" },
            { from: supporterOne, to: supporterTwo, digit: linkDigit, type: "strong" },
            { from: supporterTwo, to: endpointTwo, digit: linkDigit, type: "weak" },
        ];
    }

    return [];
};

const patternDigits = (step: SolveStep, candidates: number[], eliminatedHere: number[]): number[] => {
    if (step.technique.startsWith("naked")) return candidates;
    if (step.technique.startsWith("hidden")) return candidates.filter((digit) => !eliminatedHere.includes(digit));
    const eliminationDigits = new Set(step.eliminations.map((elimination) => elimination.digit));
    return candidates.filter((digit) => eliminationDigits.has(digit));
};

/**
 * Temporary, unsaved hint state on the game board: either one wrong entry to point out, or the solver
 * steps leading to the next assignment. The board only changes through `clearWrongEntry` or `fill`.
 */
export const useHintMode = (sudoku: Sudoku, { autoRemoveNotes, onApplied, record }: HintModeOptions) => {
    const phase = ref<HintPhase | null>(null);
    const wrongCell = ref<CellReference | null>(null);
    const stepsPlan = shallowRef<StepsPlan | null>(null);
    const stepIndex = ref(0);

    const active = computed(() => phase.value !== null);
    const steps = computed<RevealHintStep[]>(() => stepsPlan.value?.steps ?? []);
    const currentStep = computed<RevealHintStep | null>(() => steps.value[stepIndex.value] ?? null);
    const isLastStep = computed(() => steps.value.length > 0 && stepIndex.value === steps.value.length - 1);
    const answer = computed<HintAnswer | null>(() =>
        stepsPlan.value === null ? null : { cell: stepsPlan.value.target, digit: stepsPlan.value.digit });

    const links = computed<ChainLink[]>(() => {
        const current = currentStep.value;
        if (current === null) return [];
        if (current.step.chainLinks && current.step.chainLinks.length > 0) return current.step.chainLinks;
        return wingLinks(current);
    });

    // Every cell any step touches shows the solver's candidates, so they stay put while paging.
    const involvedKeys = computed(() => {
        const keys = new Set<string>();
        const add = (cell: CellReference) => keys.add(cellKey(cell));
        for (const { step } of steps.value) {
            step.focus.forEach(add);
            step.supporters?.forEach(add);
            step.eliminations.forEach((elimination) => add(elimination.cell));
            step.assignments.forEach((assignment) => add(assignment.cell));
            step.chainLinks?.forEach((link) => { add(link.from); add(link.to); });
            step.scopes.flatMap(scopeCells).forEach(add);
        }
        return keys;
    });

    const scopeKeys = computed(() =>
        new Set((currentStep.value?.step.scopes ?? []).flatMap(scopeCells).map(cellKey)));

    const linkDigitsAt = (cell: CellReference): number[] =>
        links.value
            .filter((link) => sameCell(link.from, cell) || sameCell(link.to, cell))
            .map((link) => link.digit);

    const end = () => {
        phase.value = null;
        wrongCell.value = null;
        stepsPlan.value = null;
        stepIndex.value = 0;
    };

    const start = (plan: RevealHintPlan) => {
        end();
        if (plan.kind === "wrongEntry") {
            wrongCell.value = plan.cell;
            phase.value = "wrongEntry";
        } else if (plan.kind === "steps") {
            stepsPlan.value = plan;
            phase.value = "steps";
        }
    };

    const goTo = (index: number) => {
        stepIndex.value = Math.max(0, Math.min(steps.value.length - 1, index));
    };
    const next = () => { goTo(stepIndex.value + 1); };
    const previous = () => { goTo(stepIndex.value - 1); };

    const cancel = end;

    const clearWrongEntry = () => {
        const cell = wrongCell.value;
        if (cell === null) return;
        sudoku.erase(cell.row, cell.column);
        record("erase", cell, 0);
        end();
    };

    const fill = () => {
        const plan = stepsPlan.value;
        if (plan === null) return;
        const eliminations = plan.steps.flatMap(({ step }) => step.eliminations);
        sudoku.applyRevealHint(plan.target, plan.digit, eliminations, { autoRemoveNotes: autoRemoveNotes() });
        record("hint", plan.target, plan.digit);
        end();
        onApplied(plan.target);
    };

    const cellView = (row: number, column: number): HintCellView => {
        const cell = { row, column };
        const view: HintCellView = { highlight: "none", candidates: null, eliminated: [], emphasized: [] };

        if (phase.value === "wrongEntry") {
            if (wrongCell.value !== null && sameCell(wrongCell.value, cell)) view.highlight = "wrong";
            return view;
        }

        const current = currentStep.value;
        if (current === null) return view;
        const { step, candidatesBefore } = current;

        const puzzleCell = sudoku.puzzle[row][column];
        const isEmpty = !puzzleCell.isClue && !puzzleCell.hasEntry;
        const candidates = isEmpty && involvedKeys.value.has(cellKey(cell)) ? candidatesBefore[row][column] : [];
        const eliminated = step.eliminations
            .filter((elimination) => sameCell(elimination.cell, cell))
            .map((elimination) => elimination.digit);
        if (isEmpty) {
            view.candidates = candidates;
            view.eliminated = eliminated;
        }

        const assignment = step.assignments.find((item) => sameCell(item.cell, cell));
        if (assignment) {
            view.highlight = "answer";
            view.emphasized = [assignment.digit];
        } else if (step.focus.some((focus) => sameCell(focus, cell))) {
            view.highlight = "pattern";
            if (step.assignments.length === 0) view.emphasized = patternDigits(step, candidates, eliminated);
        } else if (step.supporters?.some((supporter) => sameCell(supporter, cell))) {
            view.highlight = "pattern";
            view.emphasized = candidates.filter((digit) => linkDigitsAt(cell).includes(digit));
        } else if (scopeKeys.value.has(cellKey(cell))) {
            view.highlight = "scope";
        }
        return view;
    };

    // One 9×9 grid per phase and step, so re-renders that change neither (the timer tick) hand the cells
    // the same view objects instead of 81 new ones.
    const cellViews = computed<HintCellView[][] | null>(() => {
        if (phase.value === null) return null;
        return Array.from({ length: BOARD_SIZE }, (_, row) =>
            Array.from({ length: BOARD_SIZE }, (__, column) => cellView(row, column)));
    });

    return {
        active,
        phase,
        wrongCell,
        steps,
        stepIndex,
        currentStep,
        isLastStep,
        answer,
        links,
        start,
        goTo,
        next,
        previous,
        cancel,
        clearWrongEntry,
        fill,
        cellView,
        cellViews,
    };
};
