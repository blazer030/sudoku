import { computed, watch, type Ref } from "vue";
import { effectiveColorMode, type ColorMode, type ColorThemeId, type StyleId } from "@/theme/themeIds";
import type { AnalyticsService, UserPropertyName } from "@/application/analytics/AnalyticsService";

export interface UserPropertySources {
    style: Ref<StyleId>;
    colorTheme: Ref<ColorThemeId>;
    appearance: Ref<ColorMode>;
    matchLauncherIconToTheme: Ref<boolean>;
    locale: Ref<string>;
}

/**
 * Describes the player's setup as analytics user properties: all of them on start, then each one
 * again only when its own value really changes. The icon setting is reported only where the
 * launcher icon can be changed.
 */
export const startUserPropertySync = (
    sources: UserPropertySources,
    analytics: AnalyticsService,
    options: { reportsIconSetting: boolean },
): (() => void) => {
    const colorMode = computed(() => effectiveColorMode(sources.style.value, sources.appearance.value));
    const iconFollowsTheme = computed(() => String(sources.matchLauncherIconToTheme.value));

    const report = (name: UserPropertyName, value: () => string) =>
        watch(value, (current) => {
            void analytics.setUserProperty(name, current);
        }, { immediate: true });

    const stoppers = [
        report("style", () => sources.style.value),
        report("color_theme", () => sources.colorTheme.value),
        report("color_mode", () => colorMode.value),
        report("language", () => sources.locale.value),
    ];
    if (options.reportsIconSetting) stoppers.push(report("icon_follows_theme", () => iconFollowsTheme.value));

    return () => {
        for (const stopWatching of stoppers) stopWatching();
    };
};
