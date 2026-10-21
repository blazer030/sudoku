<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-scrim/50 flex items-center justify-center z-50"
            data-testid="new-game-confirm-dialog"
        >
            <div class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal">
                <div class="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center">
                    <TriangleAlert
                        :size="32"
                        class="text-danger"
                    />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2 class="text-2xl font-bold text-foreground tracking-tight">
                        {{ t("home.giveUp.title") }}
                    </h2>
                    <p
                        class="text-[15px] font-semibold text-foreground text-center"
                        data-testid="new-game-saved-summary"
                    >
                        {{ summary }}
                    </p>
                    <p
                        class="text-sm text-foreground-secondary text-center"
                        data-testid="new-game-give-up-note"
                    >
                        {{ t("common.giveUpConsequence") }}
                    </p>
                </div>

                <div class="flex flex-col gap-2 w-full">
                    <button
                        v-press
                        class="w-full h-[52px] rounded-button bg-primary text-on-primary flex items-center justify-center gap-2 shadow-primary cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:shadow-primary-lg"
                        data-testid="new-game-continue-button"
                        @click="close('continue')"
                    >
                        <Play :size="20" />
                        <span class="text-base font-semibold">{{ t("home.giveUp.continue") }}</span>
                    </button>

                    <button
                        v-press
                        class="w-full h-11 flex items-center justify-center cursor-pointer rounded-button text-danger text-[15px] font-semibold transition-all duration-200 hover:bg-foreground/5"
                        data-testid="give-up-and-start-new-button"
                        @click="close('giveUp')"
                    >
                        {{ t("home.giveUp.confirm") }}
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Play, TriangleAlert } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { useNewGameDialog } from "@/presentation/components/new-game-dialog/useNewGameDialog";
import { useDifficultyLabel } from "@/presentation/labels/difficultyLabels";
import { formatTime } from "@/utils/formatTime";
import { vPress } from "@/presentation/directives/press";

const { t } = useI18n();
const { visible, params, close } = useNewGameDialog();
const difficultyLabel = useDifficultyLabel();

const summary = computed(() => {
    if (params.value === undefined) return "";
    return t("home.giveUp.summary", {
        difficulty: difficultyLabel(params.value.difficulty),
        time: formatTime(params.value.elapsedSeconds),
    });
});
</script>
