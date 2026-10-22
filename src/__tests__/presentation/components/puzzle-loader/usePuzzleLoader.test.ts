import { afterEach, describe, expect, it, vi } from "vitest";
import { usePuzzleLoader } from "@/presentation/components/puzzle-loader/usePuzzleLoader";

afterEach(() => {
    vi.useRealTimers();
});

describe("usePuzzleLoader", () => {
    it("should start with visible=false", () => {
        const { visible } = usePuzzleLoader();

        expect(visible.value).toBe(false);
    });

    it("runWithLoader should stay visible for the minimum time even when the task resolves at once", async () => {
        vi.useFakeTimers();
        const { visible, runWithLoader } = usePuzzleLoader();
        let result: string | undefined;

        void runWithLoader(() => Promise.resolve("done"), 150).then((value) => { result = value; });
        // The minimum time counts from the frame that paints the loader, one 16ms frame in
        await vi.advanceTimersByTimeAsync(16);
        await vi.advanceTimersByTimeAsync(149);

        expect(visible.value).toBe(true);
        expect(result).toBeUndefined();

        await vi.advanceTimersByTimeAsync(1);

        expect(visible.value).toBe(false);
        expect(result).toBe("done");
    });

    it("runWithLoader should release visible even when task rejects", async () => {
        const { visible, runWithLoader } = usePuzzleLoader();

        await expect(
            runWithLoader(() => Promise.reject(new Error("boom")), 50),
        ).rejects.toThrow("boom");
        expect(visible.value).toBe(false);
    });

    it("cancel should abort the running task and hide at once, skipping the minimum time", async () => {
        vi.useFakeTimers();
        const { visible, runWithLoader, cancel } = usePuzzleLoader();
        const seen: { signal: AbortSignal | null } = { signal: null };

        const promise = runWithLoader((signal) => {
            seen.signal = signal;
            return new Promise<never>((_resolve, reject) => {
                signal.addEventListener("abort", () => {
                    reject(new DOMException("cancelled", "AbortError"));
                });
            });
        }, 5000);
        // Past the paint frame the task starts; the clock never reaches the 5s minimum, so settling
        // proves cancel skipped it
        await vi.advanceTimersByTimeAsync(16);
        expect(seen.signal).not.toBeNull();
        cancel();

        await expect(promise).rejects.toMatchObject({ name: "AbortError" });
        expect(visible.value).toBe(false);
        expect(seen.signal?.aborted).toBe(true);
    });

    it("cancel before the task starts should never run it", async () => {
        const { visible, runWithLoader, cancel } = usePuzzleLoader();
        const task = vi.fn(() => Promise.resolve("done"));

        const promise = runWithLoader(task, 5000);
        cancel();

        await expect(promise).rejects.toMatchObject({ name: "AbortError" });
        expect(task).not.toHaveBeenCalled();
        expect(visible.value).toBe(false);
    });

    it("cancel after the task finished, while the minimum time runs out, should still reject as cancelled", async () => {
        const { visible, runWithLoader, cancel } = usePuzzleLoader();
        const task = vi.fn(() => Promise.resolve("done"));

        const promise = runWithLoader(task, 5000);
        await vi.waitFor(() => {
            expect(task).toHaveBeenCalled();
        });
        cancel();

        await expect(promise).rejects.toMatchObject({ name: "AbortError" });
        expect(visible.value).toBe(false);
    });

    it("cancel with nothing running should do nothing", () => {
        const { visible, cancel } = usePuzzleLoader();

        cancel();

        expect(visible.value).toBe(false);
    });
});
