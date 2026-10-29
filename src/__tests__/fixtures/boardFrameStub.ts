import { afterEach, beforeEach } from "vitest";
import { defineComponent, h, type PropType } from "vue";
import type { VueWrapper } from "@vue/test-utils";
import type { CellReference } from "@/domain/solver/SolveStep";
import type { GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import type { CelebrationPhase } from "@/presentation/pages/game/useGameSession";
import { STYLE_BOARD_FRAMES } from "@/presentation/components/board-frame/boardFrames";

/** A board frame that only wraps the board, so a test can read what the page hands a style's frame. */
export const StubBoardFrame = defineComponent({
    name: "StubBoardFrame",
    props: {
        target: { type: Object as PropType<CellReference | null>, default: null },
        effect: { type: Object as PropType<GroupEffect | null>, default: null },
        celebration: { type: String as PropType<CelebrationPhase | null>, default: null },
    },
    setup: (_props, { slots }) => () => h("div", { "data-testid": "board-frame-stub" }, slots.default?.()),
});

/** Frames minimal's boards (the default style) with the stub for each test of the calling suite. */
export const frameMinimalWithStubInEachTest = (): void => {
    const minimal = STYLE_BOARD_FRAMES.minimal;
    beforeEach(() => {
        STYLE_BOARD_FRAMES.minimal = StubBoardFrame;
    });
    afterEach(() => {
        STYLE_BOARD_FRAMES.minimal = minimal;
    });
};

export const frameTarget = (wrapper: VueWrapper): CellReference | null =>
    wrapper.findComponent(StubBoardFrame).props("target") as CellReference | null;
