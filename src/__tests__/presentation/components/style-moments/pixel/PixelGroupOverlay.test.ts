import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import PixelGroupOverlay from "@/presentation/components/style-moments/pixel/PixelGroupOverlay.vue";

const effectOf = (groups: GroupEffect["groups"], origin = { row: 4, column: 4 }): GroupEffect => ({ id: 1, groups, origin });

// Its left, top, width and height, as percentages of the board
const placementOf = (style: string | undefined): number[] =>
    ["left", "top", "width", "height"].map(property => Number.parseFloat(new RegExp(`${property}:\\s*([\\d.]+)%`).exec(style ?? "")?.[1] ?? "NaN"));

const expectPlacement = (style: string | undefined, expected: number[]): void => {
    placementOf(style).forEach((value, index) => { expect(value).toBeCloseTo(expected[index], 3); });
};

// How many ripple steps the group's farthest cell lies from the entered one
const reachOf = (style: string | undefined): number => Number(/--pixel-spark-reach:\s*(\d+)/.exec(style ?? "")?.[1]);

describe("PixelGroupOverlay", () => {
    it("should spark at both ends of a completed row, once its farthest cell blinks", () => {
        const mark = mount(PixelGroupOverlay, { props: { effect: effectOf([{ kind: "row", index: 3 }]) } }).get(".pixel-group-mark");

        expect(mark.classes()).toContain("pixel-group-row");
        expectPlacement(mark.attributes("style"), [0, 100 / 3, 100, 100 / 9]);
        expect(mark.findAll(".pixel-group-spark")).toHaveLength(2);
        // One row up and four columns across from the centre
        expect(reachOf(mark.attributes("style"))).toBe(5);
    });

    it("should spark at both ends of a completed column", () => {
        const mark = mount(PixelGroupOverlay, { props: { effect: effectOf([{ kind: "column", index: 8 }], { row: 0, column: 8 }) } }).get(".pixel-group-mark");

        expect(mark.classes()).toContain("pixel-group-column");
        expectPlacement(mark.attributes("style"), [800 / 9, 0, 100 / 9, 100]);
        expect(mark.findAll(".pixel-group-spark")).toHaveLength(2);
        expect(reachOf(mark.attributes("style"))).toBe(8);
    });

    it("should spark at the four corners of a completed box, numbered from the top left", () => {
        const mark = mount(PixelGroupOverlay, { props: { effect: effectOf([{ kind: "box", index: 5 }], { row: 4, column: 7 }) } }).get(".pixel-group-mark");

        expect(mark.classes()).toContain("pixel-group-box");
        expectPlacement(mark.attributes("style"), [200 / 3, 100 / 3, 100 / 3, 100 / 3]);
        expect(mark.findAll(".pixel-group-spark")).toHaveLength(4);
        expect(reachOf(mark.attributes("style"))).toBe(2);
    });

    it("should spark a row and a box together when both complete at once", () => {
        const wrapper = mount(PixelGroupOverlay, { props: { effect: effectOf([{ kind: "row", index: 4 }, { kind: "box", index: 4 }]) } });

        expect(wrapper.findAll(".pixel-group-mark").map(mark => mark.classes().find(name => name !== "pixel-group-mark" && name.startsWith("pixel-group-"))))
            .toEqual(["pixel-group-row", "pixel-group-box"]);
    });
});
