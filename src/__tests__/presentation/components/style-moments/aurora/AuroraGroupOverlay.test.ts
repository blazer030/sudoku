import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { CompletedGroup } from "@/domain/game/Sudoku";
import { STYLE_MOMENTS, type GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { groupPlacement } from "@/presentation/components/style-moments/groupPlacement";
import { useSettingsStore } from "@/stores/settingsStore";
import GroupOverlay from "@/presentation/components/style-moments/GroupOverlay.vue";
import AuroraGroupOverlay from "@/presentation/components/style-moments/aurora/AuroraGroupOverlay.vue";

const ROW_AND_BOX: CompletedGroup[] = [{ kind: "row", index: 4 }, { kind: "box", index: 4 }];

const effectOf = (groups: CompletedGroup[], id = 1, origin = { row: 4, column: 4 }): GroupEffect => ({ id, groups, origin });

const percentOf = (style: string | undefined, property: string): number =>
    Number.parseFloat(new RegExp(`(?:^|;)\\s*${property}:\\s*(-?[\\d.]+)%`).exec(style ?? "")?.[1] ?? "NaN");

// Anything with attributes: a found element, or one got with get()
interface Styled {
    attributes: (key: string) => string | undefined;
}

const expectPlacedOver = (piece: Styled, group: CompletedGroup): void => {
    for (const [property, value] of Object.entries(groupPlacement(group))) {
        expect(percentOf(piece.attributes("style"), property), property).toBeCloseTo(Number.parseFloat(value), 3);
    }
};

const PIECES = ".aurora-group-ribbon, .aurora-group-ring";

const mountOverlay = (effect: GroupEffect) => mount(AuroraGroupOverlay, { props: { effect } });

const mountInGroupOverlay = (effect: GroupEffect) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useSettingsStore().setStyle("aurora");
    return mount(GroupOverlay, { props: { effect }, global: { plugins: [pinia] } });
};

const originOf = (piece: { element: Element }): string => (piece.element as HTMLElement).style.transformOrigin;

describe("AuroraGroupOverlay", () => {
    it("should be aurora's group overlay", () => {
        expect(STYLE_MOMENTS.aurora.groupOverlay).toBe(AuroraGroupOverlay);
    });

    // GroupAurora: the streak glides along the line from the cell just filled
    it("should lay a ribbon over a completed row, swept out from the entered cell's column", () => {
        const row: CompletedGroup = { kind: "row", index: 2 };
        const wrapper = mountOverlay(effectOf([row], 1, { row: 2, column: 6 }));
        const ribbon = wrapper.get(".aurora-group-ribbon");

        expect(ribbon.attributes("data-kind")).toBe("row");
        expectPlacedOver(ribbon, row);
        expect(originOf(ribbon)).toBe(`${(6.5 / 9 * 100).toFixed(4)}% 50%`);
        expect(wrapper.find(".aurora-group-ring").exists()).toBe(false);
    });

    it("should lay a ribbon over a completed column, swept out from the entered cell's row", () => {
        const column: CompletedGroup = { kind: "column", index: 6 };
        const ribbon = mountOverlay(effectOf([column], 1, { row: 2, column: 6 })).get(".aurora-group-ribbon");

        expect(ribbon.attributes("data-kind")).toBe("column");
        expectPlacedOver(ribbon, column);
        expect(originOf(ribbon)).toBe(`50% ${(2.5 / 9 * 100).toFixed(4)}%`);
    });

    // GroupAurora's .pulse: one ring sent out from the middle of the finished box
    it("should ring a completed box from its centre", () => {
        const box: CompletedGroup = { kind: "box", index: 2 };
        const wrapper = mountOverlay(effectOf([box], 1, { row: 2, column: 6 }));
        const ring = wrapper.get(".aurora-group-ring");

        expectPlacedOver(ring, box);
        expect(originOf(ring)).toBe("");
        expect(wrapper.find(".aurora-group-ribbon").exists()).toBe(false);
    });

    it("should draw every group completed at once, each in its own place", () => {
        const groups: CompletedGroup[] = [...ROW_AND_BOX, { kind: "column", index: 4 }];
        const pieces = mountOverlay(effectOf(groups)).findAll(PIECES);

        expect(pieces.map(piece => piece.classes().includes("aurora-group-ring") ? "box" : piece.attributes("data-kind")))
            .toEqual(["row", "box", "column"]);
        pieces.forEach((piece, position) => {
            expectPlacedOver(piece, groups[position]);
        });
    });

    it("should hide every piece from assistive technology and from taps", () => {
        const pieces = mountOverlay(effectOf([...ROW_AND_BOX, { kind: "column", index: 4 }])).findAll(PIECES);

        expect(pieces).toHaveLength(3);
        for (const piece of pieces) {
            expect(piece.attributes("aria-hidden")).toBe("true");
            expect(piece.classes()).toEqual(expect.arrayContaining(["pointer-events-none", "absolute"]));
        }
    });

    it("should draw a new effect's pieces afresh", async () => {
        const wrapper = mountInGroupOverlay(effectOf(ROW_AND_BOX, 1));
        const first = wrapper.get(".aurora-group-ribbon").element;
        const firstRing = wrapper.get(".aurora-group-ring").element;

        await wrapper.setProps({ effect: effectOf(ROW_AND_BOX, 2) });

        expect(wrapper.get(".aurora-group-ribbon").element).not.toBe(first);
        expect(wrapper.get(".aurora-group-ring").element).not.toBe(firstRing);
    });
});
