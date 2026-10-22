import { onScopeDispose, ref, watch, type Ref } from "vue";
import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";

/**
 * How long a digit stays flagged as arriving when no animation ends first. Styles without an
 * arrival animation (minimal, paper) never fire animationend; every style's animation is shorter.
 */
export const ARRIVAL_SETTLE_MS = 1000;

/**
 * Flags a digit placed after mount so a style can drop it in. Digits already there on mount
 * (a resumed game) never animate, a hint reveal keeps its own pop, and reduced motion turns it off.
 * It only toggles a class, so input never waits for it.
 */
export const useArrivalMotion = (value: Ref<number>, popping: Ref<boolean>): { arriving: Ref<boolean>; settle: () => void } => {
    const arriving = ref(false);
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const stopSettleTimer = () => {
        if (settleTimer !== undefined) clearTimeout(settleTimer);
        settleTimer = undefined;
    };

    const settle = () => {
        stopSettleTimer();
        arriving.value = false;
    };

    watch(value, (current, previous) => {
        stopSettleTimer();
        arriving.value = previous === 0 && current !== 0 && !popping.value && !prefersReducedMotion();
        if (arriving.value) settleTimer = setTimeout(settle, ARRIVAL_SETTLE_MS);
    });

    onScopeDispose(stopSettleTimer);

    return { arriving, settle };
};
