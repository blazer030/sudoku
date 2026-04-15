import { afterEach, describe, expect, it, vi } from "vitest";
import { useCompletionFlash } from "@/presentation/pages/game/useCompletionFlash";

afterEach(() => {
    vi.useRealTimers();
});

describe("useCompletionFlash", () => {
    it("should mark origin cell as flashing immediately", () => {
        vi.useFakeTimers();
        const { triggerFlash, isFlashing } = useCompletionFlash();

        triggerFlash(
            [{ row: 0, column: 0 }, { row: 0, column: 1 }],
            { row: 0, column: 0 },
        );

        vi.advanceTimersByTime(0);
        expect(isFlashing(0, 0)).toBe(true);
        expect(isFlashing(0, 1)).toBe(false);
    });

    it("should ripple flash outward from origin with delay", () => {
        vi.useFakeTimers();
        const { triggerFlash, isFlashing } = useCompletionFlash();

        triggerFlash(
            [{ row: 0, column: 0 }, { row: 0, column: 1 }, { row: 0, column: 2 }],
            { row: 0, column: 0 },
        );

        // distance 0: immediate
        vi.advanceTimersByTime(0);
        expect(isFlashing(0, 0)).toBe(true);
        // distance 1: after 60ms
        vi.advanceTimersByTime(60);
        expect(isFlashing(0, 1)).toBe(true);
        // distance 2: after another 60ms
        vi.advanceTimersByTime(60);
        expect(isFlashing(0, 2)).toBe(true);
    });

    it("should clear flashing cells after duration", () => {
        vi.useFakeTimers();
        const { triggerFlash, isFlashing } = useCompletionFlash();

        triggerFlash(
            [{ row: 0, column: 0 }],
            { row: 0, column: 0 },
        );
        vi.advanceTimersByTime(0);
        expect(isFlashing(0, 0)).toBe(true);

        vi.advanceTimersByTime(500);
        expect(isFlashing(0, 0)).toBe(false);
    });

    it("should flash symmetrically from middle origin", () => {
        vi.useFakeTimers();
        const { triggerFlash, isFlashing } = useCompletionFlash();

        triggerFlash(
            [{ row: 0, column: 3 }, { row: 0, column: 4 }, { row: 0, column: 5 }],
            { row: 0, column: 4 },
        );

        // distance 0: origin flashes immediately
        vi.advanceTimersByTime(0);
        expect(isFlashing(0, 4)).toBe(true);
        expect(isFlashing(0, 3)).toBe(false);
        expect(isFlashing(0, 5)).toBe(false);

        // distance 1: both neighbors flash together
        vi.advanceTimersByTime(60);
        expect(isFlashing(0, 3)).toBe(true);
        expect(isFlashing(0, 5)).toBe(true);
    });

    it("should not flash when given empty cells array", () => {
        const { triggerFlash, isFlashing } = useCompletionFlash();

        triggerFlash([], { row: 0, column: 0 });

        expect(isFlashing(0, 0)).toBe(false);
    });

    it("should call onComplete after last cell flash finishes", () => {
        vi.useFakeTimers();
        const { triggerFlash } = useCompletionFlash();
        const onComplete = vi.fn();

        triggerFlash(
            [{ row: 0, column: 0 }, { row: 0, column: 1 }, { row: 0, column: 2 }],
            { row: 0, column: 0 },
            onComplete,
        );

        // max distance = 2, delay = 2 * 60 = 120, total = 120 + 500 = 620
        vi.advanceTimersByTime(619);
        expect(onComplete).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onComplete).toHaveBeenCalledOnce();
    });

    it("should call onComplete immediately when cells array is empty", () => {
        const { triggerFlash } = useCompletionFlash();
        const onComplete = vi.fn();

        triggerFlash([], { row: 0, column: 0 }, onComplete);

        expect(onComplete).toHaveBeenCalledOnce();
    });

    it("should call onComplete immediately when disabled", () => {
        const { triggerFlash } = useCompletionFlash(() => false);
        const onComplete = vi.fn();

        triggerFlash(
            [{ row: 0, column: 0 }],
            { row: 0, column: 0 },
            onComplete,
        );

        expect(onComplete).toHaveBeenCalledOnce();
    });
});
