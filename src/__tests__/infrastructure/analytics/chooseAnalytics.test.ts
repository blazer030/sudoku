import { chooseAnalytics } from "@/infrastructure/analytics/chooseAnalytics";
import { FirebaseAnalyticsAdapter } from "@/infrastructure/analytics/FirebaseAnalyticsAdapter";
import { NoopAnalyticsAdapter } from "@/infrastructure/analytics/NoopAnalyticsAdapter";

const config = { apiKey: "key" };

describe("chooseAnalytics", () => {
    it("uses Firebase on native without loading the web SDK", async () => {
        const initializeWebFirebase = vi.fn().mockResolvedValue(undefined);
        const analytics = await chooseAnalytics({ isNative: true, webConfig: config, initializeWebFirebase });
        expect(analytics).toBeInstanceOf(FirebaseAnalyticsAdapter);
        expect(initializeWebFirebase).not.toHaveBeenCalled();
    });

    it("uses Noop on web without a config", async () => {
        const initializeWebFirebase = vi.fn().mockResolvedValue(undefined);
        const analytics = await chooseAnalytics({ isNative: false, webConfig: null, initializeWebFirebase });
        expect(analytics).toBeInstanceOf(NoopAnalyticsAdapter);
        expect(initializeWebFirebase).not.toHaveBeenCalled();
    });

    it("initializes the web SDK with the config and uses Firebase", async () => {
        const initializeWebFirebase = vi.fn().mockResolvedValue(undefined);
        const analytics = await chooseAnalytics({ isNative: false, webConfig: config, initializeWebFirebase });
        expect(initializeWebFirebase).toHaveBeenCalledWith(config);
        expect(analytics).toBeInstanceOf(FirebaseAnalyticsAdapter);
    });

    it("falls back to Noop when the web SDK fails to load", async () => {
        const initializeWebFirebase = vi.fn().mockRejectedValue(new Error("chunk blocked"));
        const analytics = await chooseAnalytics({ isNative: false, webConfig: config, initializeWebFirebase });
        expect(analytics).toBeInstanceOf(NoopAnalyticsAdapter);
    });
});
