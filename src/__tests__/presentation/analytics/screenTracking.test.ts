import { createAnalyticsSpy } from "@/__tests__/fixtures/analyticsSpy";
import { router } from "@/router";
import { ROUTER_PATH } from "@/routerPaths";
import { screenNameFor, startScreenTracking } from "@/presentation/analytics/screenTracking";
import { createTestRouter } from "@/__tests__/fixtures/testRouter";

const CATCH_ALL_PATH = "/:pathMatch(.*)*";

describe("screenNameFor", () => {
    it.each([
        [ROUTER_PATH.home, "home"],
        [ROUTER_PATH.game, "game"],
        [ROUTER_PATH.statistics, "statistics"],
        [ROUTER_PATH.settings, "settings"],
        [ROUTER_PATH.appearance, "appearance"],
        [ROUTER_PATH.changelog, "changelog"],
        [ROUTER_PATH.donate, "donate"],
        [ROUTER_PATH.gameReview, "game_review"],
        [ROUTER_PATH.solverWalkthrough, "solver"],
        [ROUTER_PATH.lessons, "lessons"],
        [ROUTER_PATH.lesson, "lesson"],
    ])("maps %s to %s", (routePath, screen) => {
        expect(screenNameFor(routePath)).toBe(screen);
    });

    it("returns null for an unknown path", () => {
        expect(screenNameFor("/nope")).toBeNull();
    });

    it("names every route of the app router except the catch-all", () => {
        const untracked = router.options.routes
            .filter((route) => route.path !== CATCH_ALL_PATH)
            .filter((route) => screenNameFor(route.path) === null);
        expect(untracked).toEqual([]);
    });
});

describe("startScreenTracking", () => {
    it("reports the screen of the page navigated to", async () => {
        const testRouter = createTestRouter();
        const analytics = createAnalyticsSpy();
        startScreenTracking(testRouter, analytics);

        await testRouter.push("/game-review/3");

        expect(analytics.setScreen).toHaveBeenCalledTimes(1);
        expect(analytics.setScreen).toHaveBeenCalledWith("game_review");
    });

    it("reports nothing when a guard cancels the navigation", async () => {
        const testRouter = createTestRouter();
        testRouter.beforeEach(() => false);
        const analytics = createAnalyticsSpy();
        startScreenTracking(testRouter, analytics);

        await testRouter.push("/statistics");

        expect(analytics.setScreen).not.toHaveBeenCalled();
    });

    it("reports nothing after tracking is stopped", async () => {
        const testRouter = createTestRouter();
        const analytics = createAnalyticsSpy();
        const stop = startScreenTracking(testRouter, analytics);

        stop();
        await testRouter.push("/statistics");

        expect(analytics.setScreen).not.toHaveBeenCalled();
    });
});
