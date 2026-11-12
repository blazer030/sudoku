import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "@/stores/settingsStore";
import { prefersReducedMotion } from "@/presentation/composables/prefersReducedMotion";
import { createInkRenderer, type InkRenderer } from "@/presentation/components/style-moments/ink/canvas/inkRenderer";
import type { CelebrationPhase, GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import type { InkFrame } from "@/presentation/components/style-moments/ink/canvas/inkTimeline";
import InkCanvas from "@/presentation/components/style-moments/ink/InkCanvas.vue";

vi.mock("@/presentation/composables/prefersReducedMotion", () => ({ prefersReducedMotion: vi.fn(() => false) }));
vi.mock("@/presentation/components/style-moments/ink/canvas/inkRenderer", () => ({ createInkRenderer: vi.fn() }));

const fakeRenderer = (): InkRenderer => ({ draw: vi.fn(), clear: vi.fn(), resize: vi.fn(), placeGrid: vi.fn(), dispose: vi.fn() });

const mountCanvas = async (celebration: CelebrationPhase | null = null) => {
    const wrapper = mount(InkCanvas, {
        props: {
            celebration,
            effect: null as GroupEffect | null,
            takes: undefined,
            "onUpdate:takes": (takes: string | undefined) => { void wrapper.setProps({ takes }); },
        },
    });
    await flushPromises();
    return wrapper;
};

// Runs the frames the canvas has asked for so far, and gives the last frame it drew. A copy of the calls, as each
// frame asks for the next: walking the live list would spin on real time until the ink settles.
const runFrames = (renderer: InkRenderer): InkFrame | undefined => {
    for (const [callback] of [...vi.mocked(window.requestAnimationFrame).mock.calls]) callback(performance.now() + 100);
    return vi.mocked(renderer.draw).mock.lastCall?.[0];
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

    // A cell beside the canvas on the board, as BoardCell places it
    const addCell = (wrapper: Awaited<ReturnType<typeof mountCanvas>>, row: number, column: number): HTMLElement => {
        const cell = document.createElement("div");
        cell.setAttribute("data-variant", "default");
        cell.style.setProperty("--cell-row", String(row));
        cell.style.setProperty("--cell-column", String(column));
        wrapper.find("[data-testid='ink-canvas']").element.parentElement?.append(cell);
        return cell;
    };

    it("should drop ink under a digit as it arrives in its cell", async () => {
        const wrapper = await mountCanvas();
        const cell = addCell(wrapper, 4, 2);

        cell.setAttribute("data-arriving", "");
        await flushPromises();
        const frame = runFrames(renderer);

        expect(frame?.fills[0]).toBeCloseTo(2.5 / 9);
        expect(frame?.fills[1]).toBeCloseTo(4.5 / 9);
        expect(frame?.fills[2]).toBeGreaterThanOrEqual(0);
        wrapper.unmount();
    });

    it("should drop nothing as a digit settles or a cell changes otherwise", async () => {
        const wrapper = await mountCanvas();
        const cell = addCell(wrapper, 4, 2);
        cell.setAttribute("data-arriving", "");
        await flushPromises();

        cell.removeAttribute("data-arriving");
        cell.setAttribute("data-variant", "selected");
        await flushPromises();
        const frame = runFrames(renderer);

        // The one drop that arrived, and no other
        expect(frame?.fills[2]).toBeGreaterThanOrEqual(0);
        expect(frame?.fills[6]).toBeLessThan(0);
        wrapper.unmount();
    });

    it("should brush each group a new group effect completes, placed by the grid's cells", async () => {
        const wrapper = await mountCanvas();

        await wrapper.setProps({ effect: { id: 1, groups: [{ kind: "row", index: 2 }, { kind: "box", index: 4 }], origin: { row: 2, column: 4 } } });
        const frame = runFrames(renderer);

        expect(renderer.placeGrid).toHaveBeenCalled();
        expect([...(frame?.groups.slice(0, 2) ?? [])]).toEqual([0, 2]);
        expect([...(frame?.groups.slice(4, 6) ?? [])]).toEqual([2, 4]);
    });

    // The effect ending (or none at all) starts nothing; its marks fade on their own clock
    it("should brush nothing as a group effect ends", async () => {
        const wrapper = await mountCanvas();
        await wrapper.setProps({ effect: { id: 1, groups: [{ kind: "row", index: 2 }], origin: { row: 2, column: 4 } } });
        vi.mocked(window.requestAnimationFrame).mockClear();

        await wrapper.setProps({ effect: null });

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
