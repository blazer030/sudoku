<template>
    <div class="flex items-center justify-between">
        <button
            class="flex items-center gap-2 cursor-pointer"
            @click="goBack"
        >
            <ChevronLeft
                :size="24"
                class="text-foreground"
            />
            <span class="text-foreground text-base font-medium">
                Back
            </span>
        </button>
        <div class="flex items-center gap-1.5">
            <Timer
                :size="18"
                class="text-foreground-secondary"
            />
            <span
                class="text-foreground text-lg font-semibold"
                data-testid="timer"
            >
                {{ formatTime(elapsedSeconds) }}
            </span>
        </div>
        <div class="flex items-center bg-primary-light rounded-full px-3 py-1.5">
            <span class="text-primary text-xs font-semibold leading-none">
                {{ difficultyLabel }}
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ChevronLeft, Timer } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { ROUTER_PATH } from "@/router";
import { useGameStore } from "@/stores/gameStore";
import { formatTime } from "@/utils/formatTime";
import { DifficultyLabels } from "@/domain/SudokuGenerator";

defineProps<{ elapsedSeconds: number }>();

const router = useRouter();
const gameStore = useGameStore();

const difficultyLabel = DifficultyLabels[gameStore.difficulty ?? "easy"];

const goBack = () => {
    void router.push(ROUTER_PATH.home);
};
</script>
