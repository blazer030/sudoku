import { isFeatureEnabled } from "@/utils/featureToggle";

describe("featureToggle", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("turns a develop feature on only in develop builds", () => {
        vi.stubEnv("VITE_APP_ENV", "develop");
        expect(isFeatureEnabled("changelogUnreleased")).toBe(true);
        vi.stubEnv("VITE_APP_ENV", "production");
        expect(isFeatureEnabled("changelogUnreleased")).toBe(false);
    });

    it("rejects a feature name it does not know, so a typo fails the type check", () => {
        // @ts-expect-error -- not a feature
        expect(isFeatureEnabled("changelogUnrelease")).toBe(false);
    });
});
