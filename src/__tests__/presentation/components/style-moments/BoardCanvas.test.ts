import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h, onMounted } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { STYLE_MOMENTS, type CelebrationPhase } from "@/presentation/components/style-moments/styleMoments";
import { useSettingsStore } from "@/stores/settingsStore";
import BoardCanvas from "@/presentation/components/style-moments/BoardCanvas.vue";
import InkCanvas from "@/presentation/components/style-moments/ink/InkCanvas.vue";

// A style's canvas that takes the celebration as soon as it mounts
const TakingCanvas = defineComponent({
    props: { celebration: { type: String, default: null }, takes: { type: String, default: undefined } },
    emits: ["update:takes"],
    setup: (_, { emit }) => {
        onMounted(() => { emit("update:takes", "celebration"); });
        return () => h("canvas", { "data-testid": "style-canvas" });
    },
});

const mountBoardCanvas = (celebration: CelebrationPhase | null) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useSettingsStore().setStyle("minimal");
    return mount(BoardCanvas, { props: { celebration }, global: { plugins: [pinia] } });
};

describe("BoardCanvas", () => {
    const minimal = STYLE_MOMENTS.minimal;

    afterEach(() => {
        STYLE_MOMENTS.minimal = minimal;
    });

    it("should draw no canvas for a style that draws its moments in the skin", () => {
        expect(mountBoardCanvas("playing").find("canvas").exists()).toBe(false);
    });

    it("should give the style's canvas the celebration, and pass on what it takes from the skin", () => {
        STYLE_MOMENTS.minimal = { ...minimal, boardCanvas: TakingCanvas };

        const wrapper = mountBoardCanvas("playing");

        expect(wrapper.findComponent(TakingCanvas).props("celebration")).toBe("playing");
        const emitted = wrapper.emitted<[string | undefined]>("update:takes") ?? [];
        expect(emitted[emitted.length - 1]).toEqual(["celebration"]);
    });

    it("should give ink its canvas", () => {
        expect(STYLE_MOMENTS.ink.boardCanvas).toBe(InkCanvas);
    });
});
