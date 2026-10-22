import { computed, shallowRef, type Ref } from "vue";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import type { ChainLink } from "@/domain/solver/SolveStep";
import type { SolvePathStep } from "@/domain/solver/SolvePath";
import { usePlaybackState } from "@/presentation/components/playback/usePlaybackState";
import type { PlayState } from "@/presentation/components/playback/useProgressDrag";
import {
    type StepBoard,
    type StepCellView,
    stepCellViews,
    stepLinks,
} from "@/presentation/components/step-presentation/stepCellView";

/**
 * The walkthrough's solve path and where playback stands in it. Each step shows the board just before
 * it, marked the way hint mode marks it; every empty cell lists its candidates, since the solver
 * reasons over the whole board. When the path solves the board, playback ends on one more position,
 * the solved board, like the game review's final position; a path that gets stuck ends on its last step.
 */
export const useWalkthroughPlayback = (givens: Ref<number[][]>) => {
    /** null while the player is entering a puzzle. */
    const path = shallowRef<SolvePathStep[] | null>(null);

    /** The board after the path's last step, or null without steps. */
    const finalValues = computed<number[][] | null>(() => {
        const steps = path.value;
        if (steps === null || steps.length === 0) return null;
        const last = steps[steps.length - 1];
        const values = last.valuesBefore.map((rowValues) => [...rowValues]);
        for (const { cell, digit } of last.step.assignments) values[cell.row][cell.column] = digit;
        return values;
    });
    const solved = computed(() => finalValues.value?.every((rowValues) => rowValues.every((value) => value !== 0)) ?? false);

    // Positions run from the first step to the last, then to the solved board when there is one,
    // so auto-play ends on the last position.
    const stepCount = computed(() => (path.value?.length ?? 0) + (solved.value ? 1 : 0));
    const playback = usePlaybackState(computed(() => Math.max(0, stepCount.value - 1)));
    const stepIndex = playback.currentStep;
    const isCompleted = computed(() => solved.value && stepIndex.value === stepCount.value - 1);
    const playState: PlayState = {
        isPlaying: playback.isPlaying,
        stopPlay: playback.stopPlay,
        startPlay: playback.startPlay,
    };

    const currentStep = computed<SolvePathStep | null>(() => (isCompleted.value ? null : path.value?.[stepIndex.value] ?? null));
    const isLastStep = computed(() => stepCount.value > 0 && stepIndex.value === stepCount.value - 1);

    const start = (newPath: SolvePathStep[]) => {
        playback.stopPlay();
        path.value = newPath;
        playback.goToStep(0);
    };

    const stop = () => {
        playback.stopPlay();
        path.value = null;
        playback.goToStep(0);
    };

    const puzzleCells = computed<PuzzleCell[][]>(() => {
        const valuesBefore = isCompleted.value ? finalValues.value : currentStep.value?.valuesBefore ?? null;
        return givens.value.map((rowValues, row) => rowValues.map((given, column) => {
            const cell = new PuzzleCell(given);
            if (given === 0 && valuesBefore !== null) cell.entry = valuesBefore[row][column];
            return cell;
        }));
    });

    const cellViews = computed<StepCellView[][] | null>(() => {
        const current = currentStep.value;
        if (current === null) return null;
        const board: StepBoard = {
            isEmpty: (row, column) => current.valuesBefore[row][column] === 0,
            showsCandidates: () => true,
        };
        return stepCellViews(current, board);
    });

    const links = computed<ChainLink[]>(() => (currentStep.value === null ? [] : stepLinks(currentStep.value)));

    return {
        path,
        start,
        stop,
        stepIndex,
        stepCount,
        currentStep,
        isCompleted,
        isLastStep,
        playState,
        next: playback.next,
        previous: playback.previous,
        goTo: playback.goToStep,
        togglePlay: playback.togglePlay,
        puzzleCells,
        cellViews,
        links,
    };
};
