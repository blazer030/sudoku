import type { Directive } from "vue";
import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";

/** scale: shrink while held; bounce: scale plus a small bounce on release; tint: colour only. */
export type PressFeedback = "scale" | "bounce" | "tint";

const PRESSED_CLASS = "is-pressed";
const MOTION_CLASS = "press-motion";
const BOUNCE_RELEASE_CLASS = "press-bounce-release";

interface PressBinding {
    onPointerdown: (event: PointerEvent) => void;
    stopWaitingForRelease: () => void;
}

const bindings = new WeakMap<HTMLElement, PressBinding>();

const isDisabled = (element: HTMLElement): boolean =>
    element.matches(":disabled") || element.getAttribute("aria-disabled") === "true";

/**
 * Press feedback for the minimal style: classes go on at pointerdown and come off on
 * release or cancel anywhere. It only adds classes, so input never waits for it.
 */
export const vPress: Directive<HTMLElement, undefined, string, PressFeedback> = {
    mounted(element, binding) {
        const feedback: PressFeedback = binding.arg ?? "scale";
        let withMotion = false;

        const clearBounce = () => {
            element.classList.remove(BOUNCE_RELEASE_CLASS);
        };

        const release = () => {
            stopWaitingForRelease();
            element.classList.remove(PRESSED_CLASS);
            if (feedback === "bounce" && withMotion) {
                element.classList.add(BOUNCE_RELEASE_CLASS);
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
            element.classList.toggle(MOTION_CLASS, withMotion);
            element.classList.add(PRESSED_CLASS);
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
