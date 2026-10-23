import type { Router } from "vue-router";
import { isNavigationFailure } from "vue-router";
import type { AnalyticsService, ScreenName } from "@/application/analytics/AnalyticsService";
import { ROUTER_PATH } from "@/router";

const SCREEN_BY_ROUTE_PATH: Record<string, ScreenName> = {
    [ROUTER_PATH.home]: "home",
    [ROUTER_PATH.game]: "game",
    [ROUTER_PATH.statistics]: "statistics",
    [ROUTER_PATH.settings]: "settings",
    [ROUTER_PATH.appearance]: "appearance",
    [ROUTER_PATH.changelog]: "changelog",
    [ROUTER_PATH.donate]: "donate",
    [ROUTER_PATH.gameReview]: "game_review",
    [ROUTER_PATH.solverWalkthrough]: "solver",
};

export const screenNameFor = (routePath: string): ScreenName | null =>
    SCREEN_BY_ROUTE_PATH[routePath] ?? null;

export const startScreenTracking = (router: Router, analytics: AnalyticsService): (() => void) =>
    router.afterEach((to, _from, failure) => {
        if (isNavigationFailure(failure)) return;
        const screen = screenNameFor(to.matched[0]?.path ?? "");
        if (screen === null) return;
        void analytics.setScreen(screen);
    });
