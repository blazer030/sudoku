import { onScopeDispose, ref, watch, type Ref } from "vue";
import { useMotionAllowed } from "@/presentation/composables/useMotionAllowed";

/**
 * How long a digit stays flagged as arriving or leaving when no animation ends first. Styles without
 * such an animation (minimal, paper; every style but 8-bit for leaving) never fire animationend;
 * every style's animation is shorter.
 */
export const ARRIVAL_SETTLE_MS = 1000;

/**
 * Flags a digit placed after mount, or replaced by a different one, so a style can drop it in, and a
 * digit cleared (an erase, an undo, a review or walkthrough step back) so a style can send it off.
 * Digits already there on mount (a resumed game) never arrive, a hint reveal keeps its own pop, and
 * reduced motion turns both off. When a cell changes again while it still arrives, the flag drops for
 * two frames and returns, so a style sheet replays its animation. It only toggles classes, so input
 * never waits for it.
 */
export const useArrivalMotion = (
    value: Ref<number>,
    popping: Ref<boolean>,
): { arriving: Ref<boolean>; leaving: Ref<boolean>; settle: () => void } => {
    const motionAllowed = useMotionAllowed();
    const arriving = ref(false);
    const leaving = ref(false);
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let restartFrame: number | undefined;

    const stopSettleTimer = () => {
        if (settleTimer !== undefined) clearTimeout(settleTimer);
        settleTimer = undefined;
    };

    const stopRestart = () => {
        if (restartFrame !== undefined) cancelAnimationFrame(restartFrame);
        restartFrame = undefined;
    };

    const settle = () => {
        stopSettleTimer();
        stopRestart();
        arriving.value = false;
        leaving.value = false;
    };

    const startSettleTimer = () => {
        settleTimer = setTimeout(settle, ARRIVAL_SETTLE_MS);
    };

    // The browser must render a frame without the flag, or the class never looks removed
    const arriveAfterTwoFrames = () => {
        restartFrame = requestAnimationFrame(() => {
            restartFrame = requestAnimationFrame(() => {
                restartFrame = undefined;
                arriving.value = true;
                startSettleTimer();
            });
        });
    };

    watch(value, (current, previous) => {
        stopSettleTimer();
        stopRestart();
        const moving = !popping.value && motionAllowed();
        const wasArriving = arriving.value;
        const arrives = moving && current !== 0 && current !== previous;
        leaving.value = moving && previous !== 0 && current === 0;
        arriving.value = arrives && !wasArriving;
        if (arrives && wasArriving) arriveAfterTwoFrames();
        else if (arriving.value || leaving.value) startSettleTimer();
    });

    onScopeDispose(() => {
        stopSettleTimer();
        stopRestart();
    });

    return { arriving, leaving, settle };
};
