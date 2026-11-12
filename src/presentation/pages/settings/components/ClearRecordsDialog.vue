<template>
    <DialogShell
        :icon="Trash2"
        :title="t('settings.data.clearDialog.title')"
        tone="danger"
        :visible="visible"
        test-id="clear-records-dialog"
    >
        <template #message>
            <p class="text-sm text-foreground-secondary text-center">
                {{ t("settings.data.clearDialog.message") }}
            </p>
        </template>

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
    </DialogShell>
</template>

<script lang="ts" setup>
import DialogShell from "@/presentation/components/dialog-shell/DialogShell.vue";
import { useI18n } from "vue-i18n";
import { Trash2 } from "@/presentation/components/icon";
import { useClearRecordsDialog } from "@/presentation/pages/settings/components/useClearRecordsDialog";
import { vPress } from "@/presentation/directives/press";

const { t } = useI18n();
const { visible, close } = useClearRecordsDialog();
</script>
