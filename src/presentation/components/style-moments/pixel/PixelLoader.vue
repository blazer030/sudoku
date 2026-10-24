<template>
    <div class="pixel-loader flex w-[262px] flex-col items-center gap-4 bg-background pt-6 px-[22px] pb-5 text-foreground">
        <!-- An RPG text window. skin.css frames it, lights the mark's squares one at a time like a snake,
             counts NOW LOADING's dots, blinks the cursor and fills the bar a block at a time, all in steps;
             under reduced motion the mark, the dots and the bar hold still. -->
        <div
            class="pixel-loader-mark grid grid-cols-[repeat(3,18px)] gap-1 p-2"
            aria-hidden="true"
        >
            <span
                v-for="(step, square) in LIGHTING_STEP_BY_SQUARE"
                :key="square"
                class="pixel-loader-square block size-[18px]"
                :style="{ '--pixel-loader-step': step }"
            />
        </div>
        <p
            class="pixel-loader-now m-0 text-[11px] leading-none tracking-[1px]"
            aria-hidden="true"
        >
            NOW LOADING<span class="pixel-loader-dots inline-block">...</span>
        </p>
        <p class="pixel-loader-caption m-0 flex items-center gap-2 text-base leading-tight">
            <span
                class="pixel-loader-cursor block h-2.5 w-1.5 shrink-0"
                aria-hidden="true"
            />
            <span>{{ message ?? t("home.generatingPuzzle") }}</span>
        </p>
        <div
            class="pixel-loader-bar h-4 w-full overflow-hidden p-1"
            aria-hidden="true"
        >
            <span class="pixel-loader-bar-fill block h-2 w-full" />
        </div>
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

// The squares light like a snake: across the top, back along the middle, across the bottom
const LIGHTING_STEP_BY_SQUARE = [0, 1, 2, 5, 4, 3, 6, 7, 8];
</script>
