import { describe, expect, it } from "vitest";
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
});
