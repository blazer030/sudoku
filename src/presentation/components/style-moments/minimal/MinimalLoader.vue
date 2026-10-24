<template>
    <div
        class="minimal-loader flex flex-col items-center gap-4 rounded-3xl pt-[26px] px-[34px] pb-[22px] bg-scrim/30 shadow-[0_20px_40px_-12px_color-mix(in_srgb,var(--color-scrim)_40%,transparent)] backdrop-blur-[8px] backdrop-saturate-[1.6]"
    >
        <!-- skin.css lights each square in its step and holds a still pattern under reduced motion -->
        <div
            class="grid grid-cols-[repeat(3,18px)] gap-[7px] p-1.5"
            aria-hidden="true"
        >
            <span
                v-for="(step, square) in LIGHTING_STEP_BY_SQUARE"
                :key="square"
                class="minimal-loader-square block size-[18px] rounded-md"
                :style="{ '--minimal-loader-step': step }"
            />
        </div>
        <p class="m-0 text-sm font-medium text-on-scrim">
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

// The squares light like a solve: corners and centre first (1, 5, 9, 3, 7), then the edges (2, 6, 8, 4)
const LIGHTING_STEP_BY_SQUARE = [0, 5, 3, 8, 1, 6, 4, 7, 2];
</script>
