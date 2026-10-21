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
                <span class="text-foreground text-base font-medium">{{ t("common.back") }}</span>
            </button>
            <span class="text-foreground text-lg font-semibold">{{ t("settings.title") }}</span>
            <div class="w-15" />
        </div>

        <div class="flex flex-col gap-2">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">{{ t("settings.language.label") }}</span>
            <div
                class="flex h-12 w-full bg-card rounded-button shadow-card p-1"
                data-testid="language-switcher"
            >
                <button
                    v-for="option in languageOptions"
                    :key="option.value"
                    :aria-pressed="settingsStore.language === option.value"
                    :class="settingsStore.language === option.value
                        ? 'bg-primary text-on-primary font-semibold shadow-primary-sm'
                        : 'text-foreground-secondary font-medium hover:bg-foreground/5'"
                    :data-testid="`language-${option.value}`"
                    class="flex-1 h-full rounded-icon flex items-center justify-center text-sm transition-all cursor-pointer"
                    @click="settingsStore.setLanguage(option.value)"
                >
                    {{ option.label }}
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">{{ t("settings.appearance") }}</span>
            <div class="bg-card rounded-2xl px-4 py-4 shadow-card-sm flex flex-col">
                <span class="text-foreground text-[15px] font-medium">{{ t("settings.colorTheme") }}</span>
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
                                class="text-on-primary"
                                :stroke-width="3"
                            />
                        </div>
                    </button>
                </div>

                <button
                    v-if="platform.isNative"
                    class="flex items-center justify-between pt-4 mt-4 border-t border-border cursor-pointer w-full"
                    data-testid="toggle-matchLauncherIconToTheme"
                    @click="onToggleMatchIcon"
                >
                    <div class="flex flex-col gap-0.5">
                        <span class="text-foreground text-[15px] font-medium text-left">{{ t("settings.matchLauncherIcon") }}</span>
                        <span class="text-foreground-muted text-[13px] text-left">{{ t("settings.matchLauncherIconNote") }}</span>
                    </div>
                    <div
                        class="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4"
                        :class="settingsStore.matchLauncherIconToTheme ? 'bg-primary' : 'bg-foreground-muted'"
                    >
                        <div
                            class="absolute top-0.5 w-5 h-5 bg-card rounded-full shadow-card-sm transition-transform duration-200"
                            :class="settingsStore.matchLauncherIconToTheme ? 'translate-x-5.5' : 'translate-x-0.5'"
                        />
                    </div>
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">{{ t("settings.gameplay") }}</span>
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
                            class="absolute top-0.5 w-5 h-5 bg-card rounded-full shadow-card-sm transition-transform duration-200"
                            :class="toggle.value ? 'translate-x-5.5' : 'translate-x-0.5'"
                        />
                    </div>
                </button>
            </div>
        </div>

        <div
            v-if="platform.isNative && donateStore.products.length > 0"
            class="flex flex-col gap-2"
        >
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">{{ t("settings.support") }}</span>
            <div class="bg-card rounded-2xl px-4 shadow-card-sm">
                <button
                    class="flex items-center justify-between py-3.5 cursor-pointer w-full"
                    data-testid="donate-link"
                    @click="goToDonate"
                >
                    <span class="text-foreground text-[15px] font-medium">{{ t("settings.donate") }}</span>
                    <ChevronRight
                        :size="18"
                        class="text-foreground-muted"
                    />
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">{{ t("settings.about") }}</span>
            <div class="bg-card rounded-2xl px-4 shadow-card-sm">
                <button
                    class="flex items-center justify-between py-3.5 cursor-pointer w-full"
                    data-testid="version-link"
                    @click="goToChangelog"
                >
                    <span class="text-foreground text-[15px] font-medium">{{ t("settings.version") }}</span>
                    <div class="flex items-center gap-1.5">
                        <span class="text-foreground-muted text-[15px]">{{ appVersion }}</span>
                        <ChevronRight
                            :size="18"
                            class="text-foreground-muted"
                        />
                    </div>
                </button>
            </div>
        </div>

        <div class="flex-1" />
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ChevronLeft, ChevronRight, Check } from "lucide-vue-next";
import { useSettingsStore } from "@/stores/settingsStore";
import { useDonateStore } from "@/stores/donateStore";
import { usePlatform } from "@/presentation/composables/usePlatform";
import { appVersion } from "@/utils/appVersion";
import { ROUTER_PATH } from "@/router";
import type { LanguagePreference } from "@/application/SettingsStorage";
import { THEMES } from "@/theme/themeConfig";

const { t } = useI18n();
const router = useRouter();
const settingsStore = useSettingsStore();
const platform = usePlatform();
const donateStore = useDonateStore();

// The donate entry only appears once Google Play actually returns products;
// load in the background so the page renders immediately.
onMounted(() => {
    if (platform.isNative) void donateStore.loadProducts();
});

const languageOptions = computed((): { value: LanguagePreference; label: string }[] => [
    { value: "system", label: t("settings.language.system") },
    { value: "en", label: t("settings.language.english") },
    { value: "zh-Hant", label: t("settings.language.traditionalChinese") },
]);

const toggles = computed(() => [
    {
        key: "highlightSameDigit",
        label: t("settings.toggles.highlightSameDigit.label"),
        description: t("settings.toggles.highlightSameDigit.description"),
        value: settingsStore.highlightSameDigit,
        setter: settingsStore.setHighlightSameDigit,
    },
    {
        key: "completionFlash",
        label: t("settings.toggles.completionFlash.label"),
        description: t("settings.toggles.completionFlash.description"),
        value: settingsStore.completionFlash,
        setter: settingsStore.setCompletionFlash,
    },
    {
        key: "autoRemoveNotes",
        label: t("settings.toggles.autoRemoveNotes.label"),
        description: t("settings.toggles.autoRemoveNotes.description"),
        value: settingsStore.autoRemoveNotes,
        setter: settingsStore.setAutoRemoveNotes,
    },
    {
        key: "showRemainingCount",
        label: t("settings.toggles.showRemainingCount.label"),
        description: t("settings.toggles.showRemainingCount.description"),
        value: settingsStore.showRemainingCount,
        setter: settingsStore.setShowRemainingCount,
    },
]);

const goBack = () => {
    router.back();
};

const goToChangelog = () => {
    void router.push(ROUTER_PATH.changelog);
};

const goToDonate = () => {
    void router.push(ROUTER_PATH.donate);
};

const onToggleMatchIcon = () => {
    settingsStore.setMatchLauncherIconToTheme(!settingsStore.matchLauncherIconToTheme);
};
</script>
