import { watch, type Ref } from "vue";
import { getPalette, systemBarColor } from "@/theme/palettes";
import { updateFavicon, updateMetaThemeColor } from "@/application/PwaThemeUpdater";
import { launcherIconKey } from "@/theme/launcherIcon";
import { syncPaperFonts } from "@/style/styles/paper/fonts";
import type { Appearance, ColorMode, ColorThemeId, StyleId } from "@/application/SettingsStorage";
import type { SystemBarService } from "@/application/systemBar/SystemBarService";
import type { AppearanceBridgeService } from "@/application/appearanceBridge/AppearanceBridgeService";

export interface AppearanceSources {
    appearance: Ref<Appearance>;
    style: Ref<StyleId>;
    colorTheme: Ref<ColorThemeId>;
}

export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

// index.html's inline script resolves the mode the same way before first paint
export const resolveColorMode = (appearance: Appearance, systemPrefersDark: boolean): ColorMode => {
    if (appearance === "system") return systemPrefersDark ? "dark" : "light";
    return appearance;
};

// Older WebViews only offer the deprecated addListener / removeListener pair
export const listenForChanges = (query: MediaQueryList, listener: () => void): (() => void) => {
    if (typeof query.addEventListener === "function") {
        query.addEventListener("change", listener);
        return () => { query.removeEventListener("change", listener); };
    }
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the only API those WebViews have
    query.addListener(listener);
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- pairs with addListener above
    return () => { query.removeListener(listener); };
};

/**
 * Owns the <html> theme attributes, the dark class, the theme-color meta, the favicon, the system bars and
 * paper's font stylesheets, and keeps the Android shell told of the appearance for its next cold start.
 */
export const startAppearanceSync = (
    sources: AppearanceSources,
    systemBar: SystemBarService,
    appearanceBridge: AppearanceBridgeService,
): (() => void) => {
    // Old WebViews and jsdom may lack matchMedia; treat them as a light system
    const darkScheme = typeof window.matchMedia === "function" ? window.matchMedia(DARK_SCHEME_QUERY) : null;

    const apply = () => {
        const mode = resolveColorMode(sources.appearance.value, darkScheme?.matches ?? false);
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
    const stopListening = darkScheme === null ? () => undefined : listenForChanges(darkScheme, apply);

    return () => {
        stopWatching();
        stopWatchingAppearance();
        stopListening();
    };
};
