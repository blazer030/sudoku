import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import TactileLoader from "@/presentation/components/style-moments/tactile/TactileLoader.vue";

describe("TactileLoader", () => {
    it("should be tactile's loader, with no decoration drawn over the completion scene", () => {
        expect(STYLE_MOMENTS.tactile.loader).toBe(TactileLoader);
        expect(STYLE_MOMENTS.tactile.celebration).toBeNull();
    });

    it("should drop its nine tiles in a snake, as decoration", () => {
        const wrapper = mount(TactileLoader);

        const tiles = wrapper.findAll(".tactile-loader-tile");
        const steps = tiles.map(tile => Number(tile.attributes("style")?.match(/--tactile-loader-step:\s*(\d+)/)?.[1]));
        // Left to right along the top row, back along the middle, left to right along the bottom
        expect(steps).toEqual([0, 1, 2, 5, 4, 3, 6, 7, 8]);
        expect(wrapper.findAll(".tactile-loader-face")).toHaveLength(9);
        expect(wrapper.get(".tactile-loader-tray").attributes("aria-hidden")).toBe("true");
    });

    it("should caption the card in the current language", async () => {
        const wrapper = mount(TactileLoader);
        const caption = wrapper.get(".tactile-loader p");
        const english = caption.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(caption.text()).not.toBe(english);
        expect(caption.text()).not.toBe("");
    });

    it("should show a screen's own message instead", () => {
        const wrapper = mount(TactileLoader, { props: { message: "Checking…" } });

        expect(wrapper.get(".tactile-loader p").text()).toBe("Checking…");
    });
});
