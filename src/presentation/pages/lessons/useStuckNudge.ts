import { computed, onScopeDispose, ref, watch, type ComputedRef } from "vue";
import type { useLessonSession } from "@/presentation/pages/lessons/useLessonSession";

/** Wrong answers in a row, and time without an action, before the hint is pointed out: the owner's starting values. */
export const STUCK_MISSES = 3;
export const STUCK_IDLE_MS = 30_000;

/**
 * Whether to point a stuck player to the hint: on a practice step with a hint left, after a few wrong answers in a row
 * or a while without an action. Any action, a hint or another step starts the count again.
 */
export const useStuckNudge = (session: ReturnType<typeof useLessonSession>): ComputedRef<boolean> => {
    const idle = ref(false);
    let timer: ReturnType<typeof setTimeout> | null = null;

    const stopTimer = () => {
        if (timer !== null) clearTimeout(timer);
        timer = null;
    };

    watch([session.stepIndex, session.actions], () => {
        stopTimer();
        idle.value = false;
        if (session.hintsLeft.value) timer = setTimeout(() => { idle.value = true; }, STUCK_IDLE_MS);
    }, { immediate: true });

    onScopeDispose(stopTimer);

    return computed(() => session.hintsLeft.value && (idle.value || session.practice.value.missesInARow >= STUCK_MISSES));
};
