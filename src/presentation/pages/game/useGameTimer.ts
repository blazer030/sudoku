import { type Ref, ref, onBeforeUnmount, watch } from "vue";

interface GameTimerOptions {
    initialSeconds: number;
    paused: Ref<boolean>;
}

export const useGameTimer = ({ initialSeconds, paused }: GameTimerOptions) => {
    const elapsedSeconds = ref(initialSeconds);
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
        if (intervalId) return;
        intervalId = setInterval(() => {
            elapsedSeconds.value++;
        }, 1000);
    };

    const stop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    watch(paused, (isPaused) => {
        if (isPaused) stop();
        else start();
    }, { immediate: true });

    onBeforeUnmount(() => {
        stop();
    });

    return { elapsedSeconds };
};
