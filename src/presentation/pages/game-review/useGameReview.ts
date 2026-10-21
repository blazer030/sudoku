import { computed, watch } from "vue";
import { GameReplay } from "@/domain/game/GameReplay";
import type { GameReplayData } from "@/application/statistics/StatisticsRepository";
import type { GameStep, GameStepAction } from "@/domain/game/GameStep";
import { usePlaybackState } from "@/presentation/components/playback/usePlaybackState";

export interface ReviewDescription {
    keypath: string;
    params: { value?: number; row?: number; column?: number };
}

const stepParams = (step: GameStep): ReviewDescription["params"] => ({
    value: step.value,
    row: step.row + 1,
    column: step.column + 1,
});

const ACTION_DESCRIPTIONS: Record<GameStepAction, (step: GameStep) => ReviewDescription> = {
    fill: (step) => ({ keypath: "review.fill", params: stepParams(step) }),
    erase: (step) => ({ keypath: "review.erase", params: stepParams(step) }),
    toggleNote: (step) => ({ keypath: "review.toggleNote", params: stepParams(step) }),
    hint: (step) => ({ keypath: "review.hint", params: stepParams(step) }),
    autoNotes: () => ({ keypath: "review.autoNotes", params: {} }),
    undo: () => ({ keypath: "review.undo", params: {} }),
};

export const useGameReview = (replayData: GameReplayData, completed: boolean) => {
    const replay = new GameReplay(replayData.initialBoard, replayData.steps);
    const virtualTotalSteps = computed(() => replay.totalSteps + 1);

    const playback = usePlaybackState(virtualTotalSteps);

    const isAtFinalStep = computed(() => playback.currentStep.value === virtualTotalSteps.value);

    watch(playback.currentStep, (step) => {
        if (step <= replay.totalSteps) {
            replay.goToStep(step);
        }
    }, { immediate: true });

    const board = computed(() => {
        if (isAtFinalStep.value) {
            replay.goToLast();
        }
        void playback.currentStep.value;
        return replay.board;
    });

    const gameStep = computed((): GameStep | null => {
        if (isAtFinalStep.value) return null;
        void playback.currentStep.value;
        return replay.currentGameStep;
    });

    const description = computed((): ReviewDescription | null => {
        if (isAtFinalStep.value) {
            return { keypath: completed ? "review.completed" : "review.gaveUp", params: {} };
        }
        const step = gameStep.value;
        if (!step) return null;
        return ACTION_DESCRIPTIONS[step.action](step);
    });

    return {
        currentStep: playback.currentStep,
        totalSteps: virtualTotalSteps,
        isAtFinalStep,
        board,
        gameStep,
        description,
        isPlaying: playback.isPlaying,
        next: playback.next,
        previous: playback.previous,
        goToFirst: playback.goToFirst,
        goToLast: playback.goToLast,
        goToStep: playback.goToStep,
        togglePlay: playback.togglePlay,
        stopPlay: playback.stopPlay,
        startPlay: playback.startPlay,
    };
};
