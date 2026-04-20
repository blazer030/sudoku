import { onUnmounted, ref, type Ref } from "vue";

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

    const goToLast = () => {
        goToStep(totalSteps.value);
        stopPlay();
    };

    const startPlay = () => {
        if (currentStep.value >= totalSteps.value) return;
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

    return {
        currentStep,
        isPlaying,
        next,
        previous,
        goToFirst,
        goToLast,
        goToStep,
        togglePlay,
        startPlay,
        stopPlay,
    };
};
