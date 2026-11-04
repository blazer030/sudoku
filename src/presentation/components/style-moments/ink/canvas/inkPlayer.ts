import { inkFrame, isRunning, scheduleEffects, type InkEffect, type InkFrame, type ScheduledInkEffect } from "@/presentation/components/style-moments/ink/canvas/inkTimeline";

/** What the player draws through: one frame of the effects, or a wiped canvas. */
export interface InkFrameRenderer {
    draw: (frame: InkFrame) => void;
    clear: () => void;
}

/** The animation-frame clock, injected so the loop can be stepped in tests. */
export interface FrameClock {
    now: () => number;
    request: (callback: (nowMs: number) => void) => number;
    cancel: (handle: number) => void;
}

export interface InkPlayer {
    /** Plays effects from now, beside any still running. */
    play: (effects: readonly InkEffect[]) => void;
    /** Wipes the canvas and forgets every effect. */
    clear: () => void;
    /** Asks for no more frames; the canvas keeps its last one. */
    stop: () => void;
    readonly running: boolean;
}

export const browserFrameClock: FrameClock = {
    now: () => performance.now(),
    request: callback => requestAnimationFrame(callback),
    cancel: (handle) => { cancelAnimationFrame(handle); },
};

/**
 * Plays timed effects on the ink canvas: one animation frame at a time while any effect is changing, and none
 * once they have all run, so an idle board costs nothing; the settled frame stays on the canvas.
 */
export const createInkPlayer = (renderer: InkFrameRenderer, clock: FrameClock): InkPlayer => {
    let scheduled: ScheduledInkEffect[] = [];
    let pendingFrame: number | null = null;

    const cancelFrame = () => {
        if (pendingFrame !== null) clock.cancel(pendingFrame);
        pendingFrame = null;
    };

    const drawFrame = (nowMs: number) => {
        pendingFrame = null;
        renderer.draw(inkFrame(scheduled, nowMs));
        if (isRunning(scheduled, nowMs)) pendingFrame = clock.request(drawFrame);
    };

    return {
        play: (effects) => {
            scheduled = scheduleEffects(scheduled, effects, clock.now());
            pendingFrame ??= clock.request(drawFrame);
        },
        clear: () => {
            cancelFrame();
            scheduled = [];
            renderer.clear();
        },
        stop: cancelFrame,
        get running() {
            return pendingFrame !== null;
        },
    };
};
