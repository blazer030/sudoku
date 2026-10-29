import { nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import StepPlaybackPanel from "@/presentation/components/step-presentation/StepPlaybackPanel.vue";

const playState = (playing = false) => ({
    isPlaying: ref(playing),
    stopPlay: () => { /* noop */ },
    startPlay: () => { /* noop */ },
});

const mountPanel = (stepIndex: number, totalSteps: number, playing = false) =>
    mount(StepPlaybackPanel, {
        props: { stepIndex, totalSteps, playState: playState(playing), testIdPrefix: "demo", label: "Demo" },
        slots: { default: "Because." },
    });

describe("StepPlaybackPanel", () => {
    it("should page with the arrows and the dots", async () => {
        const wrapper = mountPanel(1, 3);

        for (let index = 0; index < 3; index++) {
            expect(wrapper.find(`[data-testid='demo-dot-${index}']`).exists()).toBe(true);
        }
        expect(wrapper.find("[data-testid='demo-dot-1']").attributes("aria-current")).toBe("step");

        await wrapper.find("[data-testid='demo-next']").trigger("click");
        await wrapper.find("[data-testid='demo-previous']").trigger("click");
        await wrapper.find("[data-testid='demo-dot-2']").trigger("click");

        expect(wrapper.emitted("next")).toHaveLength(1);
        expect(wrapper.emitted("previous")).toHaveLength(1);
        expect(wrapper.emitted("goTo")).toEqual([[2]]);
    });

    it("should mark the play button and the dots passed and current, so a style can draw them", () => {
        const wrapper = mountPanel(1, 3);
        const skinOf = (testId: string): string[] => (wrapper.find(`[data-testid='${testId}']`).attributes("data-skin") ?? "").split(" ");

        expect(skinOf("demo-play")).toEqual(["button", "play"]);
        expect(skinOf("demo-dot-0")).toEqual(["step-dot", "past"]);
        expect(skinOf("demo-dot-1")).toEqual(["step-dot", "current"]);
        expect(skinOf("demo-dot-2")).toEqual(["step-dot"]);
    });

    it("should disable the arrows at both ends", () => {
        expect(mountPanel(0, 3).find("[data-testid='demo-previous']").attributes("disabled")).toBeDefined();
        expect(mountPanel(2, 3).find("[data-testid='demo-next']").attributes("disabled")).toBeDefined();
    });

    it("should show one step count, the panel's own", () => {
        const wrapper = mountPanel(4, 12);

        const counters = wrapper.findAll("[data-testid='demo-step-counter']");
        expect(counters).toHaveLength(1);
        expect(counters[0].text()).toBe("5 / 12");
    });

    it("should fill the seek bar by step", () => {
        expect(mountPanel(0, 5).find("[data-testid='demo-progress-fill']").attributes("style")).toContain("width: 0%");
        expect(mountPanel(4, 5).find("[data-testid='demo-progress-fill']").attributes("style")).toContain("width: 100%");
    });

    it("should toggle play", async () => {
        const wrapper = mountPanel(0, 3);
        const play = wrapper.find("[data-testid='demo-play']");

        expect(play.attributes("aria-label")).toBe("Play");
        expect(play.attributes("aria-pressed")).toBe("false");
        await play.trigger("click");
        expect(wrapper.emitted("togglePlay")).toHaveLength(1);

        const playing = mountPanel(0, 3, true);
        expect(playing.find("[data-testid='demo-play']").attributes("aria-label")).toBe("Pause");
        expect(playing.find("[data-testid='demo-play']").attributes("aria-pressed")).toBe("true");

        i18n.global.locale.value = "zh-Hant";
        await nextTick();
        expect(wrapper.find("[data-testid='demo-play']").attributes("aria-label")).toBe("播放");
        expect(playing.find("[data-testid='demo-play']").attributes("aria-label")).toBe("暫停");
    });

    it("should render the explanation slot in the live region", () => {
        const wrapper = mountPanel(0, 3);

        const region = wrapper.find("[data-testid='demo-explanation-region']");
        expect(region.find("[data-testid='demo-explanation']").text()).toBe("Because.");
    });

    it("should keep room for three lines of explanation, or one when the explanations are short", () => {
        // The reserved room keeps the panel from jumping as explanations of 1 to 3 lines come and go;
        // a page whose explanations always fit one line (the game review) gives the room to its board
        const roomy = mountPanel(0, 3).find("[data-testid='demo-explanation-region']");
        expect(roomy.classes()).toContain("min-h-[4.6rem]");

        const compact = mount(StepPlaybackPanel, {
            props: { stepIndex: 0, totalSteps: 3, playState: playState(), testIdPrefix: "demo", label: "Demo", compactExplanation: true },
            slots: { default: "Because." },
        }).find("[data-testid='demo-explanation-region']");
        expect(compact.classes()).toContain("min-h-[1.45rem]");
        expect(compact.classes()).not.toContain("min-h-[4.6rem]");
    });
});
