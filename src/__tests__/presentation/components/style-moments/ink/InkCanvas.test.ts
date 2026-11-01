import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "@/stores/settingsStore";
import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";
import { createInkRenderer, type InkRenderer } from "@/presentation/components/style-moments/ink/canvas/inkRenderer";
import type { CelebrationPhase } from "@/presentation/components/style-moments/styleMoments";
import InkCanvas from "@/presentation/components/style-moments/ink/InkCanvas.vue";

vi.mock("@/presentation/composables/prefersReducedMotion", () => ({ prefersReducedMotion: vi.fn(() => false) }));
vi.mock("@/presentation/components/style-moments/ink/canvas/inkRenderer", () => ({ createInkRenderer: vi.fn() }));

const fakeRenderer = (): InkRenderer => ({ draw: vi.fn(), clear: vi.fn(), resize: vi.fn(), placeGrid: vi.fn(), dispose: vi.fn() });

const mountCanvas = async (celebration: CelebrationPhase | null = null) => {
    const wrapper = mount(InkCanvas, {
        props: {
            celebration,
            takes: undefined,
            "onUpdate:takes": (takes: string | undefined) => { void wrapper.setProps({ takes }); },
        },
    });
    await flushPromises();
    return wrapper;
};

// What the canvas has taken from the skin, as the board would carry it
const takesOf = (wrapper: Awaited<ReturnType<typeof mountCanvas>>): string | undefined => wrapper.props("takes");

describe("InkCanvas", () => {
    let renderer: InkRenderer;

    beforeEach(() => {
        setActivePinia(createPinia());
        // Settings persist from one test to the next
        useSettingsStore().setStyle("ink");
        useSettingsStore().setMotionEffects(true);
        renderer = fakeRenderer();
        vi.mocked(createInkRenderer).mockReturnValue(renderer);
        vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
        vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.mocked(createInkRenderer).mockReset();
        vi.mocked(prefersReducedMotion).mockReturnValue(false);
    });

    // Taken from the start, so the skin never starts a drop or a stroke the canvas then draws again
    it("should take the digits' drops and the groups' marks from the skin as soon as it can draw them", async () => {
        const wrapper = await mountCanvas();

        expect(takesOf(wrapper)).toBe("digit group");
        expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    });

    it("should take the celebration's washes from the skin and play them on its canvas", async () => {
        const wrapper = await mountCanvas();

        await wrapper.setProps({ celebration: "playing" });

        expect(takesOf(wrapper)).toBe("digit group celebration");
        expect(renderer.resize).toHaveBeenCalled();
        expect(window.requestAnimationFrame).toHaveBeenCalled();
        expect(wrapper.find("[data-testid='ink-canvas']").attributes("aria-hidden")).toBe("true");
        // Over the whole board, never in the way of a tap
        expect(wrapper.find("[data-testid='ink-canvas']").classes()).toEqual(expect.arrayContaining(["absolute", "inset-0", "size-full", "pointer-events-none"]));
    });

    it("should keep the washes through the dialog, and wipe them and give them back for the next game", async () => {
        const wrapper = await mountCanvas();
        await wrapper.setProps({ celebration: "playing" });

        await wrapper.setProps({ celebration: "done" });
        expect(takesOf(wrapper)).toBe("digit group celebration");

        await wrapper.setProps({ celebration: null });
        expect(takesOf(wrapper)).toBe("digit group");
        expect(renderer.clear).toHaveBeenCalled();
    });

    it("should leave the still celebration to the skin", async () => {
        const wrapper = await mountCanvas();

        await wrapper.setProps({ celebration: "still" });

        expect(takesOf(wrapper)).toBe("digit group");
        expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    });

    it("should load no WebGL and draw no canvas when motion is not allowed", async () => {
        useSettingsStore().setMotionEffects(false);

        const wrapper = await mountCanvas();

        expect(createInkRenderer).not.toHaveBeenCalled();
        expect(wrapper.find("[data-testid='ink-canvas']").exists()).toBe(false);
    });

    it("should load no WebGL while the dev switch compares the skin's washes", async () => {
        window.history.replaceState(null, "", "/?inkCanvas=off");
        try {
            const wrapper = await mountCanvas();

            expect(createInkRenderer).not.toHaveBeenCalled();
            expect(wrapper.find("[data-testid='ink-canvas']").exists()).toBe(false);
        } finally {
            window.history.replaceState(null, "", "/");
        }
    });

    it("should leave the washes to the skin where the browser has no WebGL", async () => {
        vi.mocked(createInkRenderer).mockReturnValue(null);
        const wrapper = await mountCanvas();

        await wrapper.setProps({ celebration: "playing" });

        expect(takesOf(wrapper)).toBeUndefined();
        expect(wrapper.find("[data-testid='ink-canvas']").exists()).toBe(false);
    });

    it("should give the washes back to the skin when the browser takes the context away", async () => {
        const wrapper = await mountCanvas();
        await wrapper.setProps({ celebration: "playing" });
        const onLost = vi.mocked(createInkRenderer).mock.calls[0]?.[2] ?? (() => { throw new Error("no renderer was made"); });

        onLost();
        await flushPromises();

        expect(takesOf(wrapper)).toBeUndefined();
        expect(wrapper.find("[data-testid='ink-canvas']").exists()).toBe(false);
    });

    // A celebration started before the module has loaded stays the skin's, rather than switching halfway
    it("should leave a celebration already playing when it became ready to the skin", async () => {
        const wrapper = await mountCanvas("playing");

        expect(takesOf(wrapper)).toBe("digit group");
    });

    it("should let the context go when the board leaves", async () => {
        const wrapper = await mountCanvas();

        wrapper.unmount();

        expect(renderer.dispose).toHaveBeenCalledTimes(1);
    });
});
