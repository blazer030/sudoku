<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-scrim/60 flex items-center justify-center z-50"
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
                        {{ t("game.complete.title") }}
                    </h2>
                    <div class="flex flex-wrap items-center justify-center gap-2">
                        <span
                            class="bg-accent/10 text-accent text-[13px] font-semibold rounded-full px-2.5 py-1"
                            data-testid="complete-difficulty"
                        >{{ difficultyLabel }}</span>
                        <span
                            v-if="params?.isNewRecord"
                            class="bg-primary text-on-primary text-[13px] font-semibold rounded-full px-2.5 py-1"
                            data-testid="new-record-badge"
                        >{{ t("game.complete.newRecord") }}</span>
                    </div>
                    <p class="text-base text-foreground-secondary">
                        {{ t("game.complete.message") }}
                    </p>
                </div>

                <div
                    class="grid grid-cols-2 gap-2 w-full"
                    data-testid="complete-stats"
                >
                    <div class="flex flex-col items-center gap-1">
                        <span class="text-[32px] font-bold text-primary tracking-tighter">
                            {{ formatTime(params?.elapsedSeconds ?? 0) }}
                        </span>
                        <span class="text-[13px] font-medium text-foreground-secondary">
                            {{ t("game.complete.time") }}
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
                            {{ t("game.complete.hints") }}
                        </span>
                    </div>
                </div>

                <div class="flex flex-col gap-2.5 w-full">
                    <button
                        v-press
                        data-skin="button"
                        class="w-full h-[52px] rounded-button bg-primary text-on-primary flex items-center justify-center gap-2 shadow-primary cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:shadow-primary-lg"
                        data-testid="play-again-button"
                        @click="close('playAgain')"
                    >
                        <RotateCcw :size="20" />
                        <span class="text-base font-semibold">{{ t("game.complete.playAgain") }}</span>
                    </button>
                    <button
                        v-press
                        data-skin="button"
                        class="w-full h-[52px] rounded-button bg-card border border-border text-foreground flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-foreground/5"
                        data-testid="review-game-button"
                        @click="close('review')"
                    >
                        <History :size="20" />
                        <span class="text-base font-semibold">{{ t("game.complete.review") }}</span>
                    </button>
                    <button
                        v-press
                        class="w-full h-11 rounded-button text-foreground-secondary text-[15px] font-medium flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-foreground/5"
                        data-testid="back-to-home-button"
                        @click="close('home')"
                    >
                        {{ t("game.complete.backToHome") }}
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { History, RotateCcw, Trophy } from "lucide-vue-next";
import { formatTime } from "@/utils/formatTime";
import { useDifficultyLabel } from "@/presentation/labels/difficultyLabels";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGameCompleteModal } from "@/presentation/pages/game/components/useGameCompleteModal";
import FireworkCanvas from "@/presentation/components/firework-canvas/FireworkCanvas.vue";
import { vPress } from "@/presentation/directives/press";

const { t } = useI18n();
const { visible, params, close } = useGameCompleteModal();

const difficultyText = useDifficultyLabel();
const difficultyLabel = computed(() => difficultyText(params.value?.difficulty ?? "easy"));
</script>
