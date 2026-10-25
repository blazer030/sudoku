<template>
    <div class="ink-loader relative flex flex-col items-center gap-3 bg-card pt-6 px-10 pb-5 text-foreground shadow-[inset_0_0_0_1px_var(--color-border),0_18px_40px_-20px_color-mix(in_srgb,var(--color-shadow)_45%,transparent)]">
        <!-- A slip of washi. skin.css brushes a sudoku box, the frame first and then the inner lines, each
             stroke heavy to light with a dry tail, drawn on along its own mask; then inks the digits in a
             solving order, presses a 「題」 seal and fades the slip for the next round. Under reduced motion
             the slip is already written and sealed. -->
        <div
            class="ink-loader-sketch relative size-[120px]"
            aria-hidden="true"
        >
            <svg
                class="absolute inset-0 overflow-visible"
                viewBox="0 0 120 120"
                width="120"
                height="120"
            >
                <defs>
                    <!-- Alpha masks, so the brush's colour does not matter -->
                    <mask
                        v-for="(stroke, step) in STROKES"
                        :id="maskIdOf(step)"
                        :key="step"
                        style="mask-type: alpha"
                        maskUnits="userSpaceOnUse"
                        x="-20"
                        y="-20"
                        width="160"
                        height="160"
                    >
                        <path
                            class="ink-loader-reveal"
                            :data-step="step"
                            :transform="stroke"
                            d="M-4 0 L 106 0"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="11"
                        />
                    </mask>
                </defs>
                <g
                    v-for="(stroke, step) in STROKES"
                    :key="step"
                    class="ink-loader-stroke"
                    :data-step="step"
                    :mask="`url(#${maskIdOf(step)})`"
                >
                    <g
                        :transform="stroke"
                        fill="currentColor"
                        stroke="currentColor"
                    >
                        <path
                            d="M2 -3 C 30 -2.9, 60 -1.9, 88 -1.2 L 101 0 L 88 1.3 C 60 2, 30 3.1, 2 3.2 C -1.4 2.6, -1.8 -2.4, 2 -3 Z"
                            stroke="none"
                        />
                        <ellipse
                            cx="3.2"
                            cy="0"
                            rx="3.4"
                            ry="3.6"
                            stroke="none"
                        />
                        <path
                            d="M78 -0.9 C 88 -1, 96 -1.2, 104 -1.5"
                            fill="none"
                            stroke-width=".7"
                            stroke-dasharray="7 2 5 3 4"
                        />
                        <path
                            d="M78 1 C 88 1.1, 96 1.4, 103 1.8"
                            fill="none"
                            stroke-width=".6"
                            stroke-dasharray="5 3 6 2 3"
                        />
                    </g>
                </g>
            </svg>
            <span
                v-for="(digit, step) in DIGITS"
                :key="digit.value"
                class="ink-loader-digit absolute flex size-8 items-center justify-center font-mono text-[23px] font-medium leading-none lining-nums"
                :data-step="step"
                :style="{ left: `${digit.left}px`, top: `${digit.top}px` }"
            >{{ digit.value }}</span>
            <!-- An emblem: the same in both languages -->
            <span class="ink-loader-seal absolute -right-4 -bottom-1.5 grid size-7 place-items-center rounded-[4px_2px_5px_3px] bg-primary text-[15px] font-black leading-none text-on-primary shadow-[inset_0_0_0_1.5px_var(--color-primary),inset_0_0_0_2.5px_var(--color-on-primary)]">題</span>
        </div>
        <p class="ink-loader-caption m-0 text-sm tracking-[0.2em] text-foreground-secondary">
            {{ message ?? t("home.generatingPuzzle") }}
        </p>
    </div>
</template>

<script lang="ts" setup>
import { useId } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

withDefaults(defineProps<{
    message?: string;
}>(), {
    message: undefined,
});

// One brush stroke laid along each line of the box, in the order it is brushed: the frame (top, left,
// right, bottom), then the two inner lines down and the two across
const STROKES = [
    "translate(10 12)",
    "translate(12 10) rotate(90)",
    "translate(108 10) rotate(90)",
    "translate(10 108)",
    "translate(44 10) rotate(90)",
    "translate(76 10) rotate(90)",
    "translate(10 44)",
    "translate(10 76)",
];

// The digits inked in, in the order they are written, by their cell's top left corner
const DIGITS = [
    { value: 5, left: 12, top: 12 },
    { value: 9, left: 44, top: 76 },
    { value: 1, left: 76, top: 12 },
    { value: 7, left: 44, top: 44 },
];

// Two loaders on one screen keep their masks apart
const idSuffix = useId().replace(/\W/g, "");
const maskIdOf = (step: number): string => `ink-loader-${idSuffix}-${step}`;
</script>
