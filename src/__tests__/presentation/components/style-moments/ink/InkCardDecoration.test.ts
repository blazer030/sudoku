import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import InkCardDecoration from "@/presentation/components/style-moments/ink/InkCardDecoration.vue";

describe("InkCardDecoration", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be ink's card decoration, with no decoration over the scene", () => {
        expect(STYLE_MOMENTS.ink.cardDecoration).toBe(InkCardDecoration);
        expect(STYLE_MOMENTS.ink.celebration).toBeNull();
    });

    it.each([false, true])("should hang the card on two rods and press a seal on it, as decoration (still: %s)", (still) => {
        const wrapper = mount(InkCardDecoration, { props: { still } });
        const rods = wrapper.findAll(".ink-rod");

        expect(rods.map(rod => rod.classes().find(name => name === "top" || name === "bottom")).sort()).toEqual(["bottom", "top"]);
        expect(wrapper.get(".ink-seal-stamp").text()).not.toBe("");
        for (const piece of [...rods, wrapper.get(".ink-seal-stamp")]) {
            expect(piece.element.closest('[aria-hidden="true"]'), piece.classes().join(" ")).not.toBeNull();
        }
    });

    // 「過關」 is an emblem, like the loader's 「題」: it stays the same in both languages
    it("should keep the seal's word when the language switches", async () => {
        const seal = mount(InkCardDecoration, { props: { still: false } }).get(".ink-seal-stamp");
        const english = seal.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(seal.text()).toBe(english);
    });
});
