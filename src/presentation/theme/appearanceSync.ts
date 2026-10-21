import { watch, type Ref } from "vue";
import { systemBarColor } from "@/theme/palettes";
import { updateMetaThemeColor } from "@/application/PwaThemeUpdater";
import type { Appearance, ColorThemeId, StyleId } from "@/application/SettingsStorage";

export interface AppearanceSources {
    appearance: Ref<Appearance>;
    style: Ref<StyleId>;
    colorTheme: Ref<ColorThemeId>;
}

/** Owns the <html> theme attributes and the theme-color meta. */
export const startAppearanceSync = (sources: AppearanceSources): (() => void) => {
    const apply = () => {
        const root = document.documentElement;
        root.dataset.style = sources.style.value;
        root.dataset.colorTheme = sources.colorTheme.value;
        updateMetaThemeColor(systemBarColor(sources.style.value, sources.colorTheme.value, "light"));
    };

    return watch([sources.appearance, sources.style, sources.colorTheme], apply, { immediate: true });
};
