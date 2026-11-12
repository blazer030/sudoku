import { onUnmounted, ref, type Ref } from "vue";
import type { PlayState } from "@/presentation/components/playback/usePlaybackState";

export const useProgressDrag = (
    progressRef: Ref<HTMLElement | null>,
    totalSteps: Ref<number>,
    onSeek: (step: number) => void,
    playState: PlayState,
) => {
    const isDragging = ref(false);
    let wasPlaying = false;

    const stepAt = (clientX: number): number => {
        const bar = progressRef.value;
        if (!bar) return 0;
        const bounds = bar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
        return Math.round(ratio * totalSteps.value);
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
        // A second finger joins the drag under way, which has already paused playback
        if (!isDragging.value) {
            isDragging.value = true;
            wasPlaying = playState.isPlaying.value;
            if (wasPlaying) playState.stopPlay();
            window.addEventListener("mousemove", onPointerMove);
            window.addEventListener("mouseup", onPointerUp);
            window.addEventListener("touchmove", onPointerMove);
            window.addEventListener("touchend", onPointerUp);
        }
        const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
        onSeek(stepAt(clientX));
    };

    const onPointerMove = (event: MouseEvent | TouchEvent) => {
        if (!isDragging.value) return;
        const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
        onSeek(stepAt(clientX));
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
