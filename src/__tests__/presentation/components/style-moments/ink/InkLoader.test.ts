import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import InkLoader from "@/presentation/components/style-moments/ink/InkLoader.vue";

const maskIdOf = (reference: string | undefined): string | undefined => /^url\(#([^)]+)\)$/.exec(reference ?? "")?.[1];

describe("InkLoader", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be ink's loader", () => {
        expect(STYLE_MOMENTS.ink.loader).toBe(InkLoader);
    });

    it("should brush each stroke through its own reveal mask, and write digits and a 「題」 seal, as decoration", () => {
        const wrapper = mount(InkLoader);
        const sketch = wrapper.get(".ink-loader-sketch");
        const strokes = sketch.findAll(".ink-loader-stroke");
        const reveals = sketch.findAll("mask .ink-loader-reveal");

        expect(sketch.attributes("aria-hidden")).toBe("true");
        expect(strokes.length).toBeGreaterThan(0);
        expect(reveals).toHaveLength(strokes.length);
        // Each stroke and its mask's reveal share a step, so the reveal draws the stroke it masks
        for (const stroke of strokes) {
            const mask = sketch.get(`mask[id="${maskIdOf(stroke.attributes("mask"))}"]`);
            expect(mask.get(".ink-loader-reveal").attributes("data-step")).toBe(stroke.attributes("data-step"));
        }
        expect(new Set(strokes.map(stroke => stroke.attributes("data-step"))).size).toBe(strokes.length);
        const digits = sketch.findAll(".ink-loader-digit").map(digit => digit.text());
        expect(digits.length).toBeGreaterThan(0);
        expect(digits.every(digit => /^[1-9]$/.test(digit))).toBe(true);
        expect(new Set(digits).size).toBe(digits.length);
        expect(sketch.get(".ink-loader-seal").text()).not.toBe("");
    });

    it("should give each loader's masks their own ids", () => {
        const TwoLoaders = defineComponent({ render: () => [h(InkLoader), h(InkLoader)] });
        const wrapper = mount(TwoLoaders);
        const ids = wrapper.findAll("mask").map(mask => mask.attributes("id"));
        const references = wrapper.findAll(".ink-loader-stroke").map(stroke => maskIdOf(stroke.attributes("mask")));

        expect(new Set(ids).size).toBe(ids.length);
        expect(references.sort()).toEqual([...ids].sort());
    });

    it("should caption the slip in the current language", async () => {
        const wrapper = mount(InkLoader);
        const caption = wrapper.get(".ink-loader-caption");
        const english = caption.text();
        const englishSeal = wrapper.get(".ink-loader-seal").text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(caption.text()).not.toBe(english);
        expect(caption.text()).not.toBe("");
        // The seal is an emblem: the same in both languages
        expect(wrapper.get(".ink-loader-seal").text()).toBe(englishSeal);
    });

    it("should show a screen's own message instead", () => {
        const wrapper = mount(InkLoader, { props: { message: "Checking…" } });

        expect(wrapper.get(".ink-loader-caption").text()).toBe("Checking…");
    });
});
