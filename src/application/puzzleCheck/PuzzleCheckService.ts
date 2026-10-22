import { checkPuzzle, type PuzzleCheck } from "@/application/puzzleCheck/checkPuzzle";

interface WorkerResponse {
    result?: PuzzleCheck;
    error?: string;
}

const cancelled = () => new DOMException("The puzzle check was cancelled", "AbortError");

/**
 * Checks the puzzle off the main thread, in a worker of its own that is stopped when the check
 * ends or `signal` aborts. Without Worker support, or when the worker fails to load, it checks on the page.
 */
export const checkPuzzleAsync = (values: number[][], signal?: AbortSignal): Promise<PuzzleCheck> => {
    if (signal?.aborted) return Promise.reject(cancelled());
    if (typeof Worker === "undefined") return Promise.resolve(checkPuzzle(values));

    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL("../../workers/puzzleCheck.worker.ts", import.meta.url), { type: "module" });
        const onAbort = () => {
            worker.terminate();
            reject(cancelled());
        };
        const finish = () => {
            worker.terminate();
            signal?.removeEventListener("abort", onAbort);
        };
        signal?.addEventListener("abort", onAbort, { once: true });
        worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
            finish();
            if (event.data.result) resolve(event.data.result);
            else reject(new Error(event.data.error ?? "The puzzle check failed"));
        });
        worker.addEventListener("error", () => {
            finish();
            try {
                resolve(checkPuzzle(values));
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
        // A plain copy: a reactive board can't be cloned into the worker.
        worker.postMessage({ values: values.map((row) => [...row]) });
    });
};
