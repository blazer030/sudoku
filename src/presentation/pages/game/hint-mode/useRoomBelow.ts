import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

/**
 * Tracks the height from the top of `element` down to the bottom of the viewport, less `bottomGap`
 * and never below zero, so a panel opened there can be kept on screen.
 */
export const useRoomBelow = (element: Ref<HTMLElement | null>, bottomGap: number) => {
    const room = ref<number | null>(null);

    const measure = () => {
        if (element.value === null) return;
        room.value = Math.max(0, window.innerHeight - element.value.getBoundingClientRect().top - bottomGap);
    };

    onMounted(() => {
        measure();
        window.addEventListener("resize", measure);
    });

    onBeforeUnmount(() => {
        window.removeEventListener("resize", measure);
    });

    return { room, measure };
};
