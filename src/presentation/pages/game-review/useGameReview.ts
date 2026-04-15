import { computed, onUnmounted, ref, type Ref } from "vue";
import { GameReplay } from "@/domain/game/GameReplay";
import type { GameReplayData } from "@/application/Statistics";
import type { GameStep, GameStepAction } from "@/domain/game/GameStep";

const ACTION_LABELS: Record<GameStepAction, (step: GameStep) => string> = {
    fill: (s) => `Filled ${s.value} in R${s.row + 1}C${s.column + 1}`,
    erase: (s) => `Erased R${s.row + 1}C${s.column + 1}`,
    toggleNote: (s) => `Note ${s.value} in R${s.row + 1}C${s.column + 1}`,
    autoNotes: () => "Auto Notes",
    undo: () => "Undo",
};

const ACTION_ICONS: Record<GameStepAction, string> = {
    fill: "✏️",
    erase: "🧹",
    toggleNote: "📝",
    autoNotes: "🤖",
    undo: "↩️",
};

export const useGameReview = (replayData: GameReplayData) => {
    const replay = new GameReplay(replayData.initialBoard, replayData.steps);
    const currentStep = ref(0);
    const isPlaying = ref(false);
    let playInterval: ReturnType<typeof setInterval> | null = null;

    const board = computed(() => {
        void currentStep.value;
        return replay.board;
    });

    const gameStep = computed((): GameStep | null => {
        void currentStep.value;
        return replay.currentGameStep;
    });

    const description = computed(() => {
        const step = gameStep.value;
        if (!step) return null;
        const icon = ACTION_ICONS[step.action];
        const label = ACTION_LABELS[step.action](step);
        return `${icon} ${label}`;
    });

    const totalSteps = computed(() => replay.totalSteps);

    const next = () => {
        replay.next();
        currentStep.value = replay.currentStep;
        if (currentStep.value >= replay.totalSteps) {
            stopPlay();
        }
    };

    const previous = () => {
        replay.previous();
        currentStep.value = replay.currentStep;
    };

    const goToFirst = () => {
        replay.goToFirst();
        currentStep.value = 0;
    };

    const goToLast = () => {
        replay.goToLast();
        currentStep.value = replay.totalSteps;
        stopPlay();
    };

    const goToStep = (step: number) => {
        replay.goToStep(step);
        currentStep.value = replay.currentStep;
    };

    const togglePlay = () => {
        if (isPlaying.value) {
            stopPlay();
        } else {
            if (currentStep.value >= replay.totalSteps) {
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
        if (currentStep.value >= replay.totalSteps) return;
        isPlaying.value = true;
        playInterval = setInterval(next, 800);
    };

    onUnmounted(stopPlay);

    return {
        currentStep,
        totalSteps,
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
