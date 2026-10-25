<template>
    <div class="paper-loader relative flex w-[196px] flex-col items-center gap-3 rounded-[2px_2px_8px_2px] bg-featured pt-[26px] px-5 pb-4 text-on-featured">
        <!-- skin.css tilts and tapes the note, draws the grid and writes the digits in turn, then wipes the
             note for the next round; under reduced motion the note is already written -->
        <div
            class="paper-loader-sketch relative size-24"
            aria-hidden="true"
        >
            <svg
                class="absolute inset-0 overflow-visible"
                viewBox="0 0 96 96"
                width="96"
                height="96"
            >
                <path
                    v-for="stroke in GRID_STROKES"
                    :key="stroke"
                    class="paper-loader-line"
                    :d="stroke"
                />
            </svg>
            <span
                v-for="digit in DIGITS"
                :key="digit.value"
                class="paper-loader-digit absolute flex size-8 items-center justify-center font-hand text-[30px] font-bold leading-none"
                :style="{ left: `${digit.column * 32}px`, top: `${digit.row * 32}px` }"
            >{{ digit.value }}</span>
        </div>
        <p class="m-0 text-[15px] font-medium">
            {{ message ?? t("home.generatingPuzzle") }}
        </p>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

withDefaults(defineProps<{
    message?: string;
}>(), {
    message: undefined,
});

// The grid by hand: two wavering lines down, then two across
const GRID_STROKES = [
    "M33 6 C 31 30, 34 60, 32 90",
    "M63 5 C 65 35, 62 62, 64 91",
    "M6 33 C 30 31, 62 35, 90 32",
    "M5 63 C 35 65, 60 62, 91 64",
];

// The digits written into the sketch, in the order they are written
const DIGITS = [
    { value: 5, row: 0, column: 0 },
    { value: 9, row: 1, column: 1 },
    { value: 1, row: 0, column: 2 },
    { value: 7, row: 2, column: 1 },
];
</script>
