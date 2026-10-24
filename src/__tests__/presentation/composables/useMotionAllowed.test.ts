import { afterEach, describe, expect, it, vi } from "vitest";
import { useMotionAllowed } from "@/presentation/composables/useMotionAllowed";
import { useSettingsStore } from "@/stores/settingsStore";

describe("useMotionAllowed", () => {
    afterEach(() => {
        localStorage.clear();
        vi.unstubAllGlobals();
    });

    const stubReducedMotion = (reduce: boolean) => {
        vi.stubGlobal("matchMedia", (query: string) => ({
            matches: reduce && query === "(prefers-reduced-motion: reduce)",
            media: query,
        }));
    };

    it("should allow motion when the setting is on and reduced motion is not asked for", () => {
        stubReducedMotion(false);

        expect(useMotionAllowed()()).toBe(true);
    });

    it("should follow the setting as it changes", () => {
        stubReducedMotion(false);
        const motionAllowed = useMotionAllowed();

        useSettingsStore().setMotionEffects(false);

        expect(motionAllowed()).toBe(false);
    });

    it("should forbid motion under reduced motion even when the setting is on", () => {
        stubReducedMotion(true);

        expect(useMotionAllowed()()).toBe(false);
    });
});
