import { watch, type Ref } from "vue";
import { getPalette, systemBarColor } from "@/theme/palettes";
import { updateFavicon, updateMetaThemeColor } from "@/application/pwaTheme/PwaThemeUpdater";
import { launcherIconKey } from "@/theme/launcherIcon";
import { syncStyleFonts } from "@/style/fontGates";
import { selectIconStyle } from "@/presentation/components/icon/activeIconSet";
import { effectiveColorMode, type ColorMode, type ColorThemeId, type StyleId } from "@/theme/themeIds";
import type { SystemBarService } from "@/application/systemBar/SystemBarService";
import type { AppearanceBridgeService } from "@/application/appearanceBridge/AppearanceBridgeService";

export interface AppearanceSources {
    appearance: Ref<ColorMode>;
    style: Ref<StyleId>;
    colorTheme: Ref<ColorThemeId>;
}

/**
 * Owns the <html> theme attributes, the dark class, the theme-color meta, the favicon, the system bars,
 * each style's font gate and the icons' set, and keeps the Android shell told of the appearance for its next cold start.
 */
export const startAppearanceSync = (
    sources: AppearanceSources,
    systemBar: SystemBarService,
    appearanceBridge: AppearanceBridgeService,
): (() => void) => {
    const apply = () => {
        const mode = effectiveColorMode(sources.style.value, sources.appearance.value);
        const root = document.documentElement;
        root.classList.toggle("dark", mode === "dark");
        root.dataset.style = sources.style.value;
        root.dataset.colorTheme = sources.colorTheme.value;
        syncStyleFonts(sources.style.value);
        void selectIconStyle(sources.style.value);
        updateMetaThemeColor(systemBarColor(sources.style.value, sources.colorTheme.value, mode));
        updateFavicon(launcherIconKey(sources.style.value, sources.colorTheme.value, mode));
        void systemBar.apply(mode);
        void appearanceBridge.setSystemBarColors({
            background: getPalette(sources.style.value, sources.colorTheme.value, mode).background,
            darkIcons: mode === "light",
        });
    };

    const stopWatching = watch([sources.appearance, sources.style, sources.colorTheme], apply, { immediate: true });
    const stopWatchingAppearance = watch(
        () => effectiveColorMode(sources.style.value, sources.appearance.value),
        (mode) => { void appearanceBridge.setAppearance(mode); },
        { immediate: true },
    );

    return () => {
        stopWatching();
        stopWatchingAppearance();
    };
};
