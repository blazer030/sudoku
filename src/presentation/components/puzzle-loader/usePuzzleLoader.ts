import { nextTick, ref, type Ref } from "vue";

export interface PuzzleLoaderController {
    visible: Ref<boolean>;
    runWithLoader: <T>(task: () => Promise<T>, minDurationMs?: number) => Promise<T>;
}

const DEFAULT_MIN_DURATION_MS = 1000;

export const usePuzzleLoader = (): PuzzleLoaderController => {
    const visible = ref(false);

    const runWithLoader = async <T>(
        task: () => Promise<T>,
        minDurationMs: number = DEFAULT_MIN_DURATION_MS,
    ): Promise<T> => {
        visible.value = true;
        await nextTick();
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
        const startTime = performance.now();
        try {
            return await task();
        } finally {
            const elapsed = performance.now() - startTime;
            if (elapsed < minDurationMs) {
                await new Promise<void>((resolve) => {
                    setTimeout(resolve, minDurationMs - elapsed);
                });
            }
            visible.value = false;
        }
    };

    return { visible, runWithLoader };
};
