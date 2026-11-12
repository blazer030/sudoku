<template>
    <DialogShell
        :icon="Save"
        :title="t('game.leave.title')"
        tone="primary"
        :visible="visible"
        test-id="leave-game-dialog"
    >
        <template #message>
            <p class="text-sm text-foreground-secondary text-center">
                {{ t("game.leave.message") }}
            </p>
        </template>

        <div class="flex flex-col gap-3 w-full">
            <button
                v-press
                data-skin="button"
                class="w-full h-[52px] rounded-button bg-primary flex items-center justify-center gap-2 shadow-primary cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:shadow-primary-lg"
                data-testid="save-and-leave-button"
                @click="close('save')"
            >
                <Save
                    :size="20"
                    class="text-on-primary"
                />
                <span class="text-base font-semibold text-on-primary">{{ t("game.leave.saveAndLeave") }}</span>
            </button>

            <!-- Equal halves, unless a longer label needs more room to stay on one line -->
            <div class="flex gap-2">
                <button
                    v-press
                    class="flex-1 h-11 px-3 whitespace-nowrap flex items-center justify-center cursor-pointer rounded-button text-foreground text-[15px] font-semibold transition-all duration-200 hover:bg-foreground/5"
                    data-skin="text-button"
                    data-testid="leave-cancel-button"
                    @click="close('cancel')"
                >
                    {{ t("common.cancel") }}
                </button>
                <button
                    v-press
                    class="flex-1 h-11 px-3 whitespace-nowrap flex items-center justify-center cursor-pointer rounded-button text-danger text-[15px] font-semibold transition-all duration-200 hover:bg-foreground/5"
                    data-skin="text-button"
                    data-testid="give-up-and-leave-button"
                    @click="close('giveUp')"
                >
                    {{ t("game.leave.giveUp") }}
                </button>
            </div>

            <p
                class="text-[13px] text-foreground-secondary text-center"
                data-testid="leave-give-up-note"
            >
                {{ t("common.giveUpConsequence") }}
            </p>
        </div>
    </DialogShell>
</template>

<script lang="ts" setup>
import DialogShell from "@/presentation/components/dialog-shell/DialogShell.vue";
import { Save } from "@/presentation/components/icon";
import { useI18n } from "vue-i18n";
import { useLeaveDialog } from "@/presentation/pages/game/components/useLeaveDialog";
import { vPress } from "@/presentation/directives/press";

const { t } = useI18n();
const { visible, close } = useLeaveDialog();
</script>
