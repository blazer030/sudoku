import { computed, onUnmounted, ref, type Ref } from "vue";
import { GameReplay } from "@/domain/game/GameReplay";
import type { GameReplayData } from "@/application/Statistics";
import type { GameStep, GameStepAction } from "@/domain/game/GameStep";

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
    const currentStep = ref(0);
    const isPlaying = ref(false);
    let playInterval: ReturnType<typeof setInterval> | null = null;

    const virtualTotalSteps = replay.totalSteps + 1;
    const isAtFinalStep = computed(() => currentStep.value === virtualTotalSteps);

    const board = computed(() => {
        if (isAtFinalStep.value) {
            replay.goToLast();
        }
        void currentStep.value;
        return replay.board;
    });

    const gameStep = computed((): GameStep | null => {
        if (isAtFinalStep.value) return null;
        void currentStep.value;
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

    const totalSteps = computed(() => virtualTotalSteps);

    const goToStep = (step: number) => {
        const clamped = Math.max(0, Math.min(step, virtualTotalSteps));
        if (clamped <= replay.totalSteps) {
            replay.goToStep(clamped);
        }
        currentStep.value = clamped;
    };

    const next = () => {
        goToStep(currentStep.value + 1);
        if (currentStep.value >= virtualTotalSteps) {
            stopPlay();
        }
    };

    const previous = () => {
        goToStep(currentStep.value - 1);
    };

    const goToFirst = () => {
        goToStep(0);
    };

    const goToLast = () => {
        goToStep(virtualTotalSteps);
        stopPlay();
    };

    const togglePlay = () => {
        if (isPlaying.value) {
            stopPlay();
        } else {
            if (currentStep.value >= virtualTotalSteps) {
                goToFirst();
            }
            isPlaying.value = true;
            playInterval = setInterval(next, 800);
        }
    };

    const stopPlay = () => {
        isPlaying.value = false;
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
        }
    };

    const startPlay = () => {
        if (currentStep.value >= virtualTotalSteps) return;
        isPlaying.value = true;
        playInterval = setInterval(next, 800);
    };

    onUnmounted(stopPlay);

    return {
        currentStep,
        totalSteps,
        isAtFinalStep,
        board,
        gameStep,
        description,
        isPlaying,
        next,
        previous,
        goToFirst,
        goToLast,
        goToStep,
        togglePlay,
        stopPlay,
        startPlay,
    };
};

export const useProgressDrag = (
    progressRef: Ref<HTMLElement | null>,
    totalSteps: Ref<number>,
    onSeek: (step: number) => void,
    playState: { isPlaying: Ref<boolean>; stopPlay: () => void; startPlay: () => void },
) => {
    const isDragging = ref(false);
    let wasPlaying = false;

    const calcStep = (clientX: number): number => {
        const el = progressRef.value;
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return Math.round(ratio * totalSteps.value);
    };

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
        isDragging.value = true;
        wasPlaying = playState.isPlaying.value;
        if (wasPlaying) playState.stopPlay();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        onSeek(calcStep(clientX));
        window.addEventListener("mousemove", onPointerMove);
        window.addEventListener("mouseup", onPointerUp);
        window.addEventListener("touchmove", onPointerMove);
        window.addEventListener("touchend", onPointerUp);
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging.value) return;
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        onSeek(calcStep(clientX));
    };

    const onPointerUp = () => {
        isDragging.value = false;
        if (wasPlaying) playState.startPlay();
        wasPlaying = false;
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("mouseup", onPointerUp);
        window.removeEventListener("touchmove", onPointerMove);
        window.removeEventListener("touchend", onPointerUp);
    };

    onUnmounted(onPointerUp);

    return { isDragging, onPointerDown };
};
