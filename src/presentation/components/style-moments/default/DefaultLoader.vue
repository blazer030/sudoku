<template>
    <div
        class="rounded-3xl px-8 py-6 flex flex-col items-center gap-4 shadow-modal bg-scrim/30"
        :style="{
            color: 'var(--color-primary)',
            backdropFilter: 'blur(8px) saturate(160%)',
            WebkitBackdropFilter: 'blur(8px) saturate(160%)',
        }"
    >
        <div class="default-loader__animation">
            <Vue3Lottie
                :animation-data="animationData"
                :height="140"
                :width="140"
                :loop="true"
                :auto-play="true"
            />
        </div>
        <p class="text-sm text-on-scrim font-medium">
            {{ message ?? t("home.generatingPuzzle") }}
        </p>
    </div>
</template>

<script lang="ts" setup>
import { Vue3Lottie } from "vue3-lottie";
import { useI18n } from "vue-i18n";
import animationData from "@/assets/lottie/sudoku-loader.json";

const { t } = useI18n();

// A screen may swap the caption (the walkthrough says it is checking, not generating)
withDefaults(defineProps<{
    message?: string;
}>(), {
    message: undefined,
});
</script>

<style scoped>
.default-loader__animation :deep(svg path) {
    fill: currentColor;
}
</style>
