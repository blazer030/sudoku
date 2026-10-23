<template>
    <div
        class="flex flex-col gap-5 h-full px-5 pb-6 bg-background overflow-y-auto"
        data-skin="page"
    >
        <PageHeader
            :title="t('settings.appearance')"
            @back="goBack"
        />

        <!-- Every choice applies at once: there is no apply button -->
        <div
            class="flex flex-col bg-card rounded-2xl shadow-card-sm p-3"
            data-skin="card"
        >
            <span class="text-foreground text-[15px] font-medium">{{ t("settings.style.label") }}</span>
            <div class="grid grid-cols-3 gap-2 mt-3">
                <button
                    v-for="card in styleCards"
                    :key="card.id"
                    v-press
                    data-skin="tile"
                    :aria-pressed="card.id === settingsStore.style"
                    :class="card.id === settingsStore.style ? 'border-primary' : 'border-border'"
                    :data-testid="`style-option-${card.id}`"
                    class="flex flex-col items-center gap-2 px-1.5 pt-3 pb-2.5 rounded-xl border-2 bg-card cursor-pointer"
                    type="button"
                    @click="onSelectStyle(card.id)"
                >
                    <StyleIcon
                        :palette="card.palette"
                        :size="56"
                        :style-id="card.id"
                        decorative
                    />
                    <span class="text-foreground text-xs font-medium text-center">{{ t(`settings.style.names.${card.id}`) }}</span>
                </button>
            </div>

            <!-- A style with one theme has nothing to choose -->
            <span
                v-if="swatches.length > 1"
                class="text-foreground text-[15px] font-medium mt-5"
                data-testid="appearance-theme-label"
            >{{ t("settings.colorTheme") }}</span>
            <div
                v-if="swatches.length > 1"
                class="grid grid-cols-6 gap-3 mt-3 justify-items-center"
            >
                <button
                    v-for="swatch in swatches"
                    :key="swatch.id"
                    v-press
                    :aria-label="t(`settings.colorThemes.${swatch.id}`)"
                    :aria-pressed="swatch.id === settingsStore.colorTheme"
                    :class="swatch.id === settingsStore.colorTheme ? 'ring-2 ring-offset-2 ring-offset-card ring-primary' : ''"
                    :data-testid="`color-theme-${swatch.id}`"
                    :style="{ backgroundColor: swatch.palette.primary }"
                    class="relative aspect-square w-full max-w-15 rounded-full cursor-pointer overflow-hidden"
                    type="button"
                    @click="onSelectColorTheme(swatch.id)"
                >
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

            <!-- A one-mode style has nothing to choose; the stored mode is kept for the next style that has both -->
            <template v-if="modeOptions.length > 1">
                <span
                    class="text-foreground text-[15px] font-medium mt-5"
                    data-testid="appearance-mode-label"
                >{{ t("settings.colorMode.label") }}</span>
                <SegmentedControl
                    :model-value="settingsStore.appearance"
                    :options="modeOptions"
                    class="mt-3"
                    data-testid="appearance-switcher"
                    inset
                    test-id-prefix="appearance"
                    @update:model-value="settingsStore.setAppearance"
                />
            </template>

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
        </div>

        <div class="flex-1" />
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Check, Smartphone } from "lucide-vue-next";
import { useSettingsStore } from "@/stores/settingsStore";
import { usePlatform } from "@/presentation/composables/usePlatform";
import { STYLE_COLOR_MODES, STYLE_IDS, type ColorMode, type ColorThemeId, type StyleId } from "@/theme/themeIds";
import { STYLES, getPalette, rememberedThemeFor } from "@/theme/palettes";
import { useColorModeLabel } from "@/presentation/i18n/colorModeLabels";
import { vPress } from "@/presentation/directives/press";
import PageHeader from "@/presentation/components/page-header/PageHeader.vue";
import SegmentedControl from "@/presentation/components/segmented-control/SegmentedControl.vue";
import OptionTile from "@/presentation/components/option-tile/OptionTile.vue";
import StyleIcon from "@/presentation/components/style-icon/StyleIcon.vue";

const { t } = useI18n();
const router = useRouter();
const settingsStore = useSettingsStore();
const platform = usePlatform();
const colorModeLabel = useColorModeLabel();

// Each card shows the style's app icon in the theme it would come back to, in the current mode
const styleCards = computed(() => STYLE_IDS.map(styleId => ({
    id: styleId,
    palette: getPalette(styleId, rememberedThemeFor(styleId, settingsStore.colorThemeByStyle), settingsStore.appearance),
})));

// The current style's own themes, each a solid circle of the primary the app would show in the current mode
const swatches = computed(() => STYLES[settingsStore.style].themes.map(theme => ({
    id: theme.id,
    palette: getPalette(settingsStore.style, theme.id, settingsStore.appearance),
})));

const modeOptions = computed((): { value: ColorMode; label: string }[] =>
    STYLE_COLOR_MODES[settingsStore.style].map(mode => ({ value: mode, label: colorModeLabel(settingsStore.style, mode) })));

const goBack = () => {
    router.back();
};

// Re-selecting the current choice must not re-run side effects such as the launcher-icon change
const onSelectStyle = (styleId: StyleId) => {
    if (styleId === settingsStore.style) return;
    settingsStore.setStyle(styleId);
};

const onSelectColorTheme = (themeId: ColorThemeId) => {
    if (themeId === settingsStore.colorTheme) return;
    settingsStore.setColorTheme(themeId);
};

const onToggleMatchIcon = () => {
    settingsStore.setMatchLauncherIconToTheme(!settingsStore.matchLauncherIconToTheme);
};
</script>
