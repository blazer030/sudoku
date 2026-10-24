import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import CyberCelebration from "@/presentation/components/style-moments/cyber/CyberCelebration.vue";

describe("CyberCelebration", () => {
    it("should turn a HUD ring in and write MISSION COMPLETE, as decoration", () => {
        const wrapper = mount(CyberCelebration, { props: { still: false } });
        const scene = wrapper.get(".cyber-celebration");

        expect(scene.attributes("aria-hidden")).toBe("true");
        expect(scene.attributes("data-still")).toBeUndefined();
        expect(scene.find(".cyber-celebration-ring-in .cyber-celebration-ring").exists()).toBe(true);
        expect(scene.get(".cyber-mission").text()).toBe("// MISSION COMPLETE");
    });

    // Chinese drops every tracking class, but this is English in both languages
    it("should space MISSION COMPLETE out inline, so it keeps its tracking in Chinese", () => {
        const mission = mount(CyberCelebration, { props: { still: false } }).get(".cyber-mission");

        expect(mission.attributes("style")).toContain("letter-spacing: 0.3em");
        expect(mission.classes().some(name => name.startsWith("tracking-"))).toBe(false);
    });

    it("should leave the ring and MISSION COMPLETE in place when still", () => {
        const wrapper = mount(CyberCelebration, { props: { still: true } });
        const scene = wrapper.get(".cyber-celebration");

        expect(scene.attributes("data-still")).toBe("");
        expect(scene.find(".cyber-celebration-ring").exists()).toBe(true);
        expect(scene.get(".cyber-mission").text()).toBe("// MISSION COMPLETE");
    });
});
