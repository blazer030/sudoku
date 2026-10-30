<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-scrim/50 flex items-center justify-center z-50"
            data-skin="dialog-scrim"
            data-testid="clear-records-dialog"
        >
            <div
                class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal"
                data-skin="card"
            >
                <div
                    class="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center"
                    data-skin="icon-tile danger"
                >
                    <Trash2
                        :size="32"
                        class="text-danger"
                    />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2
                        class="text-2xl font-bold text-foreground tracking-tight"
                        data-skin="dialog-title"
                    >
                        {{ t("settings.data.clearDialog.title") }}
                    </h2>
                    <p class="text-sm text-foreground-secondary text-center">
                        {{ t("settings.data.clearDialog.message") }}
                    </p>
                </div>

                <div class="flex flex-col gap-3 w-full">
                    <button
                        v-press
                        data-skin="button"
                        class="w-full h-[52px] rounded-button bg-danger flex items-center justify-center gap-2 shadow-danger cursor-pointer transition-all duration-200 hover:bg-danger-hover hover:shadow-primary-lg"
                        data-testid="clear-records-confirm-button"
                        @click="close('confirm')"
                    >
                        <span class="text-base font-semibold text-on-danger">{{ t("settings.data.clearRecords") }}</span>
                    </button>

                    <button
                        v-press
                        class="w-full h-[44px] flex items-center justify-center cursor-pointer rounded-button transition-all duration-200 hover:bg-foreground/5"
                        data-skin="text-button"
                        data-testid="clear-records-cancel-button"
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
import { useI18n } from "vue-i18n";
import { Trash2 } from "lucide-vue-next";
import { useClearRecordsDialog } from "@/presentation/pages/settings/components/useClearRecordsDialog";
import { vPress } from "@/presentation/directives/press";

const { t } = useI18n();
const { visible, close } = useClearRecordsDialog();
</script>
