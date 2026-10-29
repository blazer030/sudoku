import { afterEach, describe, expect, it, vi } from "vitest";
import { computed, h, type Component } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import BoardFrame from "@/presentation/components/board-frame/BoardFrame.vue";
import { STYLE_BOARD_FRAMES } from "@/presentation/components/board-frame/boardFrames";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { StubBoardFrame } from "@/__tests__/fixtures/boardFrameStub";
import { STYLE_IDS } from "@/theme/themeIds";

const currentFrame = vi.hoisted(() => ({ component: null as Component | null }));

vi.mock("@/presentation/components/board-frame/boardFrames", async (importOriginal) => ({
    ...await importOriginal<typeof import("@/presentation/components/board-frame/boardFrames")>(),
    useBoardFrame: () => computed(() => currentFrame.component),
}));

const EFFECT: GroupEffect = { id: 2, groups: [{ kind: "row", index: 4 }], origin: { row: 4, column: 7 } };

const mountFrame = (props: InstanceType<typeof BoardFrame>["$props"]) => mount(BoardFrame, {
    props,
    slots: { default: () => h("div", { "data-testid": "framed-board" }) },
    global: { plugins: [createPinia()] },
});

afterEach(() => {
    currentFrame.component = null;
});

describe("BoardFrame", () => {
    it("should give every style no frame yet", () => {
        expect(STYLE_IDS.map((style) => STYLE_BOARD_FRAMES[style])).toEqual(STYLE_IDS.map(() => null));
    });

    it("should render only the board when the style has no frame, with no element around it", () => {
        const wrapper = mountFrame({ target: { row: 1, column: 2 }, effect: null, celebration: null });

        expect(wrapper.html()).toBe("<div data-testid=\"framed-board\"></div>");
        expect(wrapper.findComponent(StubBoardFrame).exists()).toBe(false);
    });

    it("should hand the style's frame the target, the group effect and the celebration, around the board", () => {
        currentFrame.component = StubBoardFrame;

        const wrapper = mountFrame({ target: { row: 1, column: 2 }, effect: EFFECT, celebration: "playing" });

        const frame = wrapper.findComponent(StubBoardFrame);
        expect(frame.props()).toEqual({ target: { row: 1, column: 2 }, effect: EFFECT, celebration: "playing" });
        expect(frame.find("[data-testid='framed-board']").exists()).toBe(true);
    });
});
