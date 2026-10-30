import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import AuroraLoader from "@/presentation/components/style-moments/aurora/AuroraLoader.vue";

describe("AuroraLoader", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be aurora's loader", () => {
        expect(STYLE_MOMENTS.aurora.loader).toBe(AuroraLoader);
    });

    // The skin lays the dialogs' glass on it (shadow-modal) and keeps its 28px over the cards' 22px
    it("should be a glass card rounded 28px, at the dialogs' density", () => {
        const card = mount(AuroraLoader).get(".aurora-loader");

        expect(card.attributes("data-skin")).toBe("card");
        expect(card.classes()).toContain("rounded-[28px]");
        expect(card.classes()).toContain("shadow-modal");
    });

    it("should turn one halo under nine lights, as decoration", () => {
        const wrapper = mount(AuroraLoader);
        const halos = wrapper.findAll(".aurora-loader-halo");
        const dots = wrapper.findAll(".aurora-loader-dot");

        expect(halos).toHaveLength(1);
        expect(halos[0].attributes("aria-hidden")).toBe("true");
        expect(dots).toHaveLength(9);
        dots.forEach((dot) => {
            expect(dot.element.closest("[aria-hidden='true']")).not.toBeNull();
        });
    });

    // The centre breathes first, then the edges, then the corners
    it("should place the lights corner, edge, corner, edge, centre, edge, corner, edge, corner", () => {
        const rings = mount(AuroraLoader).findAll(".aurora-loader-dot").map(dot => dot.attributes("data-ring"));

        expect(rings).toEqual(["corner", "edge", "corner", "edge", "centre", "edge", "corner", "edge", "corner"]);
    });

    it("should caption the load in the current language", async () => {
        const wrapper = mount(AuroraLoader);
        const message = wrapper.get(".aurora-loader-message");
        const english = message.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(message.text()).not.toBe(english);
        expect(message.text()).not.toBe("");
        expect(message.attributes("aria-hidden")).toBeUndefined();
    });

    it("should show a screen's own message instead", () => {
        const wrapper = mount(AuroraLoader, { props: { message: "Checking…" } });

        expect(wrapper.get(".aurora-loader-message").text()).toBe("Checking…");
    });
});
