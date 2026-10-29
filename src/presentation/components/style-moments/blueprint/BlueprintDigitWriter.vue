<template>
    <!-- Blueprint's pen: the digit is plotted in outline while a pair of crosshairs sweeps the cell, then inked in
         and the outline lifts, leaving the digit itself. skin.css runs all three. The layers are SVGs, never
         divs, so the board's rule for a cell's digit (a positioned div above the cell) never reaches them. -->
    <svg
        class="pointer-events-none absolute size-0 overflow-hidden"
        aria-hidden="true"
    >
        <defs>
            <!-- Laid on the digit's box and well past it; an alpha mask, so its colour does not matter -->
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
                <rect
                    class="blueprint-digit-ink"
                    x="-1"
                    y="-1"
                    width="3"
                    height="3"
                    fill="currentColor"
                    @animationend="emit('written')"
                />
            </mask>
        </defs>
    </svg>
    <!-- The outline lies on the digit's em square, centred on the cell as the digit's one-em line box is (the
         digit's size is BoardCell's entry size), in the font's units, which the skin sizes its pen by -->
    <svg
        class="blueprint-digit-outline-layer pointer-events-none absolute left-1/2 top-1/2 z-4 size-[1em] -translate-x-1/2 -translate-y-1/2 overflow-visible text-[length:calc(22px*var(--entry-scale,1))]"
        :viewBox="`0 0 ${unitsPerEm} ${unitsPerEm}`"
        :style="{ '--blueprint-digit-units-per-em': unitsPerEm }"
        aria-hidden="true"
    >
        <path
            v-if="outline"
            class="blueprint-digit-outline"
            :d="outline"
            pathLength="1"
            :transform="glyphTransform"
        />
    </svg>
    <!-- Two 1px crosshairs across the whole cell, crossing at its centre; skin.css moves them as the pen goes -->
    <svg
        class="blueprint-digit-crosshairs pointer-events-none absolute inset-0 z-5 size-full overflow-visible"
        aria-hidden="true"
    >
        <line
            class="blueprint-digit-crosshair"
            data-axis="horizontal"
            x1="0"
            y1="50%"
            x2="100%"
            y2="50%"
        />
        <line
            class="blueprint-digit-crosshair"
            data-axis="vertical"
            x1="50%"
            y1="0"
            x2="50%"
            y2="100%"
        />
    </svg>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { BLUEPRINT_DIGIT_FACE, type BlueprintDigit } from "@/presentation/components/style-moments/blueprint/blueprintDigitOutlines";

const props = defineProps<{
    digit: number;
    maskId: string;
}>();

const emit = defineEmits<{
    written: [];
}>();

const { unitsPerEm, baselineEm } = BLUEPRINT_DIGIT_FACE;

const isBlueprintDigit = (digit: number): digit is BlueprintDigit => Number.isInteger(digit) && digit >= 1 && digit <= 9;

// Only 1–9 are ever entered; anything else is only inked in, whole
const outline = computed(() => (isBlueprintDigit(props.digit) ? BLUEPRINT_DIGIT_FACE.outlines[props.digit] : null));

// From the font's units (y up from the glyph's origin) onto the em square (y down from its top): the advance
// centred across it and the origin on the baseline
const glyphTransform = computed(() => {
    const advance = isBlueprintDigit(props.digit) ? BLUEPRINT_DIGIT_FACE.advances[props.digit] : 0;
    return `matrix(1 0 0 -1 ${(1 - advance) / 2 * unitsPerEm} ${baselineEm * unitsPerEm})`;
});
</script>
