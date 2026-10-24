import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import CyberLoader from "@/presentation/components/style-moments/cyber/CyberLoader.vue";
import CyberCelebration from "@/presentation/components/style-moments/cyber/CyberCelebration.vue";
import CyberGroupOverlay from "@/presentation/components/style-moments/cyber/CyberGroupOverlay.vue";

describe("CyberLoader", () => {
    afterEach(() => {
        i18n.global.locale.value = "en";
    });

    it("should be cyber's loader, celebrate over the scene and draw over the board", () => {
        expect(STYLE_MOMENTS.cyber.loader).toBe(CyberLoader);
        expect(STYLE_MOMENTS.cyber.celebration).toBe(CyberCelebration);
        expect(STYLE_MOMENTS.cyber.cardDecoration ?? null).toBeNull();
        expect(STYLE_MOMENTS.cyber.groupOverlay).toBe(CyberGroupOverlay);
    });

    it("should be a HUD panel with two rings round a 3×3 whose squares light at their own beats, as decoration", () => {
        const wrapper = mount(CyberLoader);

        expect(wrapper.get(".cyber-loader").attributes("data-skin")).toBe("card");
        const ring = wrapper.get(".cyber-loader-ring");
        expect(ring.attributes("aria-hidden")).toBe("true");
        expect(ring.find(".cyber-loader-orbit").exists()).toBe(true);
        expect(ring.find(".cyber-loader-arc").exists()).toBe(true);
        const delays = ring.findAll(".cyber-loader-square").map(square => square.attributes("style")?.match(/--cyber-loader-delay:\s*(\d+)ms/)?.[1]);
        expect(delays).toHaveLength(9);
        expect(new Set(delays).size).toBe(9);
    });

    it("should write the generator's log and its header in English, as decoration", () => {
        const wrapper = mount(CyberLoader);

        expect(wrapper.get(".cyber-loader-head").text()).toContain("// GENERATING");
        expect(wrapper.get(".cyber-loader-head").attributes("aria-hidden")).toBe("true");
        const log = wrapper.get(".cyber-loader-log");
        expect(log.attributes("aria-hidden")).toBe("true");
        expect(log.findAll(".cyber-loader-line").map(line => line.text())).toEqual(["> SEED 0x3F2A9C", "> CARVE CLUES 32/81", "> VERIFY UNIQUE .. OK"]);
        expect(log.get(".cyber-loader-ok").text()).toBe("OK");
        expect(wrapper.get(".cyber-loader-progress").attributes("aria-hidden")).toBe("true");
        // English in both languages: its tracking is inline, since Chinese drops the tracking classes
        expect(wrapper.get(".cyber-loader-head").attributes("style")).toContain("letter-spacing");
        expect(wrapper.get(".cyber-loader-head").classes().some(name => name.startsWith("tracking-"))).toBe(false);
    });

    it("should caption the panel in the current language", async () => {
        const wrapper = mount(CyberLoader);
        const caption = wrapper.get(".cyber-loader-caption");
        const english = caption.text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(caption.text()).not.toBe(english);
        expect(caption.text()).not.toBe("");
    });

    it("should show a screen's own message instead", () => {
        const wrapper = mount(CyberLoader, { props: { message: "Checking…" } });

        expect(wrapper.get(".cyber-loader-caption").text()).toBe("Checking…");
    });
});
