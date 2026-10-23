<template>
    <div
        class="flex flex-col gap-5 h-full px-5 pb-6 bg-background overflow-y-auto"
        data-skin="page page-ruled"
    >
        <PageHeader
            :title="t('settings.title')"
            @back="goBack"
        />

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
            <button
                v-press:tint
                class="flex items-center gap-3 -my-1 py-2 px-1 cursor-pointer w-full text-left"
                data-testid="appearance-row"
                type="button"
                @click="goToAppearance"
            >
                <StyleIcon
                    :palette="currentPalette"
                    :size="40"
                    :style-id="settingsStore.style"
                    decorative
                />
                <span class="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span class="text-foreground text-[15px] font-medium">{{ t(`settings.style.names.${settingsStore.style}`) }}</span>
                    <span
                        class="text-foreground-muted text-[13px]"
                        data-testid="appearance-summary"
                    >{{ appearanceSummary }}</span>
                </span>
                <ChevronRight
                    :size="18"
                    class="shrink-0 text-foreground-muted"
                />
            </button>
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
import { ChevronRight, Crosshair, Database, Eraser, ExternalLink, Gamepad2, Hash, Highlighter, Info, Languages, Palette, Sparkles, Trash2 } from "lucide-vue-next";
import { useSettingsStore } from "@/stores/settingsStore";
import { useDonateStore } from "@/stores/donateStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { usePlatform } from "@/presentation/composables/usePlatform";
import { appVersion } from "@/utils/appVersion";
import { PRIVACY_POLICY_URL } from "@/presentation/pages/settings/externalLinks";
import { ROUTER_PATH } from "@/router";
import { STYLE_COLOR_MODES, effectiveColorMode } from "@/theme/themeIds";
import { useColorModeLabel } from "@/presentation/i18n/colorModeLabels";
import type { LanguagePreference } from "@/application/settings/SettingsStorage";
import { STYLES, getPalette } from "@/theme/palettes";
import { vPress } from "@/presentation/directives/press";
import PageHeader from "@/presentation/components/page-header/PageHeader.vue";
import SegmentedControl from "@/presentation/components/segmented-control/SegmentedControl.vue";
import OptionTile from "@/presentation/components/option-tile/OptionTile.vue";
import SettingsGroup from "@/presentation/pages/settings/components/SettingsGroup.vue";
import StyleIcon from "@/presentation/components/style-icon/StyleIcon.vue";
import ClearRecordsDialog from "@/presentation/pages/settings/components/ClearRecordsDialog.vue";
import { provideClearRecordsDialog } from "@/presentation/pages/settings/components/useClearRecordsDialog";

const { t } = useI18n();
const router = useRouter();
const settingsStore = useSettingsStore();
const colorModeLabel = useColorModeLabel();
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

// The style's icon as the launcher would show it, and 「<mode>・<theme>」, or just the theme when the style has one mode
const currentPalette = computed(() => getPalette(settingsStore.style, settingsStore.colorTheme, settingsStore.appearance));

const appearanceSummary = computed(() => {
    const hasThemes = STYLES[settingsStore.style].themes.length > 1;
    const hasModes = STYLE_COLOR_MODES[settingsStore.style].length > 1;
    const theme = t(`settings.colorThemes.${settingsStore.colorTheme}`);
    const mode = colorModeLabel(settingsStore.style, effectiveColorMode(settingsStore.style, settingsStore.appearance));
    if (hasThemes && hasModes) return t("settings.appearanceSummary", { mode, theme });
    if (hasThemes) return theme;
    if (hasModes) return mode;
    return t(`settings.style.names.${settingsStore.style}`);
});

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

const goToAppearance = () => {
    void router.push(ROUTER_PATH.appearance);
};

const goToDonate = () => {
    void router.push(ROUTER_PATH.donate);
};
</script>
