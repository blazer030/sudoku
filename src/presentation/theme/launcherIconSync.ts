import { computed, watch, type Ref } from "vue";
import { iconThemeFor } from "@/theme/iconTheme";
import type { ColorThemeId, StyleId } from "@/application/SettingsStorage";
import type { IconService } from "@/application/icon/IconService";

export interface LauncherIconSources {
    style: Ref<StyleId>;
    colorTheme: Ref<ColorThemeId>;
    matchLauncherIconToTheme: Ref<boolean>;
}

/**
 * Asks the icon service for the launcher icon that matches the theme whenever that icon changes
 * while matching is on, and once when matching is turned on. Turning it off leaves the icon as it is.
 */
export const startLauncherIconSync = (sources: LauncherIconSources, iconService: IconService): (() => void) => {
    // Only six icons exist; any other theme shows the nearest of them
    const iconTheme = computed(() => iconThemeFor(sources.style.value, sources.colorTheme.value));

    return watch([iconTheme, sources.matchLauncherIconToTheme], ([icon, matching], [previousIcon, wasMatching]) => {
        if (!matching) return;
        if (icon !== previousIcon || !wasMatching) void iconService.setIcon(icon);
    });
};
