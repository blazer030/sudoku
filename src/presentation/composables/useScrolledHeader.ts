import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

const SCROLLING_OVERFLOW = /auto|scroll|overlay/;

const scrollerOf = (element: HTMLElement): HTMLElement | null => {
    let ancestor = element.parentElement;
    while (ancestor !== null) {
        if (SCROLLING_OVERFLOW.test(getComputedStyle(ancestor).overflowY)) return ancestor;
        ancestor = ancestor.parentElement;
    }
    return null;
};

/** Scroll distance, in px, over which a header's frost fades in: about one and a half header heights, so it comes in gently. */
export const HEADER_FADE_DISTANCE = 96;

/**
 * Whether the scroll container a sticky header sits in has scrolled away from its top. Skins read it
 * through the header's `data-scrolled`, to paint the header only once content can run under it. It also
 * writes `--header-scroll` (0 at the top, 1 from HEADER_FADE_DISTANCE on) on the header so a skin can fade
 * the frost in with the scroll instead of switching it on.
 */
export const useScrolledHeader = (header: Ref<HTMLElement | null>) => {
    const scrolled = ref(false);
    let scroller: HTMLElement | null = null;

    let frame: number | null = null;

    const update = () => {
        frame = null;
        const top = scroller === null ? 0 : scroller.scrollTop;
        scrolled.value = top > 0;
        const progress = Math.min(Math.max(top / HEADER_FADE_DISTANCE, 0), 1);
        header.value?.style.setProperty("--header-scroll", String(progress));
    };

    const scheduleUpdate = () => {
        frame ??= requestAnimationFrame(update);
    };

    onMounted(() => {
        if (header.value === null) return;
        scroller = scrollerOf(header.value);
        scroller?.addEventListener("scroll", scheduleUpdate, { passive: true });
        update();
    });

    onBeforeUnmount(() => {
        scroller?.removeEventListener("scroll", scheduleUpdate);
        if (frame !== null) cancelAnimationFrame(frame);
    });

    return scrolled;
};
