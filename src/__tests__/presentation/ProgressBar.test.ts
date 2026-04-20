import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { mount } from "@vue/test-utils";
import ProgressBar from "@/presentation/components/playback/ProgressBar.vue";

const noopPlayState = () => ({
    isPlaying: ref(false),
    stopPlay: () => { /* noop */ },
    startPlay: () => { /* noop */ },
});

describe("ProgressBar", () => {
    it("should render 0% fill at currentStep 0", () => {
        const wrapper = mount(ProgressBar, {
            props: { currentStep: 0, totalSteps: 5, playState: noopPlayState() },
        });

        expect(wrapper.find("[data-testid='progress-fill']").attributes("style")).toContain("width: 0%");
    });

    it("should render 100% fill when currentStep equals totalSteps", () => {
        const wrapper = mount(ProgressBar, {
            props: { currentStep: 5, totalSteps: 5, playState: noopPlayState() },
        });

        expect(wrapper.find("[data-testid='progress-fill']").attributes("style")).toContain("width: 100%");
    });

    it("should render proportional fill for intermediate steps", () => {
        const wrapper = mount(ProgressBar, {
            props: { currentStep: 2, totalSteps: 4, playState: noopPlayState() },
        });

        expect(wrapper.find("[data-testid='progress-fill']").attributes("style")).toContain("width: 50%");
    });

    it("should display 0% fill when totalSteps is 0", () => {
        const wrapper = mount(ProgressBar, {
            props: { currentStep: 0, totalSteps: 0, playState: noopPlayState() },
        });

        expect(wrapper.find("[data-testid='progress-fill']").attributes("style")).toContain("width: 0%");
    });

    it("should display step counter text", () => {
        const wrapper = mount(ProgressBar, {
            props: { currentStep: 3, totalSteps: 7, playState: noopPlayState() },
        });

        expect(wrapper.find("[data-testid='step-counter']").text()).toBe("Step 3 of 7");
    });

    it("should prefix testids when testidPrefix is given", () => {
        const wrapper = mount(ProgressBar, {
            props: { currentStep: 1, totalSteps: 5, playState: noopPlayState(), testidPrefix: "review-" },
        });

        expect(wrapper.find("[data-testid='review-progress-bar']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='review-progress-fill']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='review-step-counter']").exists()).toBe(true);
    });

    it("should apply text-center to step counter when counterAlign='center'", () => {
        const wrapper = mount(ProgressBar, {
            props: { currentStep: 1, totalSteps: 5, playState: noopPlayState(), counterAlign: "center" },
        });

        expect(wrapper.find("[data-testid='step-counter']").classes()).toContain("text-center");
    });
});
