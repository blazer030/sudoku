import { onUnmounted, ref, type Ref } from "vue";

/** What a progress bar needs of playback: whether it plays, and how to pause and resume it around a drag. */
export interface PlayState {
    isPlaying: Ref<boolean>;
    stopPlay: () => void;
    startPlay: () => void;
}

export interface PlaybackStateOptions {
    intervalMs?: number;
    initialStep?: number;
}

export const usePlaybackState = (
    totalSteps: Ref<number>,
    options?: PlaybackStateOptions,
) => {
    const intervalMs = options?.intervalMs ?? 800;
    const currentStep = ref(options?.initialStep ?? 0);
    const isPlaying = ref(false);
    let playInterval: ReturnType<typeof setInterval> | null = null;

    const stopPlay = () => {
        isPlaying.value = false;
        if (playInterval !== null) {
            clearInterval(playInterval);
            playInterval = null;
        }
    };

    const goToStep = (step: number) => {
        const clamped = Math.max(0, Math.min(step, totalSteps.value));
        currentStep.value = clamped;
    };

    const next = () => {
        goToStep(currentStep.value + 1);
        if (currentStep.value >= totalSteps.value) {
            stopPlay();
        }
    };

    const previous = () => {
        goToStep(currentStep.value - 1);
    };

    const goToFirst = () => {
        goToStep(0);
    };

    const startPlay = () => {
        if (isPlaying.value || currentStep.value >= totalSteps.value) return;
        isPlaying.value = true;
        playInterval = setInterval(next, intervalMs);
    };

    const togglePlay = () => {
        if (isPlaying.value) {
            stopPlay();
            return;
        }
        if (currentStep.value >= totalSteps.value) {
            goToFirst();
        }
        startPlay();
    };

    onUnmounted(stopPlay);

    const playState: PlayState = { isPlaying, stopPlay, startPlay };

    return {
        currentStep,
        isPlaying,
        next,
        previous,
        goToFirst,
        goToStep,
        togglePlay,
        startPlay,
        stopPlay,
        playState,
    };
};
