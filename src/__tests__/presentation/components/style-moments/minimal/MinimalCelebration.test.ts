import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import MinimalCelebration from "@/presentation/components/style-moments/minimal/MinimalCelebration.vue";

// Minimal draws its celebration on the board and the card (skin.css); the component tells the skin
// whether the card rises and the ring is drawn, or both are simply there
describe("MinimalCelebration", () => {
    it("should be minimal's celebration", () => {
        expect(STYLE_MOMENTS.minimal.celebration).toBe(MinimalCelebration);
    });

    it("should mark the scene for the card to rise and the ring to draw", () => {
        const marker = mount(MinimalCelebration, { props: { still: false } }).get(".minimal-celebration");

        expect(marker.attributes("data-still")).toBeUndefined();
        expect(marker.attributes("aria-hidden")).toBe("true");
    });

    it("should mark the scene still, for the end state without motion", () => {
        const marker = mount(MinimalCelebration, { props: { still: true } }).get(".minimal-celebration");

        expect(marker.attributes("data-still")).toBe("");
    });
});
