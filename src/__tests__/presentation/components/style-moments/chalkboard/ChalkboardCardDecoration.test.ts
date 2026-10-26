import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import ChalkboardCardDecoration from "@/presentation/components/style-moments/chalkboard/ChalkboardCardDecoration.vue";

describe("ChalkboardCardDecoration", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be chalk's card decoration", () => {
        expect(STYLE_MOMENTS.chalkboard.cardDecoration).toBe(ChalkboardCardDecoration);
    });

    it("should write the cheer on the card as decoration, beside the real title", () => {
        const cheer = mount(ChalkboardCardDecoration, { props: { still: false } }).get(".chalkboard-cheer");

        expect(cheer.attributes("aria-hidden")).toBe("true");
        expect(cheer.get(".chalkboard-cheer-text").text()).not.toBe("");
    });

    it("should switch the cheer with the language", async () => {
        const text = mount(ChalkboardCardDecoration, { props: { still: false } }).get(".chalkboard-cheer-text");
        const english = text.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(text.text()).not.toBe("");
        expect(text.text()).not.toBe(english);
    });

    it("should drop three specks of dust under the cheer, left to right, while it is written", () => {
        const dust = mount(ChalkboardCardDecoration, { props: { still: false } }).findAll(".chalkboard-cheer > .chalkboard-cheer-dust");

        expect(dust.map(speck => speck.attributes("data-step"))).toEqual(["0", "1", "2"]);
    });

    // A still card is not written: the whole cheer is there at once, so there is no dust to drop
    it("should show the whole cheer at once, without dust, when still", () => {
        const wrapper = mount(ChalkboardCardDecoration, { props: { still: true } });

        expect(wrapper.get(".chalkboard-cheer-text").text()).toBe(i18n.global.t("game.complete.cheer"));
        expect(wrapper.find(".chalkboard-cheer-dust").exists()).toBe(false);
    });
});
