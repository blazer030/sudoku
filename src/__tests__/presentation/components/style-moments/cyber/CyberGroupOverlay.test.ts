import { describe, expect, it } from "vitest";
import { mount, type DOMWrapper } from "@vue/test-utils";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import CyberGroupOverlay from "@/presentation/components/style-moments/cyber/CyberGroupOverlay.vue";

const effectOf = (groups: GroupEffect["groups"], origin = { row: 4, column: 4 }): GroupEffect => ({ id: 1, groups, origin });

// A length in the style, as a percentage of the board
const percentOf = (style: string | undefined, property: string): number =>
    Number.parseFloat(new RegExp(`(?:^|;)\\s*${property}:\\s*(?:calc\\()?([\\d.]+)%`).exec(style ?? "")?.[1] ?? "NaN");

// Anything with attributes: a found element, or one got with get()
interface Styled {
    attributes: (key: string) => string | undefined;
}

const expectPercents = (element: Styled, expected: Record<string, number>): void => {
    for (const [property, value] of Object.entries(expected)) {
        expect(percentOf(element.attributes("style"), property), property).toBeCloseTo(value, 3);
    }
};

const tagOf = (wrapper: ReturnType<typeof mount>, text: string): DOMWrapper<Element> => {
    const tag = wrapper.findAll(".cyber-group-tag").find(item => item.text() === text);
    if (tag === undefined) throw new Error(`no tag ${text}`);
    return tag;
};

describe("CyberGroupOverlay", () => {
    it("should shoot two beams from the entered cell to both ends of a completed row, and tag it ROW n OK", () => {
        const wrapper = mount(CyberGroupOverlay, { props: { effect: effectOf([{ kind: "row", index: 3 }], { row: 3, column: 2 }) } });
        const line = wrapper.get(".cyber-group-row");

        expectPercents(line, { left: 0, top: 100 / 3, width: 100, height: 100 / 9 });
        // From the row's start to the entered cell's centre, and from there to its end
        expectPercents(line.get(".cyber-group-beam-back"), { left: 0, width: 250 / 9, top: 0, height: 100 });
        expectPercents(line.get(".cyber-group-beam-forward"), { left: 250 / 9, width: 650 / 9, top: 0, height: 100 });
        // On the row's top line, at its head
        const tag = tagOf(wrapper, "ROW 4 OK");
        expectPercents(tag, { top: 100 / 3 });
        expect(tag.attributes("style")).toContain("left: 18px");
        expect(tag.attributes("aria-hidden")).toBe("true");
        // English in both languages: its tracking is inline, since Chinese drops the tracking classes
        expect(tag.attributes("style")).toContain("letter-spacing: 0.1em");
        expect(tag.classes().some(name => name.startsWith("tracking-"))).toBe(false);
    });

    it("should shoot the beams up and down a completed column and tag it COL n OK near its foot", () => {
        const wrapper = mount(CyberGroupOverlay, { props: { effect: effectOf([{ kind: "column", index: 6 }], { row: 0, column: 6 }) } });
        const line = wrapper.get(".cyber-group-column");

        expectPercents(line, { left: 200 / 3, top: 0, width: 100 / 9, height: 100 });
        expectPercents(line.get(".cyber-group-beam-back"), { top: 0, height: 50 / 9, left: 0, width: 100 });
        expectPercents(line.get(".cyber-group-beam-forward"), { top: 50 / 9, height: 850 / 9, left: 0, width: 100 });
        const tag = tagOf(wrapper, "COL 7 OK");
        expect(tag.attributes("style")).toContain("bottom: 18px");
        expectPercents(tag, { left: 650 / 9 });
    });

    it("should keep an edge column's tag on the board", () => {
        const first = mount(CyberGroupOverlay, { props: { effect: effectOf([{ kind: "column", index: 0 }], { row: 4, column: 0 }) } });
        const last = mount(CyberGroupOverlay, { props: { effect: effectOf([{ kind: "column", index: 8 }], { row: 4, column: 8 }) } });

        expect(tagOf(first, "COL 1 OK").attributes("style")).toContain("left: 2px");
        expect(tagOf(last, "COL 9 OK").attributes("style")).toContain("right: 2px");
    });

    it("should step a box's outline out from the entered cell and tag it BOX n OK in yellow, numbered from the top left", () => {
        const wrapper = mount(CyberGroupOverlay, { props: { effect: effectOf([{ kind: "box", index: 5 }], { row: 5, column: 7 }) } });
        const frame = wrapper.get(".cyber-group-frame");

        expectPercents(frame, { left: 200 / 3, top: 100 / 3, width: 100 / 3, height: 100 / 3 });
        // The entered cell is the box's middle column and bottom row: the outline grows from there
        expect(frame.attributes("style")).toContain("transform-origin: 50% 100%");
        const tag = tagOf(wrapper, "BOX 6 OK");
        expect(tag.classes()).toContain("cyber-group-tag-box");
        expectPercents(tag, { top: 100 / 3, left: 200 / 3 });
    });

    it("should put the top row's and the top boxes' tags on their lower line, so the board's edge does not cut them", () => {
        const row = mount(CyberGroupOverlay, { props: { effect: effectOf([{ kind: "row", index: 0 }], { row: 0, column: 4 }) } });
        const box = mount(CyberGroupOverlay, { props: { effect: effectOf([{ kind: "box", index: 1 }], { row: 1, column: 4 }) } });

        expectPercents(tagOf(row, "ROW 1 OK"), { top: 100 / 9 });
        expectPercents(tagOf(box, "BOX 2 OK"), { top: 100 / 3 });
    });

    it("should run a row and a box together, moving the row's tag to the far end when the box is at its head", () => {
        const wrapper = mount(CyberGroupOverlay, { props: { effect: effectOf([{ kind: "row", index: 3 }, { kind: "box", index: 3 }], { row: 3, column: 1 }) } });

        expect(wrapper.find(".cyber-group-row").exists()).toBe(true);
        expect(wrapper.find(".cyber-group-frame").exists()).toBe(true);
        const rowTag = tagOf(wrapper, "ROW 4 OK");
        expect(rowTag.attributes("style")).toContain("right: 18px");
        expect(rowTag.attributes("style")).not.toContain("left:");
        expect(tagOf(wrapper, "BOX 4 OK").attributes("style")).toContain("6px");
        // Even on the top row, whose tag sits on a different line from the top box's
        const top = mount(CyberGroupOverlay, { props: { effect: effectOf([{ kind: "row", index: 0 }, { kind: "box", index: 0 }], { row: 0, column: 1 }) } });
        expect(tagOf(top, "ROW 1 OK").attributes("style")).toContain("right: 18px");
    });

    it("should leave the row's tag at its head when the box is elsewhere", () => {
        const wrapper = mount(CyberGroupOverlay, { props: { effect: effectOf([{ kind: "row", index: 4 }, { kind: "box", index: 4 }]) } });

        expect(tagOf(wrapper, "ROW 5 OK").attributes("style")).toContain("left: 18px");
    });
});
