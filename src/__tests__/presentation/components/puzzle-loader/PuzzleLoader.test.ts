import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";

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

    it("should hand a custom message to the style's loader", () => {
        const wrapper = mount(PuzzleLoader, {
            props: { visible: true, message: "Checking…" },
        });

        expect(wrapper.text()).toContain("Checking…");
    });

    it("should show the default message and follow the language when no message is passed", async () => {
        const wrapper = mount(PuzzleLoader, {
            props: { visible: true },
        });
        expect(wrapper.text()).toContain("Generating puzzle…");

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.text()).toContain("正在產生題目…");
    });
});
