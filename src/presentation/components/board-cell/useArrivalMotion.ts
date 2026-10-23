import { onScopeDispose, ref, watch, type Ref } from "vue";
import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";

/**
 * How long a digit stays flagged as arriving or leaving when no animation ends first. Styles without
 * such an animation (minimal, paper; every style but 8-bit for leaving) never fire animationend;
 * every style's animation is shorter.
 */
export const ARRIVAL_SETTLE_MS = 1000;

/**
 * Flags a digit placed after mount so a style can drop it in, and a digit cleared (an erase, an undo,
 * a review or walkthrough step back) so a style can send it off. Digits already there on mount
 * (a resumed game) never arrive, a hint reveal keeps its own pop, and reduced motion turns both off.
 * It only toggles classes, so input never waits for it.
 */
export const useArrivalMotion = (
    value: Ref<number>,
    popping: Ref<boolean>,
): { arriving: Ref<boolean>; leaving: Ref<boolean>; settle: () => void } => {
    const arriving = ref(false);
    const leaving = ref(false);
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const stopSettleTimer = () => {
        if (settleTimer !== undefined) clearTimeout(settleTimer);
        settleTimer = undefined;
    };

    const settle = () => {
        stopSettleTimer();
        arriving.value = false;
        leaving.value = false;
    };

    watch(value, (current, previous) => {
        stopSettleTimer();
        const moving = !popping.value && !prefersReducedMotion();
        arriving.value = moving && previous === 0 && current !== 0;
        leaving.value = moving && previous !== 0 && current === 0;
        if (arriving.value || leaving.value) settleTimer = setTimeout(settle, ARRIVAL_SETTLE_MS);
    });

    onScopeDispose(stopSettleTimer);

    return { arriving, leaving, settle };
};
