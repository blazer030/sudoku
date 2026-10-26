import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import ChalkboardCelebration from "@/presentation/components/style-moments/chalkboard/ChalkboardCelebration.vue";

describe("ChalkboardCelebration", () => {
    it("should be chalk's decoration over the completion scene", () => {
        expect(STYLE_MOMENTS.chalkboard.celebration).toBe(ChalkboardCelebration);
    });

    it("should doodle two stars, a wave and rays round the scene, in turn, as decoration", () => {
        const scene = mount(ChalkboardCelebration, { props: { still: false } }).get(".chalkboard-celebration");
        const doodles = scene.findAll(".chalkboard-doodle");

        expect(scene.attributes("aria-hidden")).toBe("true");
        expect(scene.attributes("data-still")).toBeUndefined();
        expect(doodles.map(doodle => doodle.attributes("data-shape"))).toEqual(["star", "star", "wave", "rays"]);
        expect(doodles.map(doodle => doodle.attributes("data-step"))).toEqual(["0", "1", "2", "3"]);
    });

    // MomentsChalk's three chalks: yellow, pink and blue (orange, pink and blue markers on 白板)
    it("should doodle in three chalks, each drawn in currentColor by the skin", () => {
        const doodles = mount(ChalkboardCelebration, { props: { still: false } }).findAll(".chalkboard-doodle");

        expect(doodles.map(doodle => doodle.attributes("data-tone"))).toEqual(["primary", "doodle", "accent", "primary"]);
        for (const doodle of doodles) {
            expect(doodle.attributes("stroke")).toBe("currentColor");
            expect(doodle.attributes("fill")).toBe("none");
        }
    });

    it("should draw no filter", () => {
        expect(mount(ChalkboardCelebration, { props: { still: false } }).find("filter").exists()).toBe(false);
    });

    it("should leave the doodles on the board when still", () => {
        const scene = mount(ChalkboardCelebration, { props: { still: true } }).get(".chalkboard-celebration");

        expect(scene.attributes("data-still")).toBe("");
        expect(scene.findAll(".chalkboard-doodle")).toHaveLength(4);
    });
});
