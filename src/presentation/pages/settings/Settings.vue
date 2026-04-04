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

        <!-- Theme Section -->
        <div class="flex flex-col gap-3">
            <span class="text-foreground-secondary text-sm font-semibold">Theme</span>
            <div class="flex flex-col gap-3">
                <button
                    v-for="option in themeOptions"
                    :key="option.id"
                    class="flex items-center gap-2 rounded-2xl p-1 cursor-pointer"
                    :class="[
                        option.id === settingsStore.theme
                            ? 'ring-2 ring-primary shadow-card'
                            : 'ring-1 ring-border',
                        'bg-card',
                    ]"
                    :data-testid="`theme-${option.id}`"
                    @click="settingsStore.setTheme(option.id)"
                >
                    <img
                        :alt="option.name"
                        :src="option.thumbnail"
                        class="w-[90px] h-28 rounded-xl object-cover"
                    >
                    <div class="flex flex-col gap-1 flex-1 py-3 px-4">
                        <span class="text-foreground text-base font-semibold text-left">{{ option.name }}</span>
                        <span class="text-foreground-secondary text-[13px] text-left">{{ option.description }}</span>
                    </div>
                    <div
                        v-if="option.id === settingsStore.theme"
                        class="flex items-center justify-center w-10 h-full"
                    >
                        <div class="flex items-center justify-center w-6 h-6 rounded-xl bg-primary">
                            <Check
                                :size="14"
                                class="text-white"
                                :stroke-width="3"
                            />
                        </div>
                    </div>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import { ChevronLeft, Check } from "lucide-vue-next";
import { useSettingsStore } from "@/stores/settingsStore";
import type { ThemeId } from "@/application/SettingsStorage";

const router = useRouter();
const settingsStore = useSettingsStore();

const baseUrl = (import.meta.env.VITE_BASE_URL as string | undefined) ?? "/";

interface ThemeOption {
    id: ThemeId;
    name: string;
    description: string;
    thumbnail: string;
}

const themeOptions: ThemeOption[] = [
    {
        id: "classic",
        name: "Classic",
        description: "Pure, focused, and timeless.",
        thumbnail: `${baseUrl}theme-classic.png`,
    },
    {
        id: "gbc",
        name: "Game Boy Color",
        description: "Suddenly, it's 1998 again.",
        thumbnail: `${baseUrl}theme-gbc.png`,
    },
];

const goBack = () => {
    router.back();
};
</script>
