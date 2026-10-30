import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import AuroraCelebration from "@/presentation/components/style-moments/aurora/AuroraCelebration.vue";

describe("AuroraCelebration", () => {
    it("should be aurora's celebration, with nothing drawn on the card itself", () => {
        expect(STYLE_MOMENTS.aurora.celebration).toBe(AuroraCelebration);
        expect(STYLE_MOMENTS.aurora.cardDecoration).toBeNull();
    });

    // It fills the scrim behind the card; the scrim centres the card, so the screen's centre is the card's
    it("should fill the scene behind the card as untouchable decoration", () => {
        const scene = mount(AuroraCelebration, { props: { still: false } }).get(".aurora-celebration");

        expect(scene.classes()).toEqual(expect.arrayContaining(["absolute", "inset-0", "pointer-events-none", "overflow-hidden"]));
        expect(scene.attributes("aria-hidden")).toBe("true");
        expect(scene.attributes("data-still")).toBeUndefined();
    });

    it("should centre three 200px rings on the card, the second of aurora-2", () => {
        const rings = mount(AuroraCelebration, { props: { still: false } }).findAll(".aurora-celebration-ring");

        expect(rings.map(ring => ring.attributes("data-index"))).toEqual(["0", "1", "2"]);
        expect(rings.map(ring => ring.attributes("data-light"))).toEqual(["primary", "aurora-2", "aurora-1"]);
        for (const ring of rings) {
            expect(ring.classes()).toEqual(expect.arrayContaining([
                "absolute", "top-1/2", "left-1/2", "-mt-[100px]", "-ml-[100px]", "size-[200px]", "rounded-full",
            ]));
        }
    });

    it("should send six sparks up from below, aurora-1 and aurora-2 in turn", () => {
        const sparks = mount(AuroraCelebration, { props: { still: false } }).findAll(".aurora-celebration-spark");

        expect(sparks).toHaveLength(6);
        expect(sparks.map(spark => spark.attributes("data-light"))).toEqual(["aurora-1", "aurora-2", "aurora-1", "aurora-2", "aurora-1", "aurora-2"]);
        for (const spark of sparks) {
            expect(spark.attributes("style")).toMatch(/left: \d+(\.\d+)?%/);
            expect(spark.attributes("style")).toMatch(/--aurora-spark-delay: \d+(\.\d+)?s/);
        }
    });

    it("should keep one ring and no sparks when still", () => {
        const wrapper = mount(AuroraCelebration, { props: { still: true } });

        expect(wrapper.get(".aurora-celebration").attributes("data-still")).toBe("");
        expect(wrapper.findAll(".aurora-celebration-ring").map(ring => ring.attributes("data-index"))).toEqual(["0"]);
        expect(wrapper.findAll(".aurora-celebration-spark")).toHaveLength(0);
    });
});
