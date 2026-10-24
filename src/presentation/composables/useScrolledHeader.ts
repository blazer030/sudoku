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

/**
 * Whether the scroll container a sticky header sits in has scrolled away from its top. Skins read it
 * through the header's `data-scrolled`, to paint the header only once content can run under it.
 */
export const useScrolledHeader = (header: Ref<HTMLElement | null>) => {
    const scrolled = ref(false);
    let scroller: HTMLElement | null = null;

    const update = () => {
        scrolled.value = scroller !== null && scroller.scrollTop > 0;
    };

    onMounted(() => {
        if (header.value === null) return;
        scroller = scrollerOf(header.value);
        scroller?.addEventListener("scroll", update, { passive: true });
        update();
    });

    onBeforeUnmount(() => {
        scroller?.removeEventListener("scroll", update);
    });

    return scrolled;
};
