import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import PixelLoader from "@/presentation/components/style-moments/pixel/PixelLoader.vue";
import PixelCelebration from "@/presentation/components/style-moments/pixel/PixelCelebration.vue";
import PixelGroupOverlay from "@/presentation/components/style-moments/pixel/PixelGroupOverlay.vue";

describe("PixelLoader", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be pixel's loader, celebrate over the scene and spark over the board", () => {
        expect(STYLE_MOMENTS.pixel.loader).toBe(PixelLoader);
        expect(STYLE_MOMENTS.pixel.celebration).toBe(PixelCelebration);
        expect(STYLE_MOMENTS.pixel.cardDecoration ?? null).toBeNull();
        expect(STYLE_MOMENTS.pixel.groupOverlay).toBe(PixelGroupOverlay);
    });

    it("should light the mark's nine squares like a snake, as decoration", () => {
        const wrapper = mount(PixelLoader);

        const squares = wrapper.findAll(".pixel-loader-square");
        const steps = squares.map(square => Number(square.attributes("style")?.match(/--pixel-loader-step:\s*(\d+)/)?.[1]));
        // Across the top, back along the middle, across the bottom
        expect(steps).toEqual([0, 1, 2, 5, 4, 3, 6, 7, 8]);
        expect(squares[0].element.parentElement?.getAttribute("aria-hidden")).toBe("true");
    });

    it("should show NOW LOADING and the bar as decoration only", () => {
        const wrapper = mount(PixelLoader);

        expect(wrapper.get(".pixel-loader-now").text()).toBe("NOW LOADING...");
        expect(wrapper.get(".pixel-loader-now").attributes("aria-hidden")).toBe("true");
        expect(wrapper.get(".pixel-loader-bar").attributes("aria-hidden")).toBe("true");
    });

    it("should caption the window in the current language", async () => {
        const wrapper = mount(PixelLoader);
        const caption = wrapper.get(".pixel-loader-caption");
        const english = caption.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(caption.text()).not.toBe(english);
        expect(caption.text()).not.toBe("");
    });

    it("should show a screen's own message instead", () => {
        const wrapper = mount(PixelLoader, { props: { message: "Checking…" } });

        expect(wrapper.get(".pixel-loader-caption").text()).toBe("Checking…");
    });
});
