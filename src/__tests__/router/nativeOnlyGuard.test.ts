import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
    Capacitor: {
        isNativePlatform: vi.fn(),
        getPlatform: vi.fn().mockReturnValue("web"),
    },
}));

import { Capacitor } from "@capacitor/core";
import { applyNativeOnlyGuard, NATIVE_ONLY_ROUTES } from "@/router";

describe("native-only route guard", () => {
    beforeEach(() => {
        vi.mocked(Capacitor.isNativePlatform).mockReset();
    });

    it("redirects /donate to / on web", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

        const result = applyNativeOnlyGuard({ path: "/donate" });

        expect(result).toBe("/");
    });

    it("allows /donate on native", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

        const result = applyNativeOnlyGuard({ path: "/donate" });

        expect(result).toBeUndefined();
    });

    it("allows non-native-only paths on web", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

        const result = applyNativeOnlyGuard({ path: "/settings" });

        expect(result).toBeUndefined();
    });

    it("lists /donate as native-only", () => {
        expect(NATIVE_ONLY_ROUTES).toContain("/donate");
    });
});
