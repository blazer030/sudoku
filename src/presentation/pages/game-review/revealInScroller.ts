import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";

// How far a target must stay clear of the visible edges: a board cell's 3px border and 8px
// padding, plus a pixel, so a bottom-row cell shows with the board's frame below it
const EDGE_CLEARANCE = 12;

/**
 * Scrolls `scroller` by the least amount that shows all of `target`, clear of the edges, between
 * `coveredTop` (the bottom of a sticky header over the scroller) and the scroller's bottom edge.
 * Leaves it alone when the target is already in view, or cannot fit.
 */
export const revealInScroller = (scroller: HTMLElement, target: HTMLElement, coveredTop: number): void => {
    const view = scroller.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    const visibleTop = Math.max(view.top, coveredTop) + EDGE_CLEARANCE;
    const visibleBottom = view.bottom - EDGE_CLEARANCE;
    // Too little room to show it whole (or no layout at all): leave the scroll to the player
    if (visibleBottom - visibleTop < box.bottom - box.top) return;
    let offset = 0;
    if (box.top < visibleTop) offset = box.top - visibleTop;
    else if (box.bottom > visibleBottom) offset = box.bottom - visibleBottom;
    if (offset === 0) return;
    scroller.scrollBy({ top: offset, behavior: prefersReducedMotion() ? "instant" : "smooth" });
};
