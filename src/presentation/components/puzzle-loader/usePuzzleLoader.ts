import { nextTick, ref, type Ref } from "vue";

export interface PuzzleLoaderController {
    visible: Ref<boolean>;
    /** Shows the loader while `task` runs, for at least `minDurationMs`; the task gets a signal that `cancel` aborts. */
    runWithLoader: <T>(task: (signal: AbortSignal) => Promise<T>, minDurationMs?: number) => Promise<T>;
    /** Aborts the running task and hides the loader at once, without waiting out the minimum time. */
    cancel: () => void;
}

export const PUZZLE_LOADER_MINIMUM_MS = 1000;

export const usePuzzleLoader = (): PuzzleLoaderController => {
    const visible = ref(false);
    let currentRun: AbortController | null = null;

    // Resolves after `durationMs`, or as soon as the run is cancelled.
    const waitUnlessCancelled = (durationMs: number, signal: AbortSignal) => new Promise<void>((resolve) => {
        if (signal.aborted) {
            resolve();
            return;
        }
        const timer = setTimeout(resolve, durationMs);
        signal.addEventListener("abort", () => {
            clearTimeout(timer);
            resolve();
        }, { once: true });
    });

    const runWithLoader = async <T>(
        task: (signal: AbortSignal) => Promise<T>,
        minDurationMs: number = PUZZLE_LOADER_MINIMUM_MS,
    ): Promise<T> => {
        const run = new AbortController();
        currentRun = run;
        visible.value = true;
        await nextTick();
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
        const startTime = performance.now();
        try {
            if (run.signal.aborted) throw run.signal.reason;
            return await task(run.signal);
        } finally {
            const elapsed = performance.now() - startTime;
            if (elapsed < minDurationMs) {
                await waitUnlessCancelled(minDurationMs - elapsed, run.signal);
            }
            if (currentRun === run) {
                currentRun = null;
                visible.value = false;
            }
        }
    };

    const cancel = () => {
        const run = currentRun;
        if (run === null) return;
        currentRun = null;
        visible.value = false;
        run.abort();
    };

    return { visible, runWithLoader, cancel };
};
