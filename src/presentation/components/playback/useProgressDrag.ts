import { onUnmounted, ref, type Ref } from "vue";

export const useProgressDrag = (
    progressRef: Ref<HTMLElement | null>,
    totalSteps: Ref<number>,
    onSeek: (step: number) => void,
    playState: { isPlaying: Ref<boolean>; stopPlay: () => void; startPlay: () => void },
) => {
    const isDragging = ref(false);
    let wasPlaying = false;

    const calcStep = (clientX: number): number => {
        const el = progressRef.value;
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return Math.round(ratio * totalSteps.value);
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
        isDragging.value = true;
        wasPlaying = playState.isPlaying.value;
        if (wasPlaying) playState.stopPlay();
        const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
        onSeek(calcStep(clientX));
        window.addEventListener("mousemove", onPointerMove);
        window.addEventListener("mouseup", onPointerUp);
        window.addEventListener("touchmove", onPointerMove);
        window.addEventListener("touchend", onPointerUp);
    };

    const onPointerMove = (event: MouseEvent | TouchEvent) => {
        if (!isDragging.value) return;
        const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
        onSeek(calcStep(clientX));
    };

    const onPointerUp = () => {
        isDragging.value = false;
        if (wasPlaying) playState.startPlay();
        wasPlaying = false;
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("mouseup", onPointerUp);
        window.removeEventListener("touchmove", onPointerMove);
        window.removeEventListener("touchend", onPointerUp);
    };

    onUnmounted(onPointerUp);

    return { isDragging, onPointerDown };
};
