import { watch, type Ref } from "vue";
import { systemBarColor } from "@/theme/palettes";
import { updateMetaThemeColor } from "@/application/PwaThemeUpdater";
import type { Appearance, ColorMode, ColorThemeId, StyleId } from "@/application/SettingsStorage";

export interface AppearanceSources {
    appearance: Ref<Appearance>;
    style: Ref<StyleId>;
    colorTheme: Ref<ColorThemeId>;
}

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

// index.html's inline script resolves the mode the same way before first paint
export const resolveColorMode = (appearance: Appearance, systemPrefersDark: boolean): ColorMode => {
    if (appearance === "system") return systemPrefersDark ? "dark" : "light";
    return appearance;
};

/** Owns the <html> theme attributes, the dark class and the theme-color meta. */
export const startAppearanceSync = (sources: AppearanceSources): (() => void) => {
    // Old WebViews and jsdom may lack matchMedia; treat them as a light system
    const darkScheme = typeof window.matchMedia === "function" ? window.matchMedia(DARK_SCHEME_QUERY) : null;

    const apply = () => {
        const mode = resolveColorMode(sources.appearance.value, darkScheme?.matches ?? false);
        const root = document.documentElement;
        root.classList.toggle("dark", mode === "dark");
        root.dataset.style = sources.style.value;
        root.dataset.colorTheme = sources.colorTheme.value;
        updateMetaThemeColor(systemBarColor(sources.style.value, sources.colorTheme.value, mode));
    };

    const stopWatching = watch([sources.appearance, sources.style, sources.colorTheme], apply, { immediate: true });
    darkScheme?.addEventListener("change", apply);

    return () => {
        stopWatching();
        darkScheme?.removeEventListener("change", apply);
    };
};
