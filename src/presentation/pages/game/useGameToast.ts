import { onScopeDispose, ref } from "vue";
import type { RevealOutcome } from "@/domain/game/RevealOutcome";

export interface RandomRevealToast {
    kind: "randomReveal";
    outcome: RevealOutcome;
}

export interface NoConflictsToast {
    kind: "noConflicts";
}

/** One-off messages on the game screen; only one shows at a time. */
export type ToastContent = RandomRevealToast | NoConflictsToast;

const TOAST_DURATION_MS: Record<ToastContent["kind"], number> = {
    randomReveal: 3000,
    noConflicts: 3000,
};

export const useGameToast = () => {
    const content = ref<ToastContent | null>(null);
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const show = (newContent: ToastContent) => {
        if (timeoutHandle !== null) clearTimeout(timeoutHandle);
        content.value = newContent;
        timeoutHandle = setTimeout(() => {
            content.value = null;
            timeoutHandle = null;
        }, TOAST_DURATION_MS[newContent.kind]);
    };

    const hide = () => {
        if (timeoutHandle !== null) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
        }
        content.value = null;
    };

    onScopeDispose(hide);

    return { content, show, hide };
};
