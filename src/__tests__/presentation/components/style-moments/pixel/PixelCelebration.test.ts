import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PixelCelebration from "@/presentation/components/style-moments/pixel/PixelCelebration.vue";

describe("PixelCelebration", () => {
    it("should spell STAGE CLEAR one letter at a time, as decoration", () => {
        const wrapper = mount(PixelCelebration, { props: { still: false } });
        const letters = wrapper.findAll(".pixel-stage-letter");

        expect(letters.map(letter => letter.text()).join("")).toBe("STAGECLEAR");
        expect(letters.map(letter => Number(letter.attributes("style")?.match(/--pixel-letter-step:\s*(\d+)/)?.[1])))
            .toEqual([0, 1, 2, 3, 4, 6, 7, 8, 9, 10]);
        expect(wrapper.get(".pixel-celebration").attributes("aria-hidden")).toBe("true");
    });

    it("should pop pixel bursts around the dialog with motion", () => {
        const wrapper = mount(PixelCelebration, { props: { still: false } });

        expect(wrapper.get(".pixel-celebration").attributes("data-still")).toBeUndefined();
        expect(wrapper.findAll(".pixel-burst")).toHaveLength(6);
    });

    it("should show STAGE CLEAR and the stars already there, without bursts, when still", () => {
        const wrapper = mount(PixelCelebration, { props: { still: true } });

        expect(wrapper.get(".pixel-celebration").attributes("data-still")).toBe("");
        expect(wrapper.findAll(".pixel-stage-letter")).toHaveLength(10);
        expect(wrapper.find(".pixel-celebration-stars").exists()).toBe(true);
        expect(wrapper.find(".pixel-burst").exists()).toBe(false);
    });
});
