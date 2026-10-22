import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

// The app root pads its content clear of the gesture or navigation bar (see .app-safe-area)
const bottomSafeAreaInset = (element: HTMLElement): number => {
    const appRoot = element.closest(".app-safe-area");
    if (appRoot === null) return 0;
    return Number.parseFloat(getComputedStyle(appRoot).paddingBottom) || 0;
};

/**
 * Tracks the height from the top of `element` down to the bottom of the viewport, less the
 * bottom safe-area inset and `bottomGap`, never below zero, so a panel opened there stays on screen.
 */
export const useRoomBelow = (element: Ref<HTMLElement | null>, bottomGap: number) => {
    const room = ref<number | null>(null);

    const measure = () => {
        if (element.value === null) return;
        const bottom = window.innerHeight - bottomSafeAreaInset(element.value);
        room.value = Math.max(0, bottom - element.value.getBoundingClientRect().top - bottomGap);
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
