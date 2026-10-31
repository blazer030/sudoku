<template>
    <Transition name="modal">
        <div
            v-if="visible"
            ref="scrim"
            class="fixed inset-0 bg-scrim/60 flex items-center-safe justify-center overflow-y-auto py-safe-larger z-50"
            data-skin="dialog-scrim"
            data-testid="game-complete-modal"
        >
            <component
                :is="moments.celebration"
                v-if="moments.celebration !== null"
                :still="params?.still ?? false"
            />
            <!-- Room above and below for a style's stamp, rod or seal past the card's edge, which the scrim
                 could not scroll back to. Only when what the card holds does not fit the window anyway: on a
                 phone it does, even one that cuts into the card's padding, and the card stays as it was. -->
            <div
                ref="card"
                class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal relative z-[52]"
                :class="{ 'my-16': contentTallerThanRoom }"
                :data-still="params?.still ? '' : undefined"
                data-skin="card celebration"
                data-testid="complete-card"
            >
                <component
                    :is="moments.cardDecoration"
                    v-if="moments.cardDecoration"
                    :still="params?.still ?? false"
                />
                <div
                    class="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center"
                    data-skin="trophy"
                    data-testid="complete-trophy"
                >
                    <Trophy
                        :size="40"
                        class="text-primary"
                    />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2
                        class="text-[28px] font-bold text-foreground tracking-tight"
                        data-skin="complete-title"
                    >
                        {{ t("game.complete.title") }}
                    </h2>
                    <div class="flex flex-wrap items-center justify-center gap-2">
                        <span
                            class="bg-accent/10 text-accent text-[13px] font-semibold rounded-full px-2.5 py-1"
                            data-skin="tag"
                            data-testid="complete-difficulty"
                        >{{ difficultyLabel }}</span>
                        <span
                            v-if="params?.isNewRecord"
                            class="bg-primary text-on-primary text-[13px] font-semibold rounded-full px-2.5 py-1"
                            data-skin="tag new-record"
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
                        data-skin="text-button"
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
import { useDifficultyLabel } from "@/presentation/i18n/difficultyLabels";
import { computed, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useGameCompleteModal } from "@/presentation/pages/game/components/useGameCompleteModal";
import { useStyleMoments } from "@/presentation/components/style-moments/styleMoments";
import { vPress } from "@/presentation/directives/press";
import { useContentTallerThanRoom } from "@/presentation/composables/useContentTallerThanRoom";

const { t } = useI18n();
const moments = useStyleMoments();
const { visible, params, close } = useGameCompleteModal();
const { contentTallerThanRoom } = useContentTallerThanRoom(useTemplateRef<HTMLElement>("scrim"), useTemplateRef<HTMLElement>("card"));

const difficultyText = useDifficultyLabel();
const difficultyLabel = computed(() => difficultyText(params.value?.difficulty ?? "easy"));
</script>
