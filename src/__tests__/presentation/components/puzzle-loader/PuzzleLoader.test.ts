import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";

vi.mock("vue3-lottie", () => ({
    Vue3Lottie: {
        name: "Vue3Lottie",
        props: ["animationData", "height", "width", "loop", "autoPlay"],
        template: "<div data-testid='lottie-stub' />",
    },
}));

describe("PuzzleLoader", () => {
    it("should not render when visible is false", () => {
        const wrapper = mount(PuzzleLoader, {
            props: { visible: false },
        });

        expect(wrapper.find("[data-testid='puzzle-loader']").exists()).toBe(false);
    });

    it("should render when visible is true", () => {
        const wrapper = mount(PuzzleLoader, {
            props: { visible: true },
        });

        expect(wrapper.find("[data-testid='puzzle-loader']").exists()).toBe(true);
    });

    it("should render the Lottie stub and custom message when visible", () => {
        const wrapper = mount(PuzzleLoader, {
            props: { visible: true, message: "Generating…" },
        });

        expect(wrapper.find("[data-testid='lottie-stub']").exists()).toBe(true);
        expect(wrapper.text()).toContain("Generating…");
    });
});
