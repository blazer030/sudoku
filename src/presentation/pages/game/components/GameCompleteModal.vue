<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            data-testid="game-complete-modal"
        >
            <FireworkCanvas />
            <div class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal relative z-[52]">
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

                <div class="grid grid-cols-3 w-full">
                    <div class="flex flex-col items-center gap-1">
                        <span class="text-[32px] font-bold text-primary tracking-tighter">
                            {{ formatTime(params?.elapsedSeconds ?? 0) }}
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
                    <div class="flex flex-col items-center gap-1">
                        <span
                            class="text-[32px] font-bold text-foreground-secondary tracking-tighter"
                            data-testid="hints-count"
                        >
                            {{ params?.hintsUsed ?? 0 }}
                        </span>
                        <span class="text-[13px] font-medium text-foreground-secondary">
                            Hints
                        </span>
                    </div>
                </div>

                <button
                    class="w-full h-[52px] rounded-button bg-primary flex items-center justify-center gap-2 shadow-primary cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:shadow-primary-lg"
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
    </Transition>
</template>

<script lang="ts" setup>
import { Trophy, Home } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { formatTime } from "@/utils/formatTime";
import { DifficultyLabels } from "@/domain";
import { computed } from "vue";
import { useGameCompleteModal } from "@/presentation/pages/game/components/useGameCompleteModal";
import FireworkCanvas from "@/presentation/pages/game/components/FireworkCanvas.vue";

const router = useRouter();
const { visible, params, close } = useGameCompleteModal();

const difficultyLabel = computed(() => DifficultyLabels[params.value?.difficulty ?? "easy"]);

const goHome = () => {
    router.back();
    close();
};
</script>
