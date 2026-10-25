import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { STYLE_MOMENTS, type GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { useSettingsStore } from "@/stores/settingsStore";
import GroupOverlay from "@/presentation/components/style-moments/GroupOverlay.vue";

const OverlayPieces = defineComponent({
    props: { effect: { type: Object, required: true } },
    setup: () => () => h("div", { "data-testid": "overlay-pieces" }),
});

const EFFECT: GroupEffect = { id: 3, groups: [{ kind: "row", index: 4 }], origin: { row: 4, column: 7 } };

const mountOverlay = (effect: GroupEffect | null) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useSettingsStore().setStyle("minimal");
    return mount(GroupOverlay, { props: { effect }, global: { plugins: [pinia] } });
};

describe("GroupOverlay", () => {
    const minimal = STYLE_MOMENTS.minimal;

    afterEach(() => {
        STYLE_MOMENTS.minimal = minimal;
    });

    it("should draw nothing over the board for a style without overlay pieces", () => {
        const wrapper = mountOverlay(EFFECT);

        expect(wrapper.find("[data-testid='group-overlay']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='group-overlay']").element.children).toHaveLength(0);
    });

    it("should draw the current style's overlay pieces for the running effect", () => {
        STYLE_MOMENTS.minimal = { ...minimal, groupOverlay: OverlayPieces };

        const wrapper = mountOverlay(EFFECT);

        expect(wrapper.findComponent(OverlayPieces).props("effect")).toEqual(EFFECT);
        expect(wrapper.find("[data-testid='group-overlay']").attributes("aria-hidden")).toBe("true");
    });

    it("should draw no pieces while no effect runs", () => {
        STYLE_MOMENTS.minimal = { ...minimal, groupOverlay: OverlayPieces };

        expect(mountOverlay(null).findComponent(OverlayPieces).exists()).toBe(false);
    });

    it("should start the pieces afresh for each new effect", async () => {
        STYLE_MOMENTS.minimal = { ...minimal, groupOverlay: OverlayPieces };
        const wrapper = mountOverlay(EFFECT);
        const first = wrapper.findComponent(OverlayPieces).vm;

        await wrapper.setProps({ effect: { ...EFFECT, id: 4 } });

        expect(wrapper.findComponent(OverlayPieces).vm).not.toBe(first);
    });
});
