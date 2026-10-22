import { computed, ref, shallowRef } from "vue";
import { BOARD_SIZE } from "@/domain/board/constants";
import type { Sudoku } from "@/domain/game/Sudoku";
import type { RevealHintPlan, RevealHintStep } from "@/domain/game/RevealHint";
import type { CellReference, ChainLink } from "@/domain/solver/SolveStep";
import { sameCell } from "@/domain/solver/cellRelations";
import {
    cellKey,
    type StepBoard,
    type StepCellView,
    stepCellView,
    stepCellViews,
    stepLinks,
    touchedCellKeys,
} from "@/presentation/components/step-presentation/stepCellView";

export type HintPhase = "wrongEntry" | "steps";

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

    const links = computed<ChainLink[]>(() => (currentStep.value === null ? [] : stepLinks(currentStep.value)));

    // Every cell any step touches shows the solver's candidates, so they stay put while paging.
    const involvedKeys = computed(() => touchedCellKeys(steps.value));

    const board: StepBoard = {
        isEmpty: (row, column) => {
            const puzzleCell = sudoku.puzzle[row][column];
            return !puzzleCell.isClue && !puzzleCell.hasEntry;
        },
        showsCandidates: (row, column) => involvedKeys.value.has(cellKey({ row, column })),
    };

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

    const cellView = (row: number, column: number): StepCellView => {
        if (phase.value === "wrongEntry") {
            const view: StepCellView = { highlight: "none", candidates: null, eliminated: [], emphasized: [] };
            if (wrongCell.value !== null && sameCell(wrongCell.value, { row, column })) view.highlight = "wrong";
            return view;
        }

        const current = currentStep.value;
        if (current === null) return { highlight: "none", candidates: null, eliminated: [], emphasized: [] };
        return stepCellView(current, row, column, board);
    };

    // One 9×9 grid per phase and step, so re-renders that change neither (the timer tick) hand the cells
    // the same view objects instead of 81 new ones.
    const cellViews = computed<StepCellView[][] | null>(() => {
        if (phase.value === null) return null;
        const current = currentStep.value;
        if (phase.value === "steps" && current !== null) return stepCellViews(current, board);
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
