import { watch, type Ref } from "vue";
import { getPalette, systemBarColor } from "@/theme/palettes";
import { updateFavicon, updateMetaThemeColor } from "@/application/PwaThemeUpdater";
import { launcherIconKey } from "@/theme/launcherIcon";
import { syncPaperFonts } from "@/style/styles/paper/fonts";
import type { ColorMode, ColorThemeId, StyleId } from "@/theme/themeIds";
import type { SystemBarService } from "@/application/systemBar/SystemBarService";
import type { AppearanceBridgeService } from "@/application/appearanceBridge/AppearanceBridgeService";

export interface AppearanceSources {
    appearance: Ref<ColorMode>;
    style: Ref<StyleId>;
    colorTheme: Ref<ColorThemeId>;
}

/**
 * Owns the <html> theme attributes, the dark class, the theme-color meta, the favicon, the system bars and
 * paper's font stylesheets, and keeps the Android shell told of the appearance for its next cold start.
 */
export const startAppearanceSync = (
    sources: AppearanceSources,
    systemBar: SystemBarService,
    appearanceBridge: AppearanceBridgeService,
): (() => void) => {
    const apply = () => {
        const mode = sources.appearance.value;
        const root = document.documentElement;
        root.classList.toggle("dark", mode === "dark");
        root.dataset.style = sources.style.value;
        root.dataset.colorTheme = sources.colorTheme.value;
        syncPaperFonts(sources.style.value === "paper");
        updateMetaThemeColor(systemBarColor(sources.style.value, sources.colorTheme.value, mode));
        updateFavicon(launcherIconKey(sources.style.value, sources.colorTheme.value, mode));
        void systemBar.apply(mode);
        void appearanceBridge.setSystemBarColors({
            background: getPalette(sources.style.value, sources.colorTheme.value, mode).background,
            darkIcons: mode === "light",
        });
    };

    const stopWatching = watch([sources.appearance, sources.style, sources.colorTheme], apply, { immediate: true });
    const stopWatchingAppearance = watch(sources.appearance, (appearance) => {
        void appearanceBridge.setAppearance(appearance);
    }, { immediate: true });

    return () => {
        stopWatching();
        stopWatchingAppearance();
    };
};
