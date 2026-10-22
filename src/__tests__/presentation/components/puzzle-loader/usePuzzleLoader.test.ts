import { describe, expect, it, vi } from "vitest";
import { usePuzzleLoader } from "@/presentation/components/puzzle-loader/usePuzzleLoader";

describe("usePuzzleLoader", () => {
    it("should start with visible=false", () => {
        const { visible } = usePuzzleLoader();

        expect(visible.value).toBe(false);
    });

    it("runWithLoader should keep visible true until min duration elapsed", async () => {
        const { visible, runWithLoader } = usePuzzleLoader();
        const visibilityTimeline: boolean[] = [];

        const promise = runWithLoader(() => Promise.resolve("done"), 150);
        visibilityTimeline.push(visible.value);

        const result = await promise;

        expect(result).toBe("done");
        expect(visible.value).toBe(false);
        expect(visibilityTimeline[0]).toBe(true);
    });

    it("runWithLoader should wait min duration even if task resolves instantly", async () => {
        const { runWithLoader } = usePuzzleLoader();

        const startTime = performance.now();
        await runWithLoader(() => Promise.resolve(null), 200);
        const elapsed = performance.now() - startTime;

        expect(elapsed).toBeGreaterThanOrEqual(180);
    });

    it("runWithLoader should release visible even when task rejects", async () => {
        const { visible, runWithLoader } = usePuzzleLoader();

        await expect(
            runWithLoader(() => Promise.reject(new Error("boom")), 50),
        ).rejects.toThrow("boom");
        expect(visible.value).toBe(false);
    });

    it("cancel should abort the running task and hide at once, skipping the minimum time", async () => {
        const { visible, runWithLoader, cancel } = usePuzzleLoader();
        const seen: { signal: AbortSignal | null } = { signal: null };

        const startTime = performance.now();
        const promise = runWithLoader((signal) => {
            seen.signal = signal;
            return new Promise<never>((_resolve, reject) => {
                signal.addEventListener("abort", () => {
                    reject(new DOMException("cancelled", "AbortError"));
                });
            });
        }, 5000);
        await vi.waitFor(() => {
            expect(seen.signal).not.toBeNull();
        });
        cancel();

        await expect(promise).rejects.toMatchObject({ name: "AbortError" });
        expect(visible.value).toBe(false);
        expect(seen.signal?.aborted).toBe(true);
        expect(performance.now() - startTime).toBeLessThan(1000);
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
