import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import { mount } from "@vue/test-utils";
import { usePlaybackState } from "@/presentation/components/playback/usePlaybackState";

type PlaybackApi = ReturnType<typeof usePlaybackState>;

const mountComposable = (totalSteps: number, options?: Parameters<typeof usePlaybackState>[1]): PlaybackApi => {
    let api!: PlaybackApi;
    const Wrapper = defineComponent({
        setup() {
            api = usePlaybackState(ref(totalSteps), options);
            return () => null;
        },
    });
    mount(Wrapper);
    return api;
};

describe("usePlaybackState", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("should start at step 0 by default", () => {
        const { currentStep } = mountComposable(5);

        expect(currentStep.value).toBe(0);
    });

    it("should honor initialStep option", () => {
        const { currentStep } = mountComposable(5, { initialStep: 2 });

        expect(currentStep.value).toBe(2);
    });

    it("should advance currentStep via next", () => {
        const { currentStep, next } = mountComposable(5);

        next();

        expect(currentStep.value).toBe(1);
    });

    it("should not advance beyond totalSteps via next", () => {
        const { currentStep, next, goToLast } = mountComposable(3);
        goToLast();

        next();

        expect(currentStep.value).toBe(3);
    });

    it("should decrement via previous", () => {
        const { currentStep, previous, goToStep } = mountComposable(5);
        goToStep(3);

        previous();

        expect(currentStep.value).toBe(2);
    });

    it("should not go below 0 via previous", () => {
        const { currentStep, previous } = mountComposable(5);

        previous();

        expect(currentStep.value).toBe(0);
    });

    it("should jump to 0 via goToFirst", () => {
        const { currentStep, goToFirst, goToStep } = mountComposable(5);
        goToStep(3);

        goToFirst();

        expect(currentStep.value).toBe(0);
    });

    it("should jump to totalSteps via goToLast", () => {
        const { currentStep, goToLast } = mountComposable(5);

        goToLast();

        expect(currentStep.value).toBe(5);
    });

    it("togglePlay advances currentStep at intervalMs tick", () => {
        vi.useFakeTimers();
        const { currentStep, isPlaying, togglePlay } = mountComposable(5, { intervalMs: 100 });

        togglePlay();
        expect(isPlaying.value).toBe(true);

        vi.advanceTimersByTime(100);
        expect(currentStep.value).toBe(1);

        vi.advanceTimersByTime(100);
        expect(currentStep.value).toBe(2);
    });

    it("togglePlay toggles off when already playing", () => {
        vi.useFakeTimers();
        const { isPlaying, togglePlay } = mountComposable(5);

        togglePlay();
        expect(isPlaying.value).toBe(true);

        togglePlay();
        expect(isPlaying.value).toBe(false);
    });

    it("stops playing when reaching totalSteps", () => {
        vi.useFakeTimers();
        const { isPlaying, currentStep, togglePlay } = mountComposable(2, { intervalMs: 100 });

        togglePlay();
        vi.advanceTimersByTime(100);
        vi.advanceTimersByTime(100);

        expect(currentStep.value).toBe(2);
        expect(isPlaying.value).toBe(false);
    });

    it("togglePlay restarts from 0 when already at totalSteps", () => {
        vi.useFakeTimers();
        const { currentStep, goToLast, togglePlay } = mountComposable(3, { intervalMs: 100 });
        goToLast();

        togglePlay();

        expect(currentStep.value).toBe(0);
    });
});
