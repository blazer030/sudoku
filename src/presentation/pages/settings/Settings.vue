<template>
    <div class="flex flex-col gap-5 h-full px-5 bg-background overflow-y-auto">
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

        <SettingsGroup
            id="gameplay"
            :icon="Gamepad2"
            :title="t('settings.gameplay')"
        >
            <div class="grid grid-cols-2 gap-2">
                <OptionTile
                    v-for="toggle in toggles"
                    :key="toggle.key"
                    :class="{ 'col-span-2': toggle.wide }"
                    :data-testid="`toggle-${toggle.key}`"
                    :description="toggle.description"
                    :icon="toggle.icon"
                    :label="toggle.label"
                    :pressed="toggle.value"
                    :wide="toggle.wide"
                    @toggle="toggle.setter(!toggle.value)"
                />
            </div>
        </SettingsGroup>

        <SettingsGroup
            id="appearance"
            :icon="Palette"
            :title="t('settings.appearance')"
        >
            <span class="text-foreground text-[15px] font-medium">{{ t("settings.style.label") }}</span>
            <div class="grid grid-cols-3 gap-2 mt-3">
                <button
                    v-for="styleId in STYLE_IDS"
                    :key="styleId"
                    v-press
                    :aria-pressed="styleId === settingsStore.style"
                    :class="styleId === settingsStore.style ? 'border-primary' : 'border-border'"
                    :data-testid="`style-option-${styleId}`"
                    class="flex flex-col items-center gap-1.5 p-1.5 rounded-xl border-2 bg-card cursor-pointer"
                    type="button"
                    @click="settingsStore.setStyle(styleId)"
                >
                    <!-- Thumbnails stand for the style, not the current mode, so they always use the light palette -->
                    <StyleThumbnail :palette="getPalette(styleId, rememberedThemeFor(styleId, settingsStore.colorThemeByStyle), 'light')" />
                    <span class="text-foreground text-xs font-medium text-center">{{ t(`settings.style.names.${styleId}`) }}</span>
                </button>
            </div>

            <span class="text-foreground text-[15px] font-medium mt-5">{{ t("settings.colorTheme") }}</span>
            <div class="grid grid-cols-6 gap-3 mt-3 justify-items-center">
                <button
                    v-for="swatch in swatches"
                    :key="swatch.id"
                    v-press
                    :aria-label="t(`settings.colorThemes.${swatch.id}`)"
                    :aria-pressed="swatch.id === settingsStore.colorTheme"
                    :class="swatch.id === settingsStore.colorTheme ? 'ring-2 ring-offset-2 ring-offset-card ring-primary' : ''"
                    :data-testid="`color-theme-${swatch.id}`"
                    class="relative aspect-square w-full max-w-15 rounded-full cursor-pointer overflow-hidden"
                    type="button"
                    @click="settingsStore.setColorTheme(swatch.id)"
                >
                    <div class="absolute inset-0 flex">
                        <div
                            :style="{ backgroundColor: swatch.palette.primary }"
                            class="w-1/2 h-full"
                        />
                        <div
                            :style="{ backgroundColor: swatch.palette.accent }"
                            class="w-1/2 h-full"
                        />
                    </div>
                    <div
                        v-if="swatch.id === settingsStore.colorTheme"
                        :style="{ color: swatch.palette['on-primary'] }"
                        class="absolute inset-0 flex items-center justify-center"
                        data-testid="color-theme-check"
                    >
                        <Check
                            :size="18"
                            :stroke-width="3"
                        />
                    </div>
                </button>
            </div>

            <span class="text-foreground text-[15px] font-medium mt-5">{{ t("settings.colorMode.label") }}</span>
            <SegmentedControl
                :model-value="settingsStore.appearance"
                :options="appearanceOptions"
                class="mt-3"
                data-testid="appearance-switcher"
                inset
                test-id-prefix="appearance"
                @update:model-value="settingsStore.setAppearance"
            />

            <OptionTile
                v-if="platform.isNative"
                :description="t('settings.matchLauncherIconNote')"
                :icon="Smartphone"
                :label="t('settings.matchLauncherIcon')"
                :pressed="settingsStore.matchLauncherIconToTheme"
                class="mt-5"
                data-testid="toggle-matchLauncherIconToTheme"
                wide
                @toggle="onToggleMatchIcon"
            />
        </SettingsGroup>

        <SettingsGroup
            id="language"
            :icon="Languages"
            :title="t('settings.language.label')"
        >
            <SegmentedControl
                :model-value="settingsStore.language"
                :options="languageOptions"
                inset
                data-testid="language-switcher"
                test-id-prefix="language"
                @update:model-value="settingsStore.setLanguage"
            />
        </SettingsGroup>

        <SettingsGroup
            id="data"
            :icon="Database"
            :title="t('settings.groups.data')"
        >
            <button
                v-press
                :disabled="!hasRecords"
                class="flex items-center justify-center gap-2 w-full h-11 rounded-button text-danger disabled:text-foreground-muted cursor-pointer disabled:cursor-default"
                data-testid="clear-records-button"
                type="button"
                @click="handleClearRecords"
            >
                <Trash2 :size="18" />
                <span class="text-[15px] font-semibold">{{ t("settings.data.clearRecords") }}</span>
            </button>
        </SettingsGroup>

        <SettingsGroup
            id="about"
            :icon="Info"
            :title="t('settings.about')"
        >
            <div class="flex flex-col divide-y divide-border -my-1">
                <button
                    v-press:tint
                    class="flex items-center justify-between h-13 px-1 cursor-pointer w-full"
                    data-testid="version-link"
                    type="button"
                    @click="goToChangelog"
                >
                    <span class="text-foreground text-[15px] font-medium">{{ t("settings.version") }}</span>
                    <span class="flex items-center gap-1.5">
                        <span class="text-foreground-muted text-[15px]">{{ appVersion }}</span>
                        <ChevronRight
                            :size="18"
                            class="text-foreground-muted"
                        />
                    </span>
                </button>
                <!-- Capacitor hands off-host navigation to the system browser, so no plugin is needed -->
                <a
                    v-press:tint
                    :href="PRIVACY_POLICY_URL"
                    class="flex items-center justify-between h-13 px-1 w-full"
                    data-testid="privacy-policy-link"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <span class="text-foreground text-[15px] font-medium">{{ t("settings.privacyPolicy") }}</span>
                    <ExternalLink
                        :size="18"
                        class="text-foreground-muted"
                    />
                </a>
                <button
                    v-if="platform.isNative && donateStore.products.length > 0"
                    v-press:tint
                    class="flex items-center justify-between h-13 px-1 cursor-pointer w-full"
                    data-testid="donate-link"
                    type="button"
                    @click="goToDonate"
                >
                    <span class="text-foreground text-[15px] font-medium">{{ t("settings.donate") }}</span>
                    <ChevronRight
                        :size="18"
                        class="text-foreground-muted"
                    />
                </button>
            </div>
        </SettingsGroup>

        <div class="flex-1" />

        <ClearRecordsDialog />
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ChevronLeft, ChevronRight, Check, Crosshair, Database, Eraser, ExternalLink, Gamepad2, Hash, Highlighter, Info, Languages, Palette, Smartphone, Sparkles, Trash2 } from "lucide-vue-next";
import { useSettingsStore } from "@/stores/settingsStore";
import { useDonateStore } from "@/stores/donateStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { usePlatform } from "@/presentation/composables/usePlatform";
import { appVersion } from "@/utils/appVersion";
import { PRIVACY_POLICY_URL } from "@/presentation/pages/settings/externalLinks";
import { ROUTER_PATH } from "@/router";
import { STYLE_IDS, type Appearance, type LanguagePreference } from "@/application/SettingsStorage";
import { STYLES, getPalette, rememberedThemeFor } from "@/theme/palettes";
import { vPress } from "@/presentation/directives/press";
import SegmentedControl from "@/presentation/components/segmented-control/SegmentedControl.vue";
import OptionTile from "@/presentation/components/option-tile/OptionTile.vue";
import SettingsGroup from "@/presentation/pages/settings/components/SettingsGroup.vue";
import StyleThumbnail from "@/presentation/pages/settings/components/StyleThumbnail.vue";
import ClearRecordsDialog from "@/presentation/pages/settings/components/ClearRecordsDialog.vue";
import { provideClearRecordsDialog } from "@/presentation/pages/settings/components/useClearRecordsDialog";

const { t } = useI18n();
const router = useRouter();
const settingsStore = useSettingsStore();
const platform = usePlatform();
const donateStore = useDonateStore();
const statisticsStore = useStatisticsStore();
const { open: openClearRecordsDialog } = provideClearRecordsDialog();

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

const appearanceOptions = computed((): { value: Appearance; label: string }[] => [
    { value: "system", label: t("settings.colorMode.system") },
    { value: "light", label: t("settings.colorMode.light") },
    { value: "dark", label: t("settings.colorMode.dark") },
]);

// The current style's own themes; swatches show their light colours in every mode
const swatches = computed(() => STYLES[settingsStore.style].themes.map(theme => ({
    id: theme.id,
    palette: getPalette(settingsStore.style, theme.id, "light"),
})));

const toggles = computed(() => [
    {
        key: "highlightSameDigit",
        icon: Highlighter,
        value: settingsStore.highlightSameDigit,
        setter: settingsStore.setHighlightSameDigit,
    },
    {
        key: "highlightScope",
        icon: Crosshair,
        value: settingsStore.highlightScope,
        setter: settingsStore.setHighlightScope,
    },
    {
        key: "completionFlash",
        icon: Sparkles,
        value: settingsStore.completionFlash,
        setter: settingsStore.setCompletionFlash,
    },
    {
        key: "autoRemoveNotes",
        icon: Eraser,
        value: settingsStore.autoRemoveNotes,
        setter: settingsStore.setAutoRemoveNotes,
    },
    {
        key: "showRemainingCount",
        icon: Hash,
        value: settingsStore.showRemainingCount,
        setter: settingsStore.setShowRemainingCount,
    },
].map((toggle, position, all) => ({
    ...toggle,
    label: t(`settings.toggles.${toggle.key}.label`),
    description: t(`settings.toggles.${toggle.key}.description`),
    // An odd last tile spans both columns of the grid
    wide: all.length % 2 === 1 && position === all.length - 1,
})));

const hasRecords = computed(() => statisticsStore.statistics.overall.gamesPlayed > 0);

const handleClearRecords = async () => {
    const result = await openClearRecordsDialog();
    if (result === "confirm") {
        void statisticsStore.clearAll();
    }
};

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
