import { effectScope } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLongPress } from "@/presentation/composables/useLongPress";

const pointerAt = (clientX: number, clientY: number, extra: Partial<PointerEvent> = {}) =>
    ({ clientX, clientY, isPrimary: true, pointerType: "touch", button: 0, ...extra }) as PointerEvent;

describe("useLongPress", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("fires after 400 ms of holding", () => {
        const onLongPress = vi.fn();
        const { onPointerdown } = useLongPress({ onLongPress });

        onPointerdown(pointerAt(10, 10));
        vi.advanceTimersByTime(399);
        expect(onLongPress).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);

        expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it("does not fire when released early", () => {
        const onLongPress = vi.fn();
        const { onPointerdown, onPointerup } = useLongPress({ onLongPress });

        onPointerdown(pointerAt(10, 10));
        vi.advanceTimersByTime(200);
        onPointerup();
        vi.advanceTimersByTime(1000);

        expect(onLongPress).not.toHaveBeenCalled();
    });

    it("does not fire after a large move", () => {
        const onLongPress = vi.fn();
        const { onPointerdown, onPointermove } = useLongPress({ onLongPress });

        onPointerdown(pointerAt(10, 10));
        onPointermove(pointerAt(10, 30));
        vi.advanceTimersByTime(1000);

        expect(onLongPress).not.toHaveBeenCalled();
    });

    it("still fires after a tiny move", () => {
        const onLongPress = vi.fn();
        const { onPointerdown, onPointermove } = useLongPress({ onLongPress });

        onPointerdown(pointerAt(10, 10));
        onPointermove(pointerAt(12, 11));
        vi.advanceTimersByTime(400);

        expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it("does not fire when the pointer is cancelled or leaves", () => {
        const onLongPress = vi.fn();
        const { onPointerdown, onPointercancel, onPointerleave } = useLongPress({ onLongPress });

        onPointerdown(pointerAt(10, 10));
        onPointercancel();
        vi.advanceTimersByTime(1000);
        onPointerdown(pointerAt(10, 10));
        onPointerleave();
        vi.advanceTimersByTime(1000);

        expect(onLongPress).not.toHaveBeenCalled();
    });

    it("suppresses exactly the click that follows a long press", () => {
        const { onPointerdown, onPointerup, consumeClickSuppression } = useLongPress({ onLongPress: vi.fn() });

        onPointerdown(pointerAt(10, 10));
        vi.advanceTimersByTime(400);
        onPointerup();

        expect(consumeClickSuppression()).toBe(true);
        expect(consumeClickSuppression()).toBe(false);
    });

    it("does not suppress the click of a normal tap", () => {
        const { onPointerdown, onPointerup, consumeClickSuppression } = useLongPress({ onLongPress: vi.fn() });

        onPointerdown(pointerAt(10, 10));
        onPointerup();

        expect(consumeClickSuppression()).toBe(false);
    });

    it("vibrates briefly when the long press triggers", () => {
        const vibrate = vi.fn();
        vi.stubGlobal("navigator", { vibrate });
        const { onPointerdown } = useLongPress({ onLongPress: vi.fn() });

        onPointerdown(pointerAt(10, 10));
        vi.advanceTimersByTime(400);

        expect(vibrate).toHaveBeenCalledWith(15);
        vi.unstubAllGlobals();
    });

    it("ignores non-primary pointers", () => {
        const onLongPress = vi.fn();
        const { onPointerdown } = useLongPress({ onLongPress });

        onPointerdown(pointerAt(10, 10, { isPrimary: false }));
        vi.advanceTimersByTime(1000);

        expect(onLongPress).not.toHaveBeenCalled();
    });

    it("ignores non-left mouse buttons", () => {
        const onLongPress = vi.fn();
        const { onPointerdown } = useLongPress({ onLongPress });

        onPointerdown(pointerAt(10, 10, { pointerType: "mouse", button: 2 }));
        vi.advanceTimersByTime(1000);

        expect(onLongPress).not.toHaveBeenCalled();
    });

    it("fires for the left mouse button", () => {
        const onLongPress = vi.fn();
        const { onPointerdown } = useLongPress({ onLongPress });

        onPointerdown(pointerAt(10, 10, { pointerType: "mouse", button: 0 }));
        vi.advanceTimersByTime(400);

        expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it("does not fire after its scope is disposed", () => {
        const onLongPress = vi.fn();
        const scope = effectScope();
        const handlers = scope.run(() => useLongPress({ onLongPress }));

        handlers?.onPointerdown(pointerAt(10, 10));
        scope.stop();
        vi.advanceTimersByTime(1000);

        expect(onLongPress).not.toHaveBeenCalled();
    });

    it("does not suppress a fresh tap when the click after a long press never came", () => {
        const { onPointerdown, onPointerup, consumeClickSuppression } = useLongPress({ onLongPress: vi.fn() });

        onPointerdown(pointerAt(10, 10));
        vi.advanceTimersByTime(400);
        onPointerup();
        onPointerdown(pointerAt(10, 10));
        onPointerup();

        expect(consumeClickSuppression()).toBe(false);
    });
});
