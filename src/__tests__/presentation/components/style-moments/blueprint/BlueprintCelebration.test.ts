import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import BlueprintCelebration from "@/presentation/components/style-moments/blueprint/BlueprintCelebration.vue";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { appVersion } from "@/utils/appVersion";

const mountCelebration = (still: boolean) => mount(BlueprintCelebration, { props: { still } });

describe("BlueprintCelebration", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be blueprint's celebration", () => {
        expect(STYLE_MOMENTS.blueprint.celebration).toBe(BlueprintCelebration);
    });

    it("should press an approval stamp on the scene, as decoration", () => {
        const scene = mountCelebration(false).get(".blueprint-celebration");

        expect(scene.attributes("aria-hidden")).toBe("true");
        expect(scene.attributes("data-still")).toBeUndefined();
        expect(scene.find(".blueprint-stamp .blueprint-stamp-word").exists()).toBe(true);
        expect(scene.find(".blueprint-stamp .blueprint-stamp-revision").exists()).toBe(true);
    });

    it("should write the stamp's word and revision line in the current language", async () => {
        const wrapper = mountCelebration(false);
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
        const wrapper = mountCelebration(false);

        expect(wrapper.get(".blueprint-stamp-revision").text()).toContain(`${major}.${minor}`);
        expect(wrapper.get(".blueprint-stamp-revision").text()).not.toContain(appVersion);

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.get(".blueprint-stamp-revision").text()).toContain(`${major}.${minor}`);
    });

    // Chinese drops every tracking class; its two characters are set wide apart, an English word only a little
    it("should space the stamp's word out inline, wider in Chinese", async () => {
        const wrapper = mountCelebration(false);
        const word = wrapper.get(".blueprint-stamp-word");

        expect(word.attributes("style")).toContain("letter-spacing: 0.1em");

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(word.attributes("style")).toContain("letter-spacing: 0.3em");
        expect(word.classes().some(name => name.startsWith("tracking-"))).toBe(false);
    });

    it("should show the stamp at once when still", () => {
        const scene = mountCelebration(true).get(".blueprint-celebration");

        expect(scene.attributes("data-still")).toBe("");
        expect(scene.find(".blueprint-stamp-word").exists()).toBe(true);
    });
});
