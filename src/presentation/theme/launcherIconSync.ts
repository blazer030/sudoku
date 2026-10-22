import { computed, watch, type Ref } from "vue";
import { launcherIconKey } from "@/theme/launcherIcon";
import { resolveColorMode } from "@/presentation/theme/appearanceSync";
import { watchSystemDark } from "@/presentation/theme/useColorMode";
import type { Appearance, ColorThemeId, StyleId } from "@/application/SettingsStorage";
import type { IconService } from "@/application/icon/IconService";

export interface LauncherIconSources {
    style: Ref<StyleId>;
    colorTheme: Ref<ColorThemeId>;
    appearance: Ref<Appearance>;
    matchLauncherIconToTheme: Ref<boolean>;
}

/**
 * While matching is on, asks the icon service for the current theme's icon in the light or dark the
 * app shows: on start (the mode may have changed while the app was closed), whenever that icon
 * changes, and when matching is turned on. Turning matching off leaves the icon as it is.
 */
export const startLauncherIconSync = (sources: LauncherIconSources, iconService: IconService): (() => void) => {
    const { systemPrefersDark, stop: stopWatchingSystem } = watchSystemDark();
    const icon = computed(() => launcherIconKey(
        sources.style.value,
        sources.colorTheme.value,
        resolveColorMode(sources.appearance.value, systemPrefersDark.value),
    ));

    // On the immediate first run the previous values are undefined
    const stopWatching = watch([icon, sources.matchLauncherIconToTheme], ([key, matching], [previousKey, wasMatching]) => {
        if (!matching) return;
        if (key !== previousKey || wasMatching !== true) void iconService.setIcon(key);
    }, { immediate: true });

    return () => {
        stopWatching();
        stopWatchingSystem();
    };
};
