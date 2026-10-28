import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import ChalkboardLoader from "@/presentation/components/style-moments/chalkboard/ChalkboardLoader.vue";

const maskIdOf = (reference: string | undefined): string | undefined => /^url\(#([^)]+)\)$/.exec(reference ?? "")?.[1];

describe("ChalkboardLoader", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be chalkboard's loader", () => {
        expect(STYLE_MOMENTS.chalkboard.loader).toBe(ChalkboardLoader);
    });

    it("should chalk a 九宮 (its outline, then four inner lines), a ring, four digits, a duster and its smear, as decoration", () => {
        const wrapper = mount(ChalkboardLoader);
        const sketch = wrapper.get(".chalkboard-loader-sketch");
        const strokes = sketch.findAll(".chalkboard-loader-stroke");
        const digits = sketch.findAll(".chalkboard-loader-digit").map(digit => digit.text());

        expect(sketch.attributes("aria-hidden")).toBe("true");
        expect(strokes).toHaveLength(5);
        expect(strokes.map(stroke => stroke.attributes("data-step"))).toEqual(["0", "1", "2", "3", "4"]);
        expect(sketch.findAll(".chalkboard-loader-ring").length).toBeGreaterThan(0);
        expect(digits).toHaveLength(4);
        expect(digits.every(digit => /^[1-9]$/.test(digit))).toBe(true);
        expect(new Set(digits).size).toBe(digits.length);
        expect(wrapper.find(".chalkboard-loader-duster").exists()).toBe(true);
        expect(wrapper.find(".chalkboard-loader-smear").exists()).toBe(true);
    });

    // MomentsChalk's wiper comes in from past the card's left edge, and the card's edge cuts it off: the duster and
    // its smear lie in a layer over the card, inside its 2px chalk edge, that clips them; never on the sketch, which
    // they overrun
    it("should drag the duster and its smear in a layer clipped to the card's edge", () => {
        const wrapper = mount(ChalkboardLoader);
        const card = wrapper.get(".chalkboard-loader");
        const wipe = card.get(".chalkboard-loader-wipe");

        expect(wipe.element.parentElement).toBe(card.element);
        expect(wipe.classes()).toEqual(expect.arrayContaining(["absolute", "inset-0.5", "overflow-hidden"]));
        expect(wipe.attributes("aria-hidden")).toBe("true");
        expect(wipe.find(".chalkboard-loader-duster").exists()).toBe(true);
        expect(wipe.find(".chalkboard-loader-smear").exists()).toBe(true);
        expect(card.get(".chalkboard-loader-sketch").find(".chalkboard-loader-duster").exists()).toBe(false);
    });

    it("should write each digit through its own reveal mask", () => {
        const wrapper = mount(ChalkboardLoader);
        const sketch = wrapper.get(".chalkboard-loader-sketch");
        const digits = sketch.findAll(".chalkboard-loader-digit");

        for (const digit of digits) {
            const mask = sketch.get(`mask[id="${maskIdOf(digit.attributes("mask"))}"]`);
            expect(mask.get(".chalkboard-loader-reveal").attributes("data-step")).toBe(digit.attributes("data-step"));
        }
        expect(new Set(digits.map(digit => digit.attributes("data-step"))).size).toBe(digits.length);
    });

    it("should give each loader's masks their own ids", () => {
        const TwoLoaders = defineComponent({ render: () => [h(ChalkboardLoader), h(ChalkboardLoader)] });
        const wrapper = mount(TwoLoaders);
        const ids = wrapper.findAll("mask").map(mask => mask.attributes("id"));
        const references = wrapper.findAll(".chalkboard-loader-digit").map(digit => maskIdOf(digit.attributes("mask")));

        expect(ids.length).toBeGreaterThan(0);
        expect(new Set(ids).size).toBe(ids.length);
        expect(references.sort()).toEqual([...ids].sort());
    });

    it("should caption the board in the current language", async () => {
        const wrapper = mount(ChalkboardLoader);
        const caption = wrapper.get(".chalkboard-loader-caption");
        const english = caption.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(caption.text()).not.toBe(english);
        expect(caption.text()).not.toBe("");
    });

    it("should show a screen's own message instead", () => {
        const wrapper = mount(ChalkboardLoader, { props: { message: "Checking…" } });

        expect(wrapper.get(".chalkboard-loader-caption").text()).toBe("Checking…");
    });
});
