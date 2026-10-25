import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { CompletedGroup } from "@/domain/game/Sudoku";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { groupPlacement } from "@/presentation/components/style-moments/groupPlacement";
import { useSettingsStore } from "@/stores/settingsStore";
import GroupOverlay from "@/presentation/components/style-moments/GroupOverlay.vue";
import InkGroupOverlay from "@/presentation/components/style-moments/ink/InkGroupOverlay.vue";
import { animationTimingOf, declarationsOf } from "../../../../style/styleSheetRules";

const INK_CSS = readFileSync("src/style/styles/ink/skin.css", "utf8");

const ROW_AND_BOX: CompletedGroup[] = [{ kind: "row", index: 4 }, { kind: "box", index: 4 }];

const effectOf = (groups: CompletedGroup[], id = 1): GroupEffect => ({ id, groups, origin: { row: 4, column: 4 } });

const percentOf = (style: string | undefined, property: string): number =>
    Number.parseFloat(new RegExp(`(?:^|;)\\s*${property}:\\s*(-?[\\d.]+)%`).exec(style ?? "")?.[1] ?? "NaN");

// Anything with attributes: a found element, or one got with get()
interface Styled {
    attributes: (key: string) => string | undefined;
}

const expectPlacedOver = (brush: Styled, group: CompletedGroup): void => {
    for (const [property, value] of Object.entries(groupPlacement(group))) {
        expect(percentOf(brush.attributes("style"), property), property).toBeCloseTo(Number.parseFloat(value), 3);
    }
};

// When the skin starts a brush of this kind, and its reveal
const startsOf = (kind: string): { brush: number; reveal: number } => {
    const brush = declarationsOf(INK_CSS, `[data-style="ink"] .ink-group-brush[data-kind="${kind}"]`).get("animation") ?? "";
    const reveal = declarationsOf(INK_CSS, `[data-style="ink"] .ink-group-brush[data-kind="${kind}"] .ink-group-reveal`).get("animation") ?? "";
    return {
        brush: animationTimingOf(brush, "ink-brush-life")?.fixedDelayMs ?? Number.NaN,
        reveal: animationTimingOf(reveal, "ink-brush-reveal")?.fixedDelayMs ?? Number.NaN,
    };
};

// Each brush's mask id, checking that its ink is drawn through that mask
const maskIdsOf = (wrapper: VueWrapper): string[] => wrapper.findAll(".ink-group-brush").map((brush) => {
    const id = brush.get("mask").attributes("id") ?? "";
    expect(brush.find(`[mask="url(#${id})"]`).exists()).toBe(true);
    return id;
});

const mountInGroupOverlay = (effect: GroupEffect) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useSettingsStore().setStyle("ink");
    return mount(GroupOverlay, { props: { effect }, global: { plugins: [pinia] } });
};

describe("InkGroupOverlay", () => {
    it("should sweep one brush over a completed row and ring the completed box, each over its group", () => {
        const wrapper = mount(InkGroupOverlay, { props: { effect: effectOf(ROW_AND_BOX) } });
        const brushes = wrapper.findAll(".ink-group-brush");

        expect(brushes.map(brush => brush.attributes("data-kind"))).toEqual(["row", "box"]);
        brushes.forEach((brush, position) => { expectPlacedOver(brush, ROW_AND_BOX[position]); });
        for (const brush of brushes) {
            expect(brush.find("mask .ink-group-reveal").exists()).toBe(true);
        }
        expect(wrapper.find("filter").exists()).toBe(false);
    });

    it("should sweep a completed column down its column", () => {
        const column: CompletedGroup = { kind: "column", index: 7 };
        const brush = mount(InkGroupOverlay, { props: { effect: effectOf([column]) } }).get(".ink-group-brush");

        expect(brush.attributes("data-kind")).toBe("column");
        expectPlacedOver(brush, column);
    });

    it("should ring the box a beat after the row's stroke starts, so both strokes draw", () => {
        const wrapper = mount(InkGroupOverlay, { props: { effect: effectOf(ROW_AND_BOX) } });
        const [row, box] = wrapper.findAll(".ink-group-brush").map(brush => startsOf(brush.attributes("data-kind") ?? ""));

        expect(box.brush).toBeGreaterThan(row.brush);
        // The box's stroke is drawn on as its brush shows, a beat after the row's, like the row's own
        expect(box.reveal - row.reveal).toBe(box.brush - row.brush);
    });

    it("should give each brush its own mask", () => {
        const wrapper = mount(InkGroupOverlay, { props: { effect: effectOf([...ROW_AND_BOX, { kind: "column", index: 4 }]) } });
        const ids = maskIdsOf(wrapper);

        expect(ids.every(id => id !== "")).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("should draw a new effect's brushes afresh, with masks of their own", async () => {
        const wrapper = mountInGroupOverlay(effectOf(ROW_AND_BOX, 1));
        const firstBrush = wrapper.get(".ink-group-brush").element;
        const firstIds = maskIdsOf(wrapper);

        await wrapper.setProps({ effect: effectOf(ROW_AND_BOX, 2) });

        expect(wrapper.get(".ink-group-brush").element).not.toBe(firstBrush);
        expect(maskIdsOf(wrapper).some(id => firstIds.includes(id))).toBe(false);
    });
});
