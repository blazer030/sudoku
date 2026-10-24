<template>
    <!-- Paper's pen: the mask the arriving digit is shown through. Each stroke follows the digit's centre
         line in writing order, a later stroke drawing its own crossings, then the whole mask settles in so
         the last frame is the digit itself. skin.css runs the strokes; the timing is the digit's own. -->
    <svg
        class="absolute size-0 overflow-hidden"
        aria-hidden="true"
    >
        <defs>
            <template
                v-for="(stroke, index) in strokes"
                :key="`crossings-${index}`"
            >
                <clipPath
                    v-if="stroke.crossings"
                    :id="crossingsIdOf(index)"
                    clipPathUnits="userSpaceOnUse"
                >
                    <path
                        clip-rule="evenodd"
                        :d="`${EVERYWHERE} ${stroke.crossings}`"
                    />
                </clipPath>
            </template>
            <!-- Laid on the digit's box, reaching past it on every side: Caveat's ink overhangs its advance.
                 An alpha mask, so the pen's colour does not matter. -->
            <mask
                :id="maskId"
                style="mask-type: alpha"
                maskUnits="objectBoundingBox"
                maskContentUnits="objectBoundingBox"
                x="-1"
                y="-1"
                width="3"
                height="3"
            >
                <g
                    :transform="glyphTransform"
                    fill="none"
                    stroke="currentColor"
                    :stroke-width="PEN_WIDTH"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path
                        v-for="(stroke, index) in strokes"
                        :key="index"
                        class="paper-digit-stroke"
                        :d="stroke.path"
                        :clip-path="stroke.crossings ? `url(#${crossingsIdOf(index)})` : undefined"
                        :style="{
                            strokeDasharray: String(stroke.length),
                            strokeDashoffset: String(stroke.length),
                            animationDelay: `${stroke.delayMs}ms`,
                            animationDuration: `${stroke.durationMs}ms`,
                            animationTimingFunction: stroke.easing ?? PEN_EASING,
                        }"
                    />
                </g>
                <rect
                    class="paper-digit-settle"
                    x="-1"
                    y="-1"
                    width="3"
                    height="3"
                    fill="currentColor"
                    :style="{ animationDelay: `${settleDelayMs}ms` }"
                    @animationend="emit('written')"
                />
            </mask>
        </defs>
    </svg>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import {
    BOARD_GLYPH,
    CAVEAT_BASELINE_EM,
    CAVEAT_DIGIT_ADVANCES,
    PAPER_DIGIT_STROKES,
    PEN_EASING,
    PEN_WIDTH,
} from "@/presentation/components/style-moments/paper/paperDigitStrokes";

const props = defineProps<{
    digit: number;
    maskId: string;
}>();

const emit = defineEmits<{
    written: [];
}>();

// A clip region covering the whole drawing, so the crossings, drawn evenodd inside it, are cut out
const EVERYWHERE = "M-50 -50 H150 V150 H-50 Z";

// A digit with no strokes (none but 1–9 is ever entered) is only settled in, whole
const strokes = computed(() => PAPER_DIGIT_STROKES[props.digit]?.strokes ?? []);
const settleDelayMs = computed(() => PAPER_DIGIT_STROKES[props.digit]?.settleDelayMs ?? 0);

const crossingsIdOf = (index: number): string => `${props.maskId}-crossings-${index}`;

// From the board's units to fractions of the digit's box: one em is the box's height and its advance its
// width; the board's advance centre lands on the box's centre and its baseline on Caveat's
const glyphTransform = computed(() => {
    const advance = CAVEAT_DIGIT_ADVANCES[props.digit] ?? 0.45;
    const scaleX = 1 / (BOARD_GLYPH.size * advance);
    const scaleY = 1 / BOARD_GLYPH.size;
    const offsetX = 0.5 - BOARD_GLYPH.centreX * scaleX;
    const offsetY = CAVEAT_BASELINE_EM - BOARD_GLYPH.baselineY * scaleY;
    return `matrix(${scaleX} 0 0 ${scaleY} ${offsetX} ${offsetY})`;
});
</script>
