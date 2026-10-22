import type { Directive } from "vue";
import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";

/** scale: shrink while held; bounce: scale plus a small bounce on release; tint: colour only. */
export type PressFeedback = "scale" | "bounce" | "tint";

// Data attributes rather than classes: Vue rewrites the class attribute whenever a
// bound :class changes, which would drop the press state mid-press or mid-bounce.
const PRESSED_ATTRIBUTE = "data-pressed";
const MOTION_ATTRIBUTE = "data-press-motion";
const BOUNCE_ATTRIBUTE = "data-press-bounce";

interface PressBinding {
    onPointerdown: (event: PointerEvent) => void;
    stopWaitingForRelease: () => void;
}

const bindings = new WeakMap<HTMLElement, PressBinding>();

const isDisabled = (element: HTMLElement): boolean =>
    element.matches(":disabled") || element.getAttribute("aria-disabled") === "true";

/**
 * Press feedback for the minimal style: state goes on at pointerdown and comes off on
 * release or cancel anywhere. It only sets attributes, so input never waits for it.
 */
export const vPress: Directive<HTMLElement, undefined, string, PressFeedback> = {
    mounted(element, binding) {
        const feedback: PressFeedback = binding.arg ?? "scale";
        let withMotion = false;

        const clearBounce = () => {
            element.removeAttribute(BOUNCE_ATTRIBUTE);
        };

        const release = () => {
            stopWaitingForRelease();
            element.removeAttribute(PRESSED_ATTRIBUTE);
            if (feedback === "bounce" && withMotion) {
                element.setAttribute(BOUNCE_ATTRIBUTE, "");
                element.addEventListener("animationend", clearBounce, { once: true });
            }
        };

        const stopWaitingForRelease = () => {
            window.removeEventListener("pointerup", release);
            window.removeEventListener("pointercancel", release);
        };

        const onPointerdown = (event: PointerEvent) => {
            // Secondary mouse buttons do not press; synthetic events without a button do
            if (event.button > 0 || isDisabled(element)) return;
            stopWaitingForRelease();
            clearBounce();
            withMotion = feedback !== "tint" && !prefersReducedMotion();
            element.toggleAttribute(MOTION_ATTRIBUTE, withMotion);
            element.setAttribute(PRESSED_ATTRIBUTE, "");
            window.addEventListener("pointerup", release);
            window.addEventListener("pointercancel", release);
        };

        element.addEventListener("pointerdown", onPointerdown);
        bindings.set(element, { onPointerdown, stopWaitingForRelease });
    },
    beforeUnmount(element) {
        const pressBinding = bindings.get(element);
        if (pressBinding === undefined) return;
        element.removeEventListener("pointerdown", pressBinding.onPointerdown);
        pressBinding.stopWaitingForRelease();
        bindings.delete(element);
    },
};
