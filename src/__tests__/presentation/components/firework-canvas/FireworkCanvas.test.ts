import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import FireworkCanvas from "@/presentation/components/firework-canvas/FireworkCanvas.vue";
import { useSettingsStore } from "@/stores/settingsStore";
import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";

vi.mock("@/presentation/composables/prefersReducedMotion", () => ({ prefersReducedMotion: vi.fn(() => false) }));

describe("FireworkCanvas", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
            clearRect: vi.fn(), setTransform: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
        } as unknown as CanvasRenderingContext2D);
        vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.mocked(prefersReducedMotion).mockReturnValue(false);
    });

    it("should start the animation when motion and the completion setting allow it", () => {
        const wrapper = mount(FireworkCanvas);

        expect(window.requestAnimationFrame).toHaveBeenCalled();
        wrapper.unmount();
    });

    it("should not animate when the user prefers reduced motion", () => {
        vi.mocked(prefersReducedMotion).mockReturnValue(true);

        const wrapper = mount(FireworkCanvas);

        expect(window.requestAnimationFrame).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    it("should not animate when the completion animation setting is off", () => {
        useSettingsStore().setCompletionFlash(false);

        const wrapper = mount(FireworkCanvas);

        expect(window.requestAnimationFrame).not.toHaveBeenCalled();
        wrapper.unmount();
    });
});
