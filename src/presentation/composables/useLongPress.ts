import { onScopeDispose } from "vue";

const DEFAULT_DELAY_MILLISECONDS = 400;
const DEFAULT_MOVE_TOLERANCE_PIXELS = 8;
const HAPTIC_TICK_MILLISECONDS = 15;

interface LongPressOptions {
    onLongPress: () => void;
    delay?: number;
    moveTolerance?: number;
}

export const useLongPress = ({
    onLongPress,
    delay = DEFAULT_DELAY_MILLISECONDS,
    moveTolerance = DEFAULT_MOVE_TOLERANCE_PIXELS,
}: LongPressOptions) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;
    let suppressNextClick = false;

    const cancel = () => {
        if (timer === null) return;
        clearTimeout(timer);
        timer = null;
    };

    onScopeDispose(cancel);

    const onPointerdown = (event: PointerEvent) => {
        if (!event.isPrimary) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        cancel();
        suppressNextClick = false;
        startX = event.clientX;
        startY = event.clientY;
        timer = setTimeout(() => {
            timer = null;
            suppressNextClick = true;
            // Not every browser exposes the Vibration API.
            if ("vibrate" in navigator) navigator.vibrate(HAPTIC_TICK_MILLISECONDS);
            onLongPress();
        }, delay);
    };

    const onPointermove = (event: PointerEvent) => {
        if (timer === null) return;
        if (Math.hypot(event.clientX - startX, event.clientY - startY) > moveTolerance) cancel();
    };

    // Returns true once after a long press so the click that follows it can be ignored.
    const consumeClickSuppression = (): boolean => {
        const suppressed = suppressNextClick;
        suppressNextClick = false;
        return suppressed;
    };

    return {
        onPointerdown,
        onPointermove,
        onPointerup: cancel,
        onPointercancel: cancel,
        onPointerleave: cancel,
        consumeClickSuppression,
    };
};
