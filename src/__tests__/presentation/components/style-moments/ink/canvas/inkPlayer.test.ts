import { describe, expect, it, vi } from "vitest";
import { createInkPlayer, type FrameClock, type InkFrameRenderer } from "@/presentation/components/style-moments/ink/canvas/inkPlayer";
import { bloomUniforms, scheduleEffects, type InkBloom } from "@/presentation/components/style-moments/ink/canvas/inkTimeline";

const BLOOM: InkBloom = { kind: "bloom", centre: { x: 0.5, y: 0.5 }, radius: 0.4, delayMs: 0, durationMs: 1000 };

// A clock whose frames run only when the test steps them
const fakeClock = () => {
    let nowMs = 0;
    let nextHandle = 1;
    const pending = new Map<number, (nowMs: number) => void>();
    const clock: FrameClock = {
        now: () => nowMs,
        request: (callback) => {
            const handle = nextHandle++;
            pending.set(handle, callback);
            return handle;
        },
        cancel: (handle) => { pending.delete(handle); },
    };
    const step = (toMs: number) => {
        nowMs = toMs;
        const callbacks = [...pending.values()];
        pending.clear();
        for (const callback of callbacks) callback(nowMs);
    };
    return { clock, step, pendingCount: () => pending.size, setNow: (toMs: number) => { nowMs = toMs; } };
};

const fakeRenderer = (): InkFrameRenderer & { draw: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> } => ({
    draw: vi.fn(),
    clear: vi.fn(),
});

describe("createInkPlayer", () => {
    it("should draw a frame of the scheduled blooms each animation frame while they run", () => {
        const { clock, step } = fakeClock();
        const renderer = fakeRenderer();
        const player = createInkPlayer(renderer, clock);

        player.play([BLOOM]);
        step(250);

        expect(renderer.draw).toHaveBeenCalledTimes(1);
        expect(renderer.draw).toHaveBeenLastCalledWith(bloomUniforms(scheduleEffects([], [BLOOM], 0), 250));
    });

    // The last frame stands on the canvas; no frame is asked for once nothing changes
    it("should draw the settled frame and stop asking for frames once every effect has run", () => {
        const { clock, step, pendingCount } = fakeClock();
        const renderer = fakeRenderer();
        const player = createInkPlayer(renderer, clock);

        player.play([BLOOM]);
        step(500);
        expect(pendingCount()).toBe(1);
        step(1000);

        expect(renderer.draw).toHaveBeenCalledTimes(2);
        expect(pendingCount()).toBe(0);
        expect(player.running).toBe(false);
    });

    it("should ask for one frame at a time, however many effects are played together", () => {
        const { clock, pendingCount } = fakeClock();
        const player = createInkPlayer(fakeRenderer(), clock);

        player.play([BLOOM]);
        player.play([BLOOM]);

        expect(pendingCount()).toBe(1);
        expect(player.running).toBe(true);
    });

    it("should time each effect from when it was played", () => {
        const { clock, step, setNow } = fakeClock();
        const renderer = fakeRenderer();
        const player = createInkPlayer(renderer, clock);

        setNow(2000);
        player.play([BLOOM]);
        step(2250);

        expect(renderer.draw).toHaveBeenLastCalledWith(bloomUniforms(scheduleEffects([], [BLOOM], 2000), 2250));
    });

    it("should wipe the canvas and forget the effects when cleared", () => {
        const { clock, pendingCount } = fakeClock();
        const renderer = fakeRenderer();
        const player = createInkPlayer(renderer, clock);

        player.play([BLOOM]);
        player.clear();

        expect(renderer.clear).toHaveBeenCalledTimes(1);
        expect(pendingCount()).toBe(0);
        expect(player.running).toBe(false);
    });

    it("should ask for no more frames once stopped", () => {
        const { clock, pendingCount } = fakeClock();
        const player = createInkPlayer(fakeRenderer(), clock);

        player.play([BLOOM]);
        player.stop();

        expect(pendingCount()).toBe(0);
    });
});
