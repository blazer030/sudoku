<template>
    <div class="tactile-loader flex flex-col items-center gap-[18px] rounded-[26px] pt-6 px-8 pb-5 bg-card">
        <!-- skin.css drops each tile in its step, presses the full tray and holds four tiles under reduced motion -->
        <div
            class="tactile-loader-tray grid grid-cols-[repeat(3,26px)] gap-1.5 pt-[9px] px-[9px] pb-[11px] rounded-[14px] bg-background"
            aria-hidden="true"
        >
            <span
                v-for="(step, square) in DROP_STEP_BY_SQUARE"
                :key="square"
                class="tactile-loader-cell relative block size-[26px]"
            >
                <span class="tactile-loader-slot absolute inset-0 rounded-[7px]" />
                <span
                    class="tactile-loader-tile absolute inset-0 rounded-[7px]"
                    :style="{ '--tactile-loader-step': step }"
                >
                    <span class="tactile-loader-face absolute inset-0 rounded-[7px]" />
                </span>
            </span>
        </div>
        <p class="m-0 text-sm font-medium text-foreground-secondary">
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

// The tiles fill the tray in a snake: along the top row, back along the middle, along the bottom
const DROP_STEP_BY_SQUARE = [0, 1, 2, 5, 4, 3, 6, 7, 8];
</script>
