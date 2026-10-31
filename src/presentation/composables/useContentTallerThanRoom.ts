import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";

const verticalPadding = (element: HTMLElement): number => {
    const style = getComputedStyle(element);
    return (Number.parseFloat(style.paddingTop) || 0) + (Number.parseFloat(style.paddingBottom) || 0);
};

/**
 * Tracks whether what `content` holds, inside its own padding, is taller than the room inside
 * `container` (its height less its padding), following window resizes and the content's own size.
 * A content that only loses some of its padding still shows all it holds, so it counts as fitting.
 */
export const useContentTallerThanRoom = (container: Ref<HTMLElement | null>, content: Ref<HTMLElement | null>) => {
    const contentTallerThanRoom = ref(false);

    const measure = () => {
        if (container.value === null || content.value === null) {
            contentTallerThanRoom.value = false;
            return;
        }
        const room = container.value.clientHeight - verticalPadding(container.value);
        // offsetHeight leaves out the margin a caller sets by this answer, so setting it never flips the answer
        contentTallerThanRoom.value = content.value.offsetHeight - verticalPadding(content.value) > room;
    };

    // Web fonts or a style's decoration can change the content's height after it appears
    const contentObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    watch(content, (element, previous) => {
        if (previous) contentObserver?.unobserve(previous);
        if (element) contentObserver?.observe(element);
        measure();
    }, { flush: "post" });

    onMounted(() => {
        measure();
        window.addEventListener("resize", measure);
    });

    onBeforeUnmount(() => {
        window.removeEventListener("resize", measure);
        contentObserver?.disconnect();
    });

    return { contentTallerThanRoom };
};
