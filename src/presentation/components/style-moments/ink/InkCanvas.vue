<template>
    <!-- The board's one ink canvas, under the digits: it plays the moments it takes from the skin by WebGL -->
    <canvas
        v-if="!unavailable"
        ref="canvas"
        aria-hidden="true"
        class="ink-canvas absolute inset-0 size-full pointer-events-none"
        data-testid="ink-canvas"
    />
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import type { CelebrationPhase } from "@/presentation/components/style-moments/styleMoments";
import { useMotionAllowed } from "@/presentation/composables/useMotionAllowed";
import { browserFrameClock, createInkPlayer, type InkPlayer } from "@/presentation/components/style-moments/ink/canvas/inkPlayer";
import { INK_CELEBRATION_WASH } from "@/presentation/components/style-moments/ink/canvas/inkTimeline";
import { DEFAULT_SEAL_COLOUR, canvasPixelSize, inkCanvasForcedOff, parseInkColour } from "@/presentation/components/style-moments/ink/canvas/inkSurface";
import type { InkRenderer } from "@/presentation/components/style-moments/ink/canvas/inkRenderer";

const props = defineProps<{
    celebration: CelebrationPhase | null;
}>();

/** The moments the canvas draws in the skin's place, for the board's `data-board-canvas`; none while it draws none. */
const takes = defineModel<string | undefined>("takes");

const motionAllowed = useMotionAllowed();
const canvasElement = useTemplateRef<HTMLCanvasElement>("canvas");
// No canvas at all without motion, or while the dev switch compares the skin's washes; WebGL is never loaded then
const unavailable = ref(!motionAllowed() || inkCanvasForcedOff(window.location.search, import.meta.env.DEV));

let renderer: InkRenderer | null = null;
let player: InkPlayer | null = null;
let unmounted = false;

// The digits' drops and the groups' marks are the canvas's while it can draw; the celebration only once it has
// started one
const drawing = ref(false);
const celebrating = ref(false);
watch([drawing, celebrating], () => {
    if (!drawing.value) {
        takes.value = undefined;
        return;
    }
    takes.value = celebrating.value ? "digit group celebration" : "digit group";
});

const release = () => {
    player?.stop();
    renderer?.dispose();
    player = null;
    renderer = null;
};

// The skin's washes come back for good: WebGL is missing or its context was taken away
const standDown = () => {
    release();
    unavailable.value = true;
    drawing.value = false;
    celebrating.value = false;
};

onMounted(async () => {
    if (unavailable.value) return;
    const { createInkRenderer } = await import("@/presentation/components/style-moments/ink/canvas/inkRenderer");
    const canvas = canvasElement.value;
    if (unmounted || canvas === null) return;
    const theme = getComputedStyle(canvas);
    const ink = parseInkColour(theme.getPropertyValue("--color-foreground"));
    const seal = parseInkColour(theme.getPropertyValue("--color-primary"), DEFAULT_SEAL_COLOUR);
    renderer = createInkRenderer(canvas, { ink, seal }, standDown);
    if (renderer === null) {
        standDown();
        return;
    }
    player = createInkPlayer(renderer, browserFrameClock);
    drawing.value = true;
});

// Taken only as the celebration starts, so one already playing when the canvas became ready stays the skin's
watch(() => props.celebration, (phase) => {
    const canvas = canvasElement.value;
    if (phase === "playing" && renderer !== null && player !== null && canvas !== null) {
        const { width, height } = canvasPixelSize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio);
        renderer.resize(width, height);
        player.play(INK_CELEBRATION_WASH);
        celebrating.value = true;
        return;
    }
    if (phase === null && celebrating.value) {
        player?.clear();
        celebrating.value = false;
    }
});

onBeforeUnmount(() => {
    unmounted = true;
    release();
    takes.value = undefined;
});
</script>
