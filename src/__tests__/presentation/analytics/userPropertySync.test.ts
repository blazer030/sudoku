import { nextTick, ref } from "vue";
import { startUserPropertySync } from "@/presentation/analytics/userPropertySync";
import { createAnalyticsSpy } from "@/__tests__/fixtures/analyticsSpy";
import type { ColorMode, ColorThemeId, StyleId } from "@/theme/themeIds";

describe("startUserPropertySync", () => {
    let stop: (() => void) | undefined;
    let analytics: ReturnType<typeof createAnalyticsSpy>;

    const createSources = (overrides: { style?: StyleId; appearance?: ColorMode } = {}) => ({
        style: ref<StyleId>(overrides.style ?? "minimal"),
        colorTheme: ref<ColorThemeId>("green"),
        appearance: ref<ColorMode>(overrides.appearance ?? "light"),
        matchLauncherIconToTheme: ref(false),
        locale: ref("en"),
    });

    const start = (sources = createSources(), reportsIconSetting = true) => {
        stop = startUserPropertySync(sources, analytics, { reportsIconSetting });
        return sources;
    };

    beforeEach(() => {
        analytics = createAnalyticsSpy();
    });

    afterEach(() => {
        stop?.();
        stop = undefined;
    });

    it("should set every property on start", () => {
        start();

        expect(analytics.setUserProperty).toHaveBeenCalledWith("style", "minimal");
        expect(analytics.setUserProperty).toHaveBeenCalledWith("color_theme", "green");
        expect(analytics.setUserProperty).toHaveBeenCalledWith("color_mode", "light");
        expect(analytics.setUserProperty).toHaveBeenCalledWith("language", "en");
        expect(analytics.setUserProperty).toHaveBeenCalledWith("icon_follows_theme", "false");
        expect(analytics.setUserProperty).toHaveBeenCalledTimes(5);
    });

    it("should report the icon setting as true when matching is on", () => {
        const sources = createSources();
        sources.matchLauncherIconToTheme.value = true;

        start(sources);

        expect(analytics.setUserProperty).toHaveBeenCalledWith("icon_follows_theme", "true");
    });

    it("should never set the icon setting when it is not reported", () => {
        const sources = start(createSources(), false);
        sources.matchLauncherIconToTheme.value = true;

        expect(analytics.setUserProperty).not.toHaveBeenCalledWith("icon_follows_theme", expect.anything());
    });

    it("should report the effective color mode of a light-only style", () => {
        start(createSources({ style: "paper", appearance: "dark" }));

        expect(analytics.setUserProperty).toHaveBeenCalledWith("color_mode", "light");
    });

    it("should set only the color theme when it changes", async () => {
        const sources = start();
        analytics.setUserProperty.mockClear();

        sources.colorTheme.value = "blue";
        await nextTick();

        expect(analytics.setUserProperty).toHaveBeenCalledExactlyOnceWith("color_theme", "blue");
    });

    it("should set nothing when the appearance changes but the effective mode does not", async () => {
        const sources = start(createSources({ style: "paper" }));
        analytics.setUserProperty.mockClear();

        sources.appearance.value = "dark";
        await nextTick();

        expect(analytics.setUserProperty).not.toHaveBeenCalled();
    });

    it("should set the language when the locale changes", async () => {
        const sources = start();
        analytics.setUserProperty.mockClear();

        sources.locale.value = "zh-Hant";
        await nextTick();

        expect(analytics.setUserProperty).toHaveBeenCalledExactlyOnceWith("language", "zh-Hant");
    });

    it("should set nothing after stopping", async () => {
        const sources = start();
        analytics.setUserProperty.mockClear();

        stop?.();
        sources.colorTheme.value = "blue";
        sources.locale.value = "zh-Hant";
        await nextTick();

        expect(analytics.setUserProperty).not.toHaveBeenCalled();
    });
});
