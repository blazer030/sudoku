import { ref } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { createAnalyticsSpy } from "@/__tests__/fixtures/analyticsSpy";
import { ROUTER_PATH } from "@/router";
import { startAnalyticsReporting } from "@/presentation/analytics/analyticsReporting";
import type { ColorMode, ColorThemeId, StyleId } from "@/theme/themeIds";

const createTestRouter = () => {
    const stub = { render: () => null };
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: ROUTER_PATH.home, component: stub },
            { path: ROUTER_PATH.settings, component: stub },
        ],
    });
};

const createSources = () => ({
    style: ref<StyleId>("minimal"),
    colorTheme: ref<ColorThemeId>("green"),
    appearance: ref<ColorMode>("dark"),
    matchLauncherIconToTheme: ref(false),
    locale: ref("zh-Hant"),
});

// GA attaches the user properties set so far to each event, so every property must be set before the
// first screen view leaves
const firstScreenFollowsEveryProperty = (analytics: ReturnType<typeof createAnalyticsSpy>) => {
    const firstScreen = Math.min(...analytics.setScreen.mock.invocationCallOrder);
    const lastProperty = Math.max(...analytics.setUserProperty.mock.invocationCallOrder);
    return lastProperty < firstScreen;
};

describe("startAnalyticsReporting", () => {
    let stop: (() => void) | undefined;

    afterEach(() => {
        stop?.();
        stop = undefined;
    });

    it("should set every user property before the first screen view", async () => {
        const analytics = createAnalyticsSpy();
        const router = createTestRouter();

        stop = startAnalyticsReporting({ router, analytics, userProperties: createSources(), reportsIconSetting: true });
        await router.push(ROUTER_PATH.home);

        expect(analytics.setScreen).toHaveBeenCalledWith("home");
        expect(analytics.setUserProperty).toHaveBeenCalledTimes(5);
        expect(firstScreenFollowsEveryProperty(analytics)).toBe(true);
    });

    // The app's first navigation starts when the router is installed, which may already be under way
    it("should still set the properties first when the first navigation is already under way", async () => {
        const analytics = createAnalyticsSpy();
        const router = createTestRouter();

        const firstNavigation = router.push(ROUTER_PATH.home);
        stop = startAnalyticsReporting({ router, analytics, userProperties: createSources(), reportsIconSetting: false });
        await firstNavigation;

        expect(analytics.setScreen).toHaveBeenCalledWith("home");
        expect(firstScreenFollowsEveryProperty(analytics)).toBe(true);
    });

    it("should report the screens visited after start", async () => {
        const analytics = createAnalyticsSpy();
        const router = createTestRouter();

        stop = startAnalyticsReporting({ router, analytics, userProperties: createSources(), reportsIconSetting: false });
        await router.push(ROUTER_PATH.home);
        await router.push(ROUTER_PATH.settings);

        expect(analytics.setScreen.mock.calls).toEqual([["home"], ["settings"]]);
    });

    it("should stop reporting screens and properties once stopped", async () => {
        const analytics = createAnalyticsSpy();
        const router = createTestRouter();
        const sources = createSources();

        startAnalyticsReporting({ router, analytics, userProperties: sources, reportsIconSetting: false })();
        analytics.setUserProperty.mockClear();
        await router.push(ROUTER_PATH.home);
        sources.colorTheme.value = "blue";
        await router.push(ROUTER_PATH.settings);

        expect(analytics.setScreen).not.toHaveBeenCalled();
        expect(analytics.setUserProperty).not.toHaveBeenCalled();
    });
});
