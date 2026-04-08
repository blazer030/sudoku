<template>
    <div class="flex flex-col gap-6 h-dvh py-6 px-5">
        <!-- Header -->
        <div class="flex items-center justify-between">
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

        <!-- Color Theme Section -->
        <div class="flex flex-col gap-3">
            <span class="text-foreground-secondary text-sm font-semibold">Color Theme</span>
            <div class="flex items-center gap-3">
                <button
                    v-for="color in colorThemes"
                    :key="color.id"
                    class="relative w-10 h-10 rounded-full cursor-pointer transition-all duration-200 overflow-hidden"
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
                            :style="{ backgroundColor: color.hex }"
                        />
                        <div
                            class="w-1/2 h-full"
                            :style="{ backgroundColor: color.accentHex }"
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

        <!-- Game Section -->
        <div class="flex flex-col gap-1">
            <span class="text-foreground-secondary text-sm font-semibold mb-2">Game</span>

            <button
                v-for="toggle in toggles"
                :key="toggle.key"
                class="flex items-center justify-between py-3 cursor-pointer"
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

        <div class="flex-1" />

        <!-- Version -->
        <span class="text-foreground-muted text-[11px] text-center">v{{ appVersion }}</span>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, Check } from "lucide-vue-next";
import { useSettingsStore } from "@/stores/settingsStore";
import { appVersion } from "@/utils/appVersion";
import type { ColorThemeId } from "@/application/SettingsStorage";

const router = useRouter();
const settingsStore = useSettingsStore();

interface ColorThemeOption {
    id: ColorThemeId;
    hex: string;
    accentHex: string;
}

const colorThemes: ColorThemeOption[] = [
    { id: "green", hex: "#3D8A5A", accentHex: "#D89575" },
    { id: "blue", hex: "#4A7AB5", accentHex: "#C49A5C" },
    { id: "purple", hex: "#7B5EA7", accentHex: "#5A9E8F" },
    { id: "orange", hex: "#C08040", accentHex: "#6888A5" },
    { id: "pink", hex: "#B5607A", accentHex: "#5A9A8A" },
    { id: "teal", hex: "#4A9A9A", accentHex: "#C07A6A" },
];

const toggles = computed(() => [
    {
        key: "highlightSameDigit",
        label: "Highlight Same Numbers",
        description: "Highlight cells with the same digit",
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
        description: "Remove notes from peers when placing a digit",
        value: settingsStore.autoRemoveNotes,
        setter: settingsStore.setAutoRemoveNotes,
    },
    {
        key: "showRemainingCount",
        label: "Remaining Count",
        description: "Show remaining count on digit buttons",
        value: settingsStore.showRemainingCount,
        setter: settingsStore.setShowRemainingCount,
    },
]);

const goBack = () => {
    router.back();
};
</script>
