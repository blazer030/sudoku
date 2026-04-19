import { computed, watch } from "vue";
import { GameReplay } from "@/domain/game/GameReplay";
import type { GameReplayData } from "@/application/Statistics";
import type { GameStep, GameStepAction } from "@/domain/game/GameStep";
import { usePlaybackState } from "@/presentation/components/playback/usePlaybackState";

export interface DescriptionPart {
    text: string;
    bold?: boolean;
}

const position = (step: GameStep): DescriptionPart[] => [
    { text: "Row " }, { text: String(step.row + 1), bold: true },
    { text: ", Col " }, { text: String(step.column + 1), bold: true },
];

const ACTION_LABELS: Record<GameStepAction, (step: GameStep) => DescriptionPart[]> = {
    fill: (step) => [{ text: "Filled " }, { text: String(step.value), bold: true }, { text: " in " }, ...position(step)],
    erase: (step) => [{ text: "Erased " }, ...position(step)],
    toggleNote: (step) => [{ text: "Note " }, { text: String(step.value), bold: true }, { text: " in " }, ...position(step)],
    hint: (step) => [{ text: "Hint " }, { text: String(step.value), bold: true }, { text: " in " }, ...position(step)],
    autoNotes: () => [{ text: "Auto Notes" }],
    undo: () => [{ text: "Undo" }],
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

    const description = computed((): DescriptionPart[] | null => {
        if (isAtFinalStep.value) {
            return [{ text: completed ? "Completed" : "Gave up" }];
        }
        const step = gameStep.value;
        if (!step) return null;
        return ACTION_LABELS[step.action](step);
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
