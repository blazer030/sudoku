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
import type { CelebrationPhase, GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { useMotionAllowed } from "@/presentation/composables/useMotionAllowed";
import { browserFrameClock, createInkPlayer, type InkPlayer } from "@/presentation/components/style-moments/ink/canvas/inkPlayer";
import { INK_CELEBRATION_WASH, inkGroupMarks, type InkEffect } from "@/presentation/components/style-moments/ink/canvas/inkTimeline";
import { DEFAULT_SEAL_COLOUR, canvasPixelSize, gridPlacement, inkCanvasForcedOff, parseInkColour } from "@/presentation/components/style-moments/ink/canvas/inkSurface";
import type { InkRenderer } from "@/presentation/components/style-moments/ink/canvas/inkRenderer";

const props = defineProps<{
    celebration: CelebrationPhase | null;
    /** The game's running group effect, whose groups the canvas brushes. */
    effect: GroupEffect | null;
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

// Sizes the drawing buffer to the canvas, and places the grid's cells on it for the fills and the marks
const fit = (canvas: HTMLCanvasElement, drawingRenderer: InkRenderer) => {
    const { width, height } = canvasPixelSize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio);
    if (canvas.width !== width || canvas.height !== height) drawingRenderer.resize(width, height);
    const grid = canvas.parentElement?.querySelector<HTMLElement>("[data-skin~='board-grid']");
    const gridBox = grid?.getBoundingClientRect();
    const cells = grid === null || grid === undefined || gridBox === undefined
        ? { left: 0, top: 0, width: 0, height: 0 }
        : { left: gridBox.left + grid.clientLeft, top: gridBox.top + grid.clientTop, width: grid.clientWidth, height: grid.clientHeight };
    drawingRenderer.placeGrid(gridPlacement(canvas.getBoundingClientRect(), cells));
};

// Plays effects from now, on a canvas fitted to the board as it now lies
const play = (effects: readonly InkEffect[]): boolean => {
    const canvas = canvasElement.value;
    if (renderer === null || player === null || canvas === null) return false;
    fit(canvas, renderer);
    player.play(effects);
    return true;
};

// Each new group effect brushes its groups; one ending starts nothing, as the marks fade on their own clock
watch(() => props.effect, (effect) => {
    if (effect !== null) play(inkGroupMarks(effect.groups));
});

// Taken only as the celebration starts, so one already playing when the canvas became ready stays the skin's
watch(() => props.celebration, (phase) => {
    if (phase === "playing" && play(INK_CELEBRATION_WASH)) {
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
