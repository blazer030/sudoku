<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            data-testid="puzzle-loader"
        >
            <div
                class="bg-card rounded-3xl px-8 py-6 flex flex-col items-center gap-4 shadow-modal"
                :style="{ color: themeColor }"
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
                <p class="text-sm text-foreground-secondary font-medium">
                    {{ message }}
                </p>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { Vue3Lottie } from "vue3-lottie";
import animationData from "@/assets/lottie/sudoku-loader.json";

withDefaults(defineProps<{
    visible: boolean;
    themeColor?: string;
    size?: number;
    message?: string;
}>(), {
    themeColor: "var(--color-primary)",
    size: 140,
    message: "Generating puzzle…",
});
</script>

<style scoped>
.puzzle-loader__animation :deep(svg path) {
    fill: currentColor;
}
</style>
