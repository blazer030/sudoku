<template>
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        data-testid="game-complete-modal"
    >
        <div class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-[0_8px_32px_#00000020]">
            <div class="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center">
                <Trophy
                    :size="40"
                    class="text-primary"
                />
            </div>

            <div class="flex flex-col items-center gap-2">
                <h2 class="text-[28px] font-bold text-foreground tracking-tight">
                    Congratulations!
                </h2>
                <p class="text-base text-foreground-secondary">
                    You solved the puzzle!
                </p>
            </div>

            <div class="flex justify-center gap-8 w-full">
                <div class="flex flex-col items-center gap-1">
                    <span class="text-[32px] font-bold text-primary tracking-tighter">
                        {{ formatTime(elapsedSeconds) }}
                    </span>
                    <span class="text-[13px] font-medium text-foreground-secondary">
                        Time
                    </span>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <span class="text-[32px] font-bold text-accent tracking-tighter">
                        {{ difficultyLabel }}
                    </span>
                    <span class="text-[13px] font-medium text-foreground-secondary">
                        Difficulty
                    </span>
                </div>
            </div>

            <button
                class="w-full h-[52px] rounded-[14px] bg-primary flex items-center justify-center gap-2 shadow-[0_4px_12px_#3D8A5A30] cursor-pointer"
                data-testid="back-to-home-button"
                @click="goHome"
            >
                <Home
                    :size="20"
                    class="text-white"
                />
                <span class="text-base font-semibold text-white">
                    Back to Home
                </span>
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { Trophy, Home } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { formatTime } from "@/utils/formatTime";
import { DifficultyLabels, type Difficulty } from "@/domain/SudokuGenerator";
import { ROUTER_PATH } from "@/router";
import { computed } from "vue";

const props = defineProps<{
    elapsedSeconds: number;
    difficulty: Difficulty;
}>();

const router = useRouter();

const difficultyLabel = computed(() => DifficultyLabels[props.difficulty]);

const goHome = () => {
    void router.replace(ROUTER_PATH.home);
};
</script>
