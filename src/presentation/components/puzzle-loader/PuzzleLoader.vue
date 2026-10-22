<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-scrim/50 flex items-center justify-center z-50"
            data-testid="puzzle-loader"
        >
            <div
                class="rounded-3xl px-8 py-6 flex flex-col items-center gap-4 shadow-modal bg-scrim/30"
                :style="{
                    color: themeColor,
                    backdropFilter: 'blur(8px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(8px) saturate(160%)',
                }"
            >
                <div class="puzzle-loader__animation">
                    <Vue3Lottie
                        :animation-data="animationData"
                        :height="size"
                        :width="size"
                        :loop="true"
                        :auto-play="true"
                    />
                </div>
                <p class="text-sm text-on-scrim font-medium">
                    {{ message ?? t("home.generatingPuzzle") }}
                </p>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { Vue3Lottie } from "vue3-lottie";
import { useI18n } from "vue-i18n";
import animationData from "@/assets/lottie/sudoku-loader.json";

const { t } = useI18n();

withDefaults(defineProps<{
    visible: boolean;
    themeColor?: string;
    size?: number;
    message?: string;
}>(), {
    themeColor: "var(--color-primary)",
    size: 140,
    message: undefined,
});
</script>

<style scoped>
.puzzle-loader__animation :deep(svg path) {
    fill: currentColor;
}
</style>
