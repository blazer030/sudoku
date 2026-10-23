import { FirebaseAnalyticsAdapter } from "@/infrastructure/analytics/FirebaseAnalyticsAdapter";

const plugin = vi.hoisted(() => ({
    logEvent: vi.fn(),
    setCurrentScreen: vi.fn(),
    setUserProperty: vi.fn(),
}));

vi.mock("@capacitor-firebase/analytics", () => ({ FirebaseAnalytics: plugin }));

describe("FirebaseAnalyticsAdapter", () => {
    beforeEach(() => {
        plugin.logEvent.mockResolvedValue(undefined);
        plugin.setCurrentScreen.mockResolvedValue(undefined);
        plugin.setUserProperty.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it("reports a screen as the current screen", async () => {
        await new FirebaseAnalyticsAdapter().setScreen("game_review");

        expect(plugin.setCurrentScreen).toHaveBeenCalledWith({ screenName: "game_review" });
    });

    it("sets a user property", async () => {
        await new FirebaseAnalyticsAdapter().setUserProperty("style", "paper");

        expect(plugin.setUserProperty).toHaveBeenCalledWith({ key: "style", value: "paper" });
    });

    it("logs an event with empty params when it has none", async () => {
        await new FirebaseAnalyticsAdapter().logEvent({ name: "donate_view" });

        expect(plugin.logEvent).toHaveBeenCalledWith({ name: "donate_view", params: {} });
    });

    it("swallows a rejected logEvent", async () => {
        plugin.logEvent.mockRejectedValueOnce(new Error("offline"));

        await expect(new FirebaseAnalyticsAdapter().logEvent({ name: "donate_view" })).resolves.toBeUndefined();
    });

    it("swallows a rejected setScreen", async () => {
        plugin.setCurrentScreen.mockRejectedValueOnce(new Error("offline"));

        await expect(new FirebaseAnalyticsAdapter().setScreen("home")).resolves.toBeUndefined();
    });

    it("swallows a rejected setUserProperty", async () => {
        plugin.setUserProperty.mockRejectedValueOnce(new Error("offline"));

        await expect(new FirebaseAnalyticsAdapter().setUserProperty("language", "en")).resolves.toBeUndefined();
    });
});
