import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import PixelLoader from "@/presentation/components/style-moments/pixel/PixelLoader.vue";

describe("PixelLoader", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should light the mark's nine squares like a snake, as decoration", () => {
        const wrapper = mount(PixelLoader, { props: { message: "Generating" } });

        const squares = wrapper.findAll(".pixel-loader-square");
        const steps = squares.map(square => Number(square.attributes("style")?.match(/--pixel-loader-step:\s*(\d+)/)?.[1]));
        // Across the top, back along the middle, across the bottom
        expect(steps).toEqual([0, 1, 2, 5, 4, 3, 6, 7, 8]);
        expect(squares[0].element.parentElement?.getAttribute("aria-hidden")).toBe("true");
    });

    it("should show NOW LOADING and the bar as decoration only", () => {
        const wrapper = mount(PixelLoader, { props: { message: "Generating" } });

        expect(wrapper.get(".pixel-loader-now").text()).toBe("NOW LOADING...");
        expect(wrapper.get(".pixel-loader-now").attributes("aria-hidden")).toBe("true");
        expect(wrapper.get(".pixel-loader-bar").attributes("aria-hidden")).toBe("true");
    });

    it("should show a screen's own message instead", () => {
        const wrapper = mount(PixelLoader, { props: { message: "Checking…" } });

        expect(wrapper.get(".pixel-loader-caption").text()).toBe("Checking…");
    });
});
