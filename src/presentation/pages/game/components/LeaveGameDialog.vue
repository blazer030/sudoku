<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-scrim/50 flex items-center justify-center z-50"
            data-skin="dialog-scrim"
            data-testid="leave-game-dialog"
        >
            <div
                class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal"
                data-skin="card"
            >
                <div
                    class="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center"
                    data-skin="icon-tile"
                >
                    <Save
                        :size="32"
                        class="text-primary"
                    />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2
                        class="text-2xl font-bold text-foreground tracking-tight"
                        data-skin="dialog-title"
                    >
                        {{ t("game.leave.title") }}
                    </h2>
                    <p class="text-sm text-foreground-secondary text-center">
                        {{ t("game.leave.message") }}
                    </p>
                </div>

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
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { Save } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { useLeaveDialog } from "@/presentation/pages/game/components/useLeaveDialog";
import { vPress } from "@/presentation/directives/press";

const { t } = useI18n();
const { visible, close } = useLeaveDialog();
</script>
