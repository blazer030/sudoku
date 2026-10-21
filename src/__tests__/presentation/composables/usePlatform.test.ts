import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
    Capacitor: {
        isNativePlatform: vi.fn(),
        getPlatform: vi.fn(),
    },
}));

import { Capacitor } from "@capacitor/core";
import { usePlatform } from "@/presentation/composables/usePlatform";

describe("usePlatform", () => {
    beforeEach(() => {
        vi.mocked(Capacitor.isNativePlatform).mockReset();
        vi.mocked(Capacitor.getPlatform).mockReset();
    });

    it("reports isNative true when capacitor reports native platform", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        vi.mocked(Capacitor.getPlatform).mockReturnValue("android");

        const result = usePlatform();

        expect(result.isNative).toBe(true);
        expect(result.platform).toBe("android");
    });

    it("reports isNative false on web", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
        vi.mocked(Capacitor.getPlatform).mockReturnValue("web");

        const result = usePlatform();

        expect(result.isNative).toBe(false);
        expect(result.platform).toBe("web");
    });
});
