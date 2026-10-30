import { watch, type Ref } from "vue";
import { getPalette, systemBarColor } from "@/theme/palettes";
import { updateFavicon, updateMetaThemeColor } from "@/application/PwaThemeUpdater";
import { launcherIconKey } from "@/theme/launcherIcon";
import { syncPaperFonts } from "@/style/styles/paper/fonts";
import { syncCyberFonts } from "@/style/styles/cyber/fonts";
import { syncPixelFonts } from "@/style/styles/pixel/fonts";
import { syncInkFonts } from "@/style/styles/ink/fonts";
import { syncChalkboardFonts } from "@/style/styles/chalkboard/fonts";
import { syncBlueprintFonts } from "@/style/styles/blueprint/fonts";
import { syncAuroraFonts } from "@/style/styles/aurora/fonts";
import { effectiveColorMode, type ColorMode, type ColorThemeId, type StyleId } from "@/theme/themeIds";
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
        const mode = effectiveColorMode(sources.style.value, sources.appearance.value);
        const root = document.documentElement;
        root.classList.toggle("dark", mode === "dark");
        root.dataset.style = sources.style.value;
        root.dataset.colorTheme = sources.colorTheme.value;
        syncPaperFonts(sources.style.value === "paper");
        syncPixelFonts(sources.style.value === "pixel");
        syncCyberFonts(sources.style.value === "cyber");
        syncInkFonts(sources.style.value === "ink");
        syncChalkboardFonts(sources.style.value === "chalkboard");
        syncBlueprintFonts(sources.style.value === "blueprint");
        syncAuroraFonts(sources.style.value === "aurora");
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
