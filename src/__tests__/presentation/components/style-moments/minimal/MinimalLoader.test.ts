import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import MinimalLoader from "@/presentation/components/style-moments/minimal/MinimalLoader.vue";

describe("MinimalLoader", () => {
    it("should be minimal's loader", () => {
        expect(STYLE_MOMENTS.minimal.loader).toBe(MinimalLoader);
    });

    it("should light its nine squares in a solver's order, as decoration", () => {
        const wrapper = mount(MinimalLoader);

        const squares = wrapper.findAll(".minimal-loader-square");
        const steps = squares.map(square => Number(square.attributes("style")?.match(/--minimal-loader-step:\s*(\d+)/)?.[1]));
        // Top left, centre, bottom right, top right, bottom left, then the edges
        expect(steps).toEqual([0, 5, 3, 8, 1, 6, 4, 7, 2]);
        expect(squares[0].element.parentElement?.getAttribute("aria-hidden")).toBe("true");
    });

    it("should caption the card in the current language", async () => {
        const wrapper = mount(MinimalLoader);
        const caption = wrapper.get(".minimal-loader p");
        const english = caption.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(caption.text()).not.toBe(english);
        expect(caption.text()).not.toBe("");
    });

    it("should show a screen's own message instead", () => {
        const wrapper = mount(MinimalLoader, { props: { message: "Checking…" } });

        expect(wrapper.get(".minimal-loader p").text()).toBe("Checking…");
    });
});
