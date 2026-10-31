import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import BlueprintCardDecoration from "@/presentation/components/style-moments/blueprint/BlueprintCardDecoration.vue";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { appVersion } from "@/utils/appVersion";

const mountDecoration = () => mount(BlueprintCardDecoration, { props: { still: false } });

describe("BlueprintCardDecoration", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be blueprint's card decoration, with nothing drawn over the scene", () => {
        expect(STYLE_MOMENTS.blueprint.cardDecoration).toBe(BlueprintCardDecoration);
        expect(STYLE_MOMENTS.blueprint.celebration).toBeNull();
    });

    // Drawn on the card, the stamp sits on the card's top edge however tall the screen is
    it("should press an approval stamp just above the card's top edge, as decoration", () => {
        const stamp = mountDecoration().get(".blueprint-stamp");

        expect(stamp.attributes("aria-hidden")).toBe("true");
        expect(stamp.classes()).toContain("absolute");
        expect(stamp.classes()).toContain("bottom-full");
        expect(stamp.classes().some(name => name.startsWith("top-"))).toBe(false);
        expect(stamp.find(".blueprint-stamp-word").exists()).toBe(true);
        expect(stamp.find(".blueprint-stamp-revision").exists()).toBe(true);
    });

    // The board frame's verdict tag peeks out above the card's right end, so the stamp stands at its left end; it turns
    // and is pressed about its foot, the bottom left corner, so that corner stays 4px above the edge whatever its width
    it("should stand the stamp on its foot at the card's left end, 4px above the edge, clear of the verdict tag", () => {
        const stamp = mountDecoration().get(".blueprint-stamp");

        expect(stamp.classes()).toContain("left-4");
        expect(stamp.classes().some(name => name.startsWith("right-"))).toBe(false);
        expect(stamp.classes()).toContain("origin-bottom-left");
        expect(stamp.classes()).toContain("mb-1");
    });

    it("should write the stamp's word and revision line in the current language", async () => {
        const wrapper = mountDecoration();
        const word = wrapper.get(".blueprint-stamp-word");
        const revision = wrapper.get(".blueprint-stamp-revision");
        const english = { word: word.text(), revision: revision.text() };

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(word.text()).not.toBe(english.word);
        expect(revision.text()).not.toBe(english.revision);
    });

    it("should date the stamp by the app's major and minor version", async () => {
        const [major, minor] = appVersion.split(".");
        const wrapper = mountDecoration();

        expect(wrapper.get(".blueprint-stamp-revision").text()).toContain(`${major}.${minor}`);
        expect(wrapper.get(".blueprint-stamp-revision").text()).not.toContain(appVersion);

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.get(".blueprint-stamp-revision").text()).toContain(`${major}.${minor}`);
    });

    // Chinese drops every tracking class; its two characters are set wide apart, an English word only a little
    it("should space the stamp's word out inline, wider in Chinese", async () => {
        const wrapper = mountDecoration();
        const word = wrapper.get(".blueprint-stamp-word");

        expect(word.attributes("style")).toContain("letter-spacing: 0.1em");

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(word.attributes("style")).toContain("letter-spacing: 0.3em");
        expect(word.classes().some(name => name.startsWith("tracking-"))).toBe(false);
    });
});
