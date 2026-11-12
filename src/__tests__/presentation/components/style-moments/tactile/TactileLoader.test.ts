import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import TactileLoader from "@/presentation/components/style-moments/tactile/TactileLoader.vue";

describe("TactileLoader", () => {
    it("should drop its nine tiles in a snake, as decoration", () => {
        const wrapper = mount(TactileLoader, { props: { message: "Generating" } });

        const tiles = wrapper.findAll(".tactile-loader-tile");
        const steps = tiles.map(tile => Number(tile.attributes("style")?.match(/--tactile-loader-step:\s*(\d+)/)?.[1]));
        // Left to right along the top row, back along the middle, left to right along the bottom
        expect(steps).toEqual([0, 1, 2, 5, 4, 3, 6, 7, 8]);
        expect(wrapper.findAll(".tactile-loader-face")).toHaveLength(9);
        expect(wrapper.get(".tactile-loader-tray").attributes("aria-hidden")).toBe("true");
    });

    it("should show a screen's own message instead", () => {
        const wrapper = mount(TactileLoader, { props: { message: "Checking…" } });

        expect(wrapper.get(".tactile-loader p").text()).toBe("Checking…");
    });
});
