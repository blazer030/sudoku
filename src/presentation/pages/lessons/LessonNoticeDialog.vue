<template>
    <DialogShell
        :icon="Palette"
        :title="t('lessons.notice.title')"
        title-class="text-center text-balance"
        tone="primary"
        :visible="visible"
        test-id="lesson-notice"
    >
        <template #message>
            <p class="text-sm text-foreground-secondary text-center">
                {{ t("lessons.notice.message", { light }) }}
            </p>
        </template>

        <div class="flex flex-col gap-2 w-full">
            <button
                v-press
                class="w-full h-[52px] rounded-button bg-primary text-on-primary text-base font-semibold flex items-center justify-center shadow-primary cursor-pointer"
                data-skin="button"
                data-testid="lesson-notice-switch"
                type="button"
                @click="close('switch')"
            >
                {{ t("lessons.notice.switch", { dark }) }}
            </button>
            <button
                v-press
                class="h-11 px-3 flex items-center justify-center text-foreground-secondary font-medium cursor-pointer"
                data-skin="text-button"
                data-testid="lesson-notice-styles"
                type="button"
                @click="close('styles')"
            >
                {{ t("lessons.notice.otherStyles") }}
            </button>
            <button
                v-press
                class="h-11 px-3 flex items-center justify-center text-foreground-secondary font-medium cursor-pointer"
                data-skin="text-button"
                data-testid="lesson-notice-carry-on"
                type="button"
                @click="close('carryOn')"
            >
                {{ t("lessons.notice.carryOn", { light }) }}
            </button>
        </div>
    </DialogShell>
</template>

<script lang="ts" setup>
import DialogShell from "@/presentation/components/dialog-shell/DialogShell.vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Palette } from "@/presentation/components/icon";
import { vPress } from "@/presentation/directives/press";
import { useLessonNoticeDialog } from "@/presentation/pages/lessons/useLessonNotice";

const { t } = useI18n();
const { visible, close } = useLessonNoticeDialog();

const light = computed(() => t("settings.colorMode.styled.pixel.light"));
const dark = computed(() => t("settings.colorMode.styled.pixel.dark"));
</script>
