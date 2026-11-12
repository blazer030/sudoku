<template>
    <DialogShell
        :icon="TriangleAlert"
        :title="t('home.giveUp.title')"
        tone="danger"
        :visible="visible"
        test-id="new-game-confirm-dialog"
        @scrim-click="close('stay')"
    >
        <template #message>
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
        </template>

        <div class="flex flex-col gap-2 w-full">
            <button
                v-press
                data-skin="button"
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
                data-skin="text-button"
                data-testid="give-up-and-start-new-button"
                @click="close('giveUp')"
            >
                {{ t("home.giveUp.confirm") }}
            </button>

            <button
                v-press
                class="w-full h-11 flex items-center justify-center cursor-pointer rounded-button text-foreground-secondary text-[15px] font-medium transition-all duration-200 hover:bg-foreground/5"
                data-skin="text-button"
                data-testid="new-game-stay-button"
                @click="close('stay')"
            >
                {{ t(params?.origin === "lessons" ? "home.giveUp.stayInLessons" : "home.giveUp.stay") }}
            </button>
        </div>
    </DialogShell>
</template>

<script lang="ts" setup>
import DialogShell from "@/presentation/components/dialog-shell/DialogShell.vue";
import { computed } from "vue";
import { Play, TriangleAlert } from "@/presentation/components/icon";
import { useI18n } from "vue-i18n";
import { useNewGameDialog } from "@/presentation/components/new-game-dialog/useNewGameDialog";
import { useDifficultyLabel } from "@/presentation/i18n/difficultyLabels";
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
