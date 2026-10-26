import { computed, watch, type Ref } from "vue";
import { launcherIconKey } from "@/theme/launcherIcon";
import { effectiveColorMode, type ColorMode, type ColorThemeId, type StyleId } from "@/theme/themeIds";
import type { IconService } from "@/application/icon/IconService";

export interface LauncherIconSources {
    style: Ref<StyleId>;
    colorTheme: Ref<ColorThemeId>;
    appearance: Ref<ColorMode>;
    matchLauncherIconToTheme: Ref<boolean>;
}

/**
 * While matching is on, asks the icon service for the current theme's icon in the light or dark the
 * app shows: on start (the mode may have changed while the app was closed), whenever that icon
 * changes, and when matching is turned on. While matching is off the app keeps its own icon: asked
 * for on start (a player may still sit on a theme's icon) and when matching is turned off.
 */
export const startLauncherIconSync = (sources: LauncherIconSources, iconService: IconService): (() => void) => {
    const icon = computed(() => launcherIconKey(
        sources.style.value,
        sources.colorTheme.value,
        effectiveColorMode(sources.style.value, sources.appearance.value),
    ));

    // On the immediate first run the previous values are undefined
    const stopWatching = watch([icon, sources.matchLauncherIconToTheme], ([key, matching], [previousKey, wasMatching]) => {
        if (!matching) {
            if (wasMatching !== false) void iconService.resetIcon();
            return;
        }
        if (key !== previousKey || wasMatching !== true) void iconService.setIcon(key);
    }, { immediate: true });

    return () => {
        stopWatching();
    };
};
