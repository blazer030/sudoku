import { ref, watch, type Ref } from "vue";
import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";

/**
 * Flags a digit placed after mount so a style can drop it in. Digits already there on mount
 * (a resumed game) never animate, a hint reveal keeps its own pop, and reduced motion turns it off.
 * It only toggles a class, so input never waits for it.
 */
export const useArrivalMotion = (value: Ref<number>, popping: Ref<boolean>): { arriving: Ref<boolean>; settle: () => void } => {
    const arriving = ref(false);

    watch(value, (current, previous) => {
        arriving.value = previous === 0 && current !== 0 && !popping.value && !prefersReducedMotion();
    });

    const settle = () => {
        arriving.value = false;
    };

    return { arriving, settle };
};
