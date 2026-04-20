import { ref } from "vue";
import type { RevealOutcome } from "@/domain/game/RevealOutcome";

const HINT_RESULT_DURATION_MS = 3000;

export const useHintResult = () => {
    const outcome = ref<RevealOutcome | null>(null);
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const show = (newOutcome: RevealOutcome) => {
        if (timeoutHandle !== null) clearTimeout(timeoutHandle);
        outcome.value = newOutcome;
        timeoutHandle = setTimeout(() => {
            outcome.value = null;
            timeoutHandle = null;
        }, HINT_RESULT_DURATION_MS);
    };

    const hide = () => {
        if (timeoutHandle !== null) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
        }
        outcome.value = null;
    };

    return { outcome, show, hide };
};
