<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            data-testid="new-game-confirm-dialog"
        >
            <div class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal">
                <div class="w-16 h-16 rounded-2xl bg-[#FFF3E0] flex items-center justify-center">
                    <TriangleAlert
                        :size="32"
                        class="text-danger"
                    />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2 class="text-2xl font-bold text-foreground tracking-tight">
                        {{ t("home.giveUp.title") }}
                    </h2>
                    <p class="text-sm text-foreground-secondary text-center">
                        {{ t("home.giveUp.message") }}
                    </p>
                </div>

                <div class="flex flex-col gap-3 w-full">
                    <button
                        class="w-full h-[52px] rounded-button bg-danger flex items-center justify-center gap-2 shadow-danger cursor-pointer transition-all duration-200 hover:bg-danger-hover hover:shadow-primary-lg"
                        data-testid="give-up-and-start-new-button"
                        @click="close('giveUp')"
                    >
                        <span class="text-base font-semibold text-white">{{ t("home.giveUp.confirm") }}</span>
                    </button>

                    <button
                        class="w-full h-[44px] flex items-center justify-center cursor-pointer rounded-button transition-all duration-200 hover:bg-foreground/5"
                        data-testid="new-game-cancel-button"
                        @click="close('cancel')"
                    >
                        <span class="text-base font-semibold text-foreground">{{ t("common.cancel") }}</span>
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { TriangleAlert } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { useNewGameDialog } from "@/presentation/components/new-game-dialog/useNewGameDialog";

const { t } = useI18n();
const { visible, close } = useNewGameDialog();
</script>
