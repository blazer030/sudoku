<template>
    <!-- Chalk's pen: the stroke writer over chalk's strokes and Caveat Brush's metrics. skin.css runs the strokes. -->
    <StrokeDigitWriter
        :digit="digit"
        :mask-id="maskId"
        :face="CHALKBOARD_STROKE_FACE"
        stroke-class="chalkboard-digit-stroke"
        settle-class="chalkboard-digit-settle"
        @written="writtenWhole"
    />
    <!-- A little chalk dust drops as each stroke ends. It lies on the digit's em square, which sits on the cell's
         centre as the digit does (the digit's size is BoardCell's entry size), in the board's units. skin.css
         shows it in 黑板 only. -->
    <svg
        ref="dustLayer"
        class="chalkboard-digit-dust-layer pointer-events-none absolute left-1/2 top-1/2 size-[1em] -translate-x-1/2 -translate-y-1/2 overflow-visible text-[length:calc(22px*var(--entry-scale,1))]"
        :viewBox="dustViewBox"
        aria-hidden="true"
    >
        <circle
            v-for="(speck, index) in specks"
            :key="index"
            class="chalkboard-digit-dust"
            :cx="speck.x"
            :cy="speck.y"
            :r="speck.radius"
            :style="{ animationDelay: `${speck.delayMs}ms` }"
            @animationend="index === specks.length - 1 && dustFallen()"
        />
    </svg>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from "vue";
import StrokeDigitWriter from "@/presentation/components/style-moments/StrokeDigitWriter.vue";
import { CHALKBOARD_DIGIT_DUST, CHALKBOARD_STROKE_FACE, DUST_SPECKS } from "@/presentation/components/style-moments/chalkboard/chalkboardDigitStrokes";

const props = defineProps<{
    digit: number;
    maskId: string;
}>();

const emit = defineEmits<{
    written: [];
}>();

const { size, centreX, baselineY } = CHALKBOARD_STROKE_FACE.glyph;
const dustViewBox = `${centreX - size / 2} ${baselineY - CHALKBOARD_STROKE_FACE.baselineEm * size} ${size} ${size}`;

const specks = computed(() => (CHALKBOARD_DIGIT_DUST[props.digit] ?? []).flatMap(fall =>
    DUST_SPECKS.map(speck => ({ x: fall.x + speck.dx, y: fall.y + speck.dy, radius: speck.radius, delayMs: fall.delayMs }))));

// The digit is written once the mask has settled and the dust has fallen: 黑板's last dust falls past the
// last stroke, and the writer leaves as soon as it says so. Where no dust falls (白板, reduced motion, a
// digit without strokes) the settle alone ends it.
const dustLayer = useTemplateRef<SVGSVGElement>("dustLayer");
let settled = false;
let fallen = false;
let told = false;

const tellWhenDone = () => {
    if (told || !settled || !fallen) return;
    told = true;
    emit("written");
};

const isFalling = (speck: Element | null | undefined): boolean => {
    if (!speck) return false;
    const name = getComputedStyle(speck).animationName;
    return name !== "" && name !== "none";
};

const writtenWhole = () => {
    settled = true;
    if (!isFalling(dustLayer.value?.lastElementChild)) fallen = true;
    tellWhenDone();
};

const dustFallen = () => {
    fallen = true;
    tellWhenDone();
};
</script>
