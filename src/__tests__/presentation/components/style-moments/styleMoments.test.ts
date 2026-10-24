import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { STYLE_IDS } from "@/theme/themeIds";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { useSettingsStore } from "@/stores/settingsStore";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";

vi.mock("vue3-lottie", () => ({
    Vue3Lottie: {
        name: "Vue3Lottie",
        props: ["animationData", "height", "width", "loop", "autoPlay"],
        template: "<div data-testid='lottie-stub' />",
    },
}));

describe("STYLE_MOMENTS", () => {
    it("should have an entry for every style", () => {
        expect(Object.keys(STYLE_MOMENTS).sort()).toEqual([...STYLE_IDS].sort());
    });

    it.each(STYLE_IDS)("should give %s a loader and positive durations", (style) => {
        const moments = STYLE_MOMENTS[style];

        expect(moments.loader).toBeTruthy();
        expect(moments.groupEffectMs).toBeGreaterThan(0);
        expect(moments.celebrationBoardMs).toBeGreaterThan(0);
    });

    it.each(STYLE_IDS)("should render the loader of the current style (%s) inside PuzzleLoader", (style) => {
        const pinia = createPinia();
        setActivePinia(pinia);
        useSettingsStore().setStyle(style);

        const wrapper = mount(PuzzleLoader, {
            props: { visible: true },
            global: { plugins: [pinia] },
        });

        expect(wrapper.findComponent(STYLE_MOMENTS[style].loader).exists()).toBe(true);
    });
});
