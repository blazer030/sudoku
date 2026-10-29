import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { CompletedGroup } from "@/domain/game/Sudoku";
import { STYLE_MOMENTS, type GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { groupPlacement } from "@/presentation/components/style-moments/groupPlacement";
import { useSettingsStore } from "@/stores/settingsStore";
import GroupOverlay from "@/presentation/components/style-moments/GroupOverlay.vue";
import BlueprintGroupOverlay from "@/presentation/components/style-moments/blueprint/BlueprintGroupOverlay.vue";

const ROW_AND_BOX: CompletedGroup[] = [{ kind: "row", index: 4 }, { kind: "box", index: 4 }];

const effectOf = (groups: CompletedGroup[], id = 1, origin = { row: 4, column: 4 }): GroupEffect => ({ id, groups, origin });

const percentOf = (style: string | undefined, property: string): number =>
    Number.parseFloat(new RegExp(`(?:^|;)\\s*${property}:\\s*(-?[\\d.]+)%`).exec(style ?? "")?.[1] ?? "NaN");

// Anything with attributes: a found element, or one got with get()
interface Styled {
    attributes: (key: string) => string | undefined;
}

const expectPlacedOver = (dimension: Styled, group: CompletedGroup): void => {
    for (const [property, value] of Object.entries(groupPlacement(group))) {
        expect(percentOf(dimension.attributes("style"), property), property).toBeCloseTo(Number.parseFloat(value), 3);
    }
};

const mountOverlay = (effect: GroupEffect) => mount(BlueprintGroupOverlay, { props: { effect } });

const mountInGroupOverlay = (effect: GroupEffect) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useSettingsStore().setStyle("blueprint");
    return mount(GroupOverlay, { props: { effect }, global: { plugins: [pinia] } });
};

describe("BlueprintGroupOverlay", () => {
    it("should be blueprint's group overlay", () => {
        expect(STYLE_MOMENTS.blueprint.groupOverlay).toBe(BlueprintGroupOverlay);
    });

    it("should rule a row's dimension along it, a stop at each end, marked with the row and its nine cells", () => {
        const row: CompletedGroup = { kind: "row", index: 4 };
        const dimension = mountOverlay(effectOf([row])).get(".blueprint-group-dimension");

        expect(dimension.attributes("data-kind")).toBe("row");
        expectPlacedOver(dimension, row);
        expect(dimension.findAll(".blueprint-group-line")).toHaveLength(1);
        expect(dimension.findAll(".blueprint-group-stop")).toHaveLength(2);
        expect(dimension.find(".blueprint-group-frame").exists()).toBe(false);
        expect(dimension.get(".blueprint-group-label").text()).toBe("R5 · 9");
    });

    it("should rule a column's dimension down it, marked with the column and its nine cells", () => {
        const column: CompletedGroup = { kind: "column", index: 4 };
        const dimension = mountOverlay(effectOf([column])).get(".blueprint-group-dimension");

        expect(dimension.attributes("data-kind")).toBe("column");
        expectPlacedOver(dimension, column);
        expect(dimension.findAll(".blueprint-group-line")).toHaveLength(1);
        expect(dimension.findAll(".blueprint-group-stop")).toHaveLength(2);
        expect(dimension.get(".blueprint-group-label").text()).toBe("C5 · 9");
    });

    it("should frame a box in a dashed line of the primary, marked with the box", () => {
        const box: CompletedGroup = { kind: "box", index: 4 };
        const dimension = mountOverlay(effectOf([box])).get(".blueprint-group-dimension");

        expect(dimension.attributes("data-kind")).toBe("box");
        expectPlacedOver(dimension, box);
        const frame = dimension.get(".blueprint-group-frame");
        const outline = frame.get("rect");
        expect(frame.classes()).toContain("text-primary");
        expect(outline.attributes("stroke")).toBe("currentColor");
        expect(outline.attributes("stroke-dasharray")).toBeDefined();
        expect(outline.attributes("fill")).toBe("none");
        expect(dimension.find(".blueprint-group-line").exists()).toBe(false);
        expect(dimension.get(".blueprint-group-label").text()).toBe("B5");
    });

    it.each([
        { group: { kind: "row", index: 0 } as CompletedGroup, label: "R1 · 9" },
        { group: { kind: "column", index: 8 } as CompletedGroup, label: "C9 · 9" },
        { group: { kind: "box", index: 6 } as CompletedGroup, label: "B7" },
    ])("should mark $group.kind $group.index as $label, where groupPlacement puts it", ({ group, label }) => {
        const dimension = mountOverlay(effectOf([group])).get(".blueprint-group-dimension");

        expectPlacedOver(dimension, group);
        expect(dimension.get(".blueprint-group-label").text()).toBe(label);
    });

    it("should draw the labels in the primary, on the paper, so no graph line runs under them", () => {
        for (const label of mountOverlay(effectOf(ROW_AND_BOX)).findAll(".blueprint-group-label")) {
            expect(label.classes()).toEqual(expect.arrayContaining(["text-primary", "bg-background", "font-blueprint-mono"]));
        }
    });

    // The pieces snap out from the cell just filled: a line along its length, a box from that cell's place in it
    it("should snap each piece out from the entered cell", () => {
        const wrapper = mountOverlay(effectOf([{ kind: "row", index: 2 }, { kind: "column", index: 6 }, { kind: "box", index: 2 }], 1, { row: 2, column: 6 }));
        const [row, column, box] = wrapper.findAll(".blueprint-group-dimension").map(dimension => (dimension.element as HTMLElement).style.transformOrigin);

        expect(row).toBe(`${(6.5 / 9 * 100).toFixed(4)}% 50%`);
        expect(column).toBe(`50% ${(2.5 / 9 * 100).toFixed(4)}%`);
        // Column 6 is the box's first, row 2 its last
        expect(box).toBe(`${(0.5 / 3 * 100).toFixed(4)}% ${(2.5 / 3 * 100).toFixed(4)}%`);
    });

    it("should draw several groups together, each labelled in its own place", () => {
        const groups: CompletedGroup[] = [...ROW_AND_BOX, { kind: "column", index: 4 }];
        const dimensions = mountOverlay(effectOf(groups)).findAll(".blueprint-group-dimension");

        expect(dimensions.map(dimension => dimension.attributes("data-kind"))).toEqual(["row", "box", "column"]);
        dimensions.forEach((dimension, position) => {
            expectPlacedOver(dimension, groups[position]);
            expect(dimension.findAll(".blueprint-group-label")).toHaveLength(1);
        });
        expect(dimensions.map(dimension => dimension.get(".blueprint-group-label").text())).toEqual(["R5 · 9", "B5", "C5 · 9"]);
    });

    it("should draw a new effect's dimensions afresh", async () => {
        const wrapper = mountInGroupOverlay(effectOf(ROW_AND_BOX, 1));
        const first = wrapper.get(".blueprint-group-dimension").element;

        await wrapper.setProps({ effect: effectOf(ROW_AND_BOX, 2) });

        expect(wrapper.get(".blueprint-group-dimension").element).not.toBe(first);
    });
});
