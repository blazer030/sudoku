import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { CompletedGroup } from "@/domain/game/Sudoku";
import { STYLE_MOMENTS, type GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { groupPlacement } from "@/presentation/components/style-moments/groupPlacement";
import { useSettingsStore } from "@/stores/settingsStore";
import GroupOverlay from "@/presentation/components/style-moments/GroupOverlay.vue";
import ChalkboardGroupOverlay from "@/presentation/components/style-moments/chalkboard/ChalkboardGroupOverlay.vue";

const ROW_AND_BOX: CompletedGroup[] = [{ kind: "row", index: 4 }, { kind: "box", index: 4 }];

const effectOf = (groups: CompletedGroup[], id = 1): GroupEffect => ({ id, groups, origin: { row: 4, column: 4 } });

const percentOf = (style: string | undefined, property: string): number =>
    Number.parseFloat(new RegExp(`(?:^|;)\\s*${property}:\\s*(-?[\\d.]+)%`).exec(style ?? "")?.[1] ?? "NaN");

// Anything with attributes: a found element, or one got with get()
interface Styled {
    attributes: (key: string) => string | undefined;
}

const expectPlacedOver = (line: Styled, group: CompletedGroup): void => {
    for (const [property, value] of Object.entries(groupPlacement(group))) {
        expect(percentOf(line.attributes("style"), property), property).toBeCloseTo(Number.parseFloat(value), 3);
    }
};

const mountInGroupOverlay = (effect: GroupEffect) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useSettingsStore().setStyle("chalkboard");
    return mount(GroupOverlay, { props: { effect }, global: { plugins: [pinia] } });
};

// The point a path starts at, in its viewBox
const startOf = (path: string): { x: number; y: number } => {
    const [x = Number.NaN, y = Number.NaN] = /^M\s*(-?[\d.]+)[ ,]+(-?[\d.]+)/.exec(path)?.slice(1).map(Number) ?? [];
    return { x, y };
};

describe("ChalkboardGroupOverlay", () => {
    it("should be chalkboard's group overlay", () => {
        expect(STYLE_MOMENTS.chalkboard.groupOverlay).toBe(ChalkboardGroupOverlay);
    });

    it("should draw a row's line under its row, along its whole width", () => {
        const row: CompletedGroup = { kind: "row", index: 2 };
        const line = mount(ChalkboardGroupOverlay, { props: { effect: effectOf([row]) } }).get(".chalkboard-group-line");

        expect(line.attributes("data-kind")).toBe("row");
        expectPlacedOver(line, row);
        const [, , width, height] = (line.get("svg").attributes("viewBox") ?? "").split(" ").map(Number);
        const start = startOf(line.get("path").attributes("d") ?? "");
        // Near the bottom of the row's own strip
        expect(start.y).toBeGreaterThan(height * 0.75);
        expect(width).toBeGreaterThan(height);
    });

    it("should draw a column's line on its right, along its whole height", () => {
        const column: CompletedGroup = { kind: "column", index: 7 };
        const line = mount(ChalkboardGroupOverlay, { props: { effect: effectOf([column]) } }).get(".chalkboard-group-line");

        expect(line.attributes("data-kind")).toBe("column");
        expectPlacedOver(line, column);
        const [, , width, height] = (line.get("svg").attributes("viewBox") ?? "").split(" ").map(Number);
        const start = startOf(line.get("path").attributes("d") ?? "");
        expect(start.x).toBeGreaterThan(width * 0.75);
        expect(height).toBeGreaterThan(width);
    });

    it("should ring a box round its box", () => {
        const box: CompletedGroup = { kind: "box", index: 6 };
        const line = mount(ChalkboardGroupOverlay, { props: { effect: effectOf([box]) } }).get(".chalkboard-group-line");

        expect(line.attributes("data-kind")).toBe("box");
        expectPlacedOver(line, box);
        expect(line.get("svg").attributes("viewBox")).toBe("0 0 117 117");
    });

    it("should draw several groups together, each with dust of its own", () => {
        const groups: CompletedGroup[] = [...ROW_AND_BOX, { kind: "column", index: 4 }];
        const wrapper = mount(ChalkboardGroupOverlay, { props: { effect: effectOf(groups) } });
        const lines = wrapper.findAll(".chalkboard-group-line");

        expect(lines.map(line => line.attributes("data-kind"))).toEqual(["row", "box", "column"]);
        lines.forEach((line, position) => {
            expectPlacedOver(line, groups[position]);
            expect(line.findAll(".chalkboard-group-dust")).toHaveLength(3);
        });
        expect(wrapper.find("filter").exists()).toBe(false);
    });

    it("should draw each line in the primary chalk", () => {
        const wrapper = mount(ChalkboardGroupOverlay, { props: { effect: effectOf(ROW_AND_BOX) } });

        for (const line of wrapper.findAll(".chalkboard-group-line")) {
            expect(line.classes()).toContain("text-primary");
            expect(line.get("path").attributes("stroke")).toBe("currentColor");
        }
    });

    it("should draw a new effect's lines afresh", async () => {
        const wrapper = mountInGroupOverlay(effectOf(ROW_AND_BOX, 1));
        const firstLine = wrapper.get(".chalkboard-group-line").element;

        await wrapper.setProps({ effect: effectOf(ROW_AND_BOX, 2) });

        expect(wrapper.get(".chalkboard-group-line").element).not.toBe(firstLine);
    });
});
