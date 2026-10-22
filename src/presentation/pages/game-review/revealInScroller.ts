import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";

// Room left between a revealed element and the edge it was hidden past
const REVEAL_MARGIN = 8;

/**
 * Scrolls `scroller` by the least amount that shows all of `target` between `coveredTop` (the bottom
 * of a sticky header over the scroller) and the scroller's bottom edge. Leaves it alone when the
 * target is already fully in view.
 */
export const revealInScroller = (scroller: HTMLElement, target: HTMLElement, coveredTop: number): void => {
    const view = scroller.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    const visibleTop = Math.max(view.top, coveredTop);
    let offset = 0;
    if (box.top < visibleTop) offset = box.top - visibleTop - REVEAL_MARGIN;
    else if (box.bottom > view.bottom) offset = box.bottom - view.bottom + REVEAL_MARGIN;
    if (offset === 0) return;
    scroller.scrollBy({ top: offset, behavior: prefersReducedMotion() ? "instant" : "smooth" });
};
