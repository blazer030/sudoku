<template>
    <div class="flex flex-col gap-5 h-dvh px-5 bg-background overflow-y-auto">
        <div class="flex items-center justify-between sticky top-0 bg-background pt-6 pb-3 z-10">
            <button
                class="flex items-center gap-2 cursor-pointer"
                data-testid="back-button"
                @click="goBack"
            >
                <ChevronLeft
                    :size="24"
                    class="text-foreground"
                />
                <span class="text-foreground text-base font-medium">Back</span>
            </button>
            <span class="text-foreground text-lg font-semibold">Settings</span>
            <div class="w-15" />
        </div>

        <div class="flex flex-col gap-2">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">Appearance</span>
            <div class="bg-card rounded-2xl px-4 py-4 shadow-card-sm">
                <span class="text-foreground text-[15px] font-medium">Color theme</span>
                <div class="grid grid-cols-6 gap-3 mt-3 justify-items-center">
                    <button
                        v-for="color in THEMES"
                        :key="color.id"
                        class="relative aspect-square w-full max-w-15 rounded-full cursor-pointer transition-all duration-200 overflow-hidden"
                        :class="[
                            color.id === settingsStore.colorTheme
                                ? 'ring-2 ring-offset-2 ring-primary scale-110'
                                : 'hover:scale-105',
                        ]"
                        :data-testid="`color-theme-${color.id}`"
                        @click="settingsStore.setColorTheme(color.id)"
                    >
                        <div class="absolute inset-0 flex">
                            <div
                                class="w-1/2 h-full"
                                :style="{ backgroundColor: color.primary }"
                            />
                            <div
                                class="w-1/2 h-full"
                                :style="{ backgroundColor: color.accent }"
                            />
                        </div>
                        <div
                            v-if="color.id === settingsStore.colorTheme"
                            data-testid="color-theme-check"
                            class="absolute inset-0 flex items-center justify-center"
                        >
                            <Check
                                :size="18"
                                class="text-white"
                                :stroke-width="3"
                            />
                        </div>
                    </button>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">Gameplay</span>
            <div class="bg-card rounded-2xl px-4 shadow-card-sm divide-y divide-border">
                <button
                    v-for="toggle in toggles"
                    :key="toggle.key"
                    class="flex items-center justify-between py-3.5 cursor-pointer w-full"
                    :data-testid="`toggle-${toggle.key}`"
                    @click="toggle.setter(!toggle.value)"
                >
                    <div class="flex flex-col gap-0.5">
                        <span class="text-foreground text-[15px] font-medium text-left">{{ toggle.label }}</span>
                        <span class="text-foreground-muted text-[13px] text-left">{{ toggle.description }}</span>
                    </div>
                    <div
                        class="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4"
                        :class="toggle.value ? 'bg-primary' : 'bg-foreground-muted'"
                    >
                        <div
                            class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-card-sm transition-transform duration-200"
                            :class="toggle.value ? 'translate-x-5.5' : 'translate-x-0.5'"
                        />
                    </div>
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">About</span>
            <div class="bg-card rounded-2xl px-4 shadow-card-sm">
                <div class="flex items-center justify-between py-3.5">
                    <span class="text-foreground text-[15px] font-medium">Version</span>
                    <span class="text-foreground-muted text-[15px]">{{ appVersion }}</span>
                </div>
            </div>
        </div>

        <div class="flex-1" />
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, Check } from "lucide-vue-next";
import { useSettingsStore } from "@/stores/settingsStore";
import { appVersion } from "@/utils/appVersion";
import { THEMES } from "@/theme/themeConfig";

const router = useRouter();
const settingsStore = useSettingsStore();

const toggles = computed(() => [
    {
        key: "highlightSameDigit",
        label: "Highlight Same Numbers",
        description: "Highlight matching numbers and notes when selected",
        value: settingsStore.highlightSameDigit,
        setter: settingsStore.setHighlightSameDigit,
    },
    {
        key: "completionFlash",
        label: "Completion Animation",
        description: "Flash effect when completing a row, column, or box",
        value: settingsStore.completionFlash,
        setter: settingsStore.setCompletionFlash,
    },
    {
        key: "autoRemoveNotes",
        label: "Auto-Remove Notes",
        description: "Remove notes from peers when placing a number",
        value: settingsStore.autoRemoveNotes,
        setter: settingsStore.setAutoRemoveNotes,
    },
    {
        key: "showRemainingCount",
        label: "Remaining Count",
        description: "Show remaining count on number buttons",
        value: settingsStore.showRemainingCount,
        setter: settingsStore.setShowRemainingCount,
    },
]);

const goBack = () => {
    router.back();
};
</script>
