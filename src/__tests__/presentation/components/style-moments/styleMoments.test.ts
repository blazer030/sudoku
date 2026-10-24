import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { STYLE_IDS } from "@/theme/themeIds";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { useSettingsStore } from "@/stores/settingsStore";
import PuzzleLoader from "@/presentation/components/puzzle-loader/PuzzleLoader.vue";
import PaperDigitWriter from "@/presentation/components/style-moments/paper/PaperDigitWriter.vue";

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

    // Paper writes its digits in stroke by stroke; every other style draws its arrival in its skin alone
    it("should give paper alone a digit writer", () => {
        expect(STYLE_MOMENTS.paper.digitWriter).toBe(PaperDigitWriter);
        expect(STYLE_IDS.filter(style => STYLE_MOMENTS[style].digitWriter)).toEqual(["paper"]);
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
