<template>
    <div class="flex items-center justify-between">
        <button
            class="flex items-center gap-2 cursor-pointer"
            data-testid="back-button"
            @click="emit('back')"
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
        <div class="flex items-center bg-accent/15 rounded-full px-3 py-1.5">
            <span class="text-accent text-xs font-semibold leading-none">
                {{ difficultyLabel }}
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ChevronLeft, Timer } from "lucide-vue-next";
import { useGameStore } from "@/stores/gameStore";
import { formatTime } from "@/utils/formatTime";
import { DifficultyLabels } from "@/domain";

defineProps<{ elapsedSeconds: number }>();
const emit = defineEmits<{ back: [] }>();

const gameStore = useGameStore();

const difficultyLabel = DifficultyLabels[gameStore.difficulty ?? "easy"];
</script>
