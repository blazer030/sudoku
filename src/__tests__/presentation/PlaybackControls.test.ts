import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { Pause, Play } from "lucide-vue-next";
import PlaybackControls from "@/presentation/components/playback/PlaybackControls.vue";

describe("PlaybackControls", () => {
    it("should emit 'first' when first button is clicked", async () => {
        const wrapper = mount(PlaybackControls, { props: { isPlaying: false } });

        await wrapper.find("[data-testid='first-step-button']").trigger("click");

        expect(wrapper.emitted("first")).toHaveLength(1);
    });

    it("should emit 'prev' when prev button is clicked", async () => {
        const wrapper = mount(PlaybackControls, { props: { isPlaying: false } });

        await wrapper.find("[data-testid='prev-step-button']").trigger("click");

        expect(wrapper.emitted("prev")).toHaveLength(1);
    });

    it("should emit 'toggle-play' when play button is clicked", async () => {
        const wrapper = mount(PlaybackControls, { props: { isPlaying: false } });

        await wrapper.find("[data-testid='play-button']").trigger("click");

        expect(wrapper.emitted("toggle-play")).toHaveLength(1);
    });

    it("should emit 'next' when next button is clicked", async () => {
        const wrapper = mount(PlaybackControls, { props: { isPlaying: false } });

        await wrapper.find("[data-testid='next-step-button']").trigger("click");

        expect(wrapper.emitted("next")).toHaveLength(1);
    });

    it("should emit 'last' when last button is clicked", async () => {
        const wrapper = mount(PlaybackControls, { props: { isPlaying: false } });

        await wrapper.find("[data-testid='last-step-button']").trigger("click");

        expect(wrapper.emitted("last")).toHaveLength(1);
    });

    it("should show Pause icon when isPlaying is true", () => {
        const wrapper = mount(PlaybackControls, { props: { isPlaying: true } });

        expect(wrapper.findComponent(Pause).exists()).toBe(true);
        expect(wrapper.findComponent(Play).exists()).toBe(false);
    });

    it("should show Play icon when isPlaying is false", () => {
        const wrapper = mount(PlaybackControls, { props: { isPlaying: false } });

        expect(wrapper.findComponent(Play).exists()).toBe(true);
        expect(wrapper.findComponent(Pause).exists()).toBe(false);
    });

    it("should prefix testids when testidPrefix is given", () => {
        const wrapper = mount(PlaybackControls, { props: { isPlaying: false, testidPrefix: "review-" } });

        expect(wrapper.find("[data-testid='review-first-step-button']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='review-play-button']").exists()).toBe(true);
        expect(wrapper.find("[data-testid='review-last-step-button']").exists()).toBe(true);
    });
});
