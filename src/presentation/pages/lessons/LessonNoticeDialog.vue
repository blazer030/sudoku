<template>
    <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 bg-scrim/50 flex items-center-safe justify-center overflow-y-auto py-safe-larger z-50"
            data-skin="dialog-scrim"
            data-testid="lesson-notice"
        >
            <div
                class="bg-card rounded-3xl p-8 mx-6 w-full max-w-[354px] flex flex-col items-center gap-6 shadow-modal"
                data-skin="card"
            >
                <div
                    class="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center"
                    data-skin="icon-tile"
                >
                    <Palette
                        :size="32"
                        class="text-primary"
                    />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2
                        class="text-2xl font-bold text-foreground tracking-tight text-center text-balance"
                        data-skin="dialog-title"
                    >
                        {{ t("lessons.notice.title") }}
                    </h2>
                    <p class="text-sm text-foreground-secondary text-center">
                        {{ t("lessons.notice.message", { light }) }}
                    </p>
                </div>

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
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
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
