import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import PaperGroupOverlay from "@/presentation/components/style-moments/paper/PaperGroupOverlay.vue";

const effectOf = (groups: GroupEffect["groups"]): GroupEffect => ({ id: 1, groups, origin: { row: 4, column: 4 } });

// Its left, top, width and height, as percentages of the board
const placementOf = (style: string | undefined): number[] =>
    ["left", "top", "width", "height"].map(property => Number.parseFloat(new RegExp(`${property}:\\s*([\\d.]+)%`).exec(style ?? "")?.[1] ?? "NaN"));

// Placements match to three decimals of a percent
const expectPlacement = (style: string | undefined, expected: number[]): void => {
    placementOf(style).forEach((value, index) => { expect(value).toBeCloseTo(expected[index], 3); });
};

describe("PaperGroupOverlay", () => {
    it("should strike a completed row through, along that row", () => {
        const mark = mount(PaperGroupOverlay, { props: { effect: effectOf([{ kind: "row", index: 3 }]) } }).get(".paper-group-mark");

        expect(mark.classes()).toContain("paper-group-row");
        expectPlacement(mark.attributes("style"), [0, 100 / 3, 100, 100 / 9]);
        expect(mark.find(".paper-group-stroke").exists()).toBe(true);
    });

    it("should strike a completed column down that column", () => {
        const mark = mount(PaperGroupOverlay, { props: { effect: effectOf([{ kind: "column", index: 8 }]) } }).get(".paper-group-mark");

        expect(mark.classes()).toContain("paper-group-column");
        expectPlacement(mark.attributes("style"), [800 / 9, 0, 100 / 9, 100]);
    });

    it("should loop a completed box, numbered from the top left", () => {
        const mark = mount(PaperGroupOverlay, { props: { effect: effectOf([{ kind: "box", index: 5 }]) } }).get(".paper-group-mark");

        expect(mark.classes()).toContain("paper-group-box");
        expectPlacement(mark.attributes("style"), [200 / 3, 100 / 3, 100 / 3, 100 / 3]);
    });

    it("should draw the strike and the loop together when a row and a box complete at once", () => {
        const wrapper = mount(PaperGroupOverlay, { props: { effect: effectOf([{ kind: "row", index: 4 }, { kind: "box", index: 4 }]) } });

        expect(wrapper.findAll(".paper-group-mark").map(mark => mark.classes().find(name => name !== "paper-group-mark" && name.startsWith("paper-group-"))))
            .toEqual(["paper-group-row", "paper-group-box"]);
    });
});
